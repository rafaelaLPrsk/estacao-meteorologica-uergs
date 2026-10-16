import { ref, get, query, limitToLast } from 'firebase/database';
import { db, dbOw } from './firebase.js';

const ESTACAO = process.env.ESTACAO_ID || 'ESTACAO_001';
const INTERVALO_MS = (Number(process.env.INTERVALO_MIN) || 5) * 60 * 1000;
const ATUAL_ATE_MS = 15 * 60 * 1000; // dado mais velho que isso deixa de ser "agora"

// Faixas fisicamente possíveis: fora delas a leitura é descartada (vira null).
const LIMITES = {
    temperatura: [-20, 55], umidade: [0, 100], pressao: [870, 1085],
    ventoVelocidade: [0, 200], uv: [0, 16], chuva: [0, 500], luminosidade: [0, 200000],
};
const valido = (campo, v) => typeof v === 'number' && Number.isFinite(v) && v >= LIMITES[campo][0] && v <= LIMITES[campo][1];

// ---------- Leitura da estação (banco tempo-uergs) ----------
export async function lerSensores() {
    const snap = await get(query(ref(db, `estacao/${ESTACAO}/leituras`), limitToLast(1)));
    const val = snap.val();
    if (!val) return null;

    const s = Object.values(val)[0];

    // Cada sensor vem como { valor, unidade, ativo }. Valor fora da faixa (ou ausente) vira null; o campo `ativo` não é usado.
    const pega = (campo, no) => (valido(campo, no?.valor) ? no.valor : null);

    // dataHora.timestamp é o horário da medição, em segundos
    const segundos = Number(s.dataHora?.timestamp);
    const ultimo = Number.isFinite(segundos) ? segundos * 1000 : null;

    const pa = s.pressao?.pressurePa; // vem em Pa; o sistema usa hPa
    const pressaoHpa = typeof pa?.valor === 'number' ? { ...pa, valor: Math.round(pa.valor) / 100 } : null;

    return {
        temperatura: pega('temperatura', s.humidade?.temperatura),
        umidade: pega('umidade', s.humidade?.humidade),
        pressao: pega('pressao', pressaoHpa),
        chuva: pega('chuva', s.chuva),
        uv: pega('uv', s.uv),
        luminosidade: pega('luminosidade', s.luminosidade),
        ventoVelocidade: pega('ventoVelocidade', s.vento?.velocidade),
        ventoDirecao: s.vento?.direcao?.valor ?? null,
        atualizadoEm: ultimo ? new Date(ultimo).toISOString() : null,
        // 'agora' = dado recente | 'ultimo' = último registro conhecido | 'desconhecido' = sem horário
        status: !ultimo ? 'desconhecido' : Date.now() - ultimo <= ATUAL_ATE_MS ? 'agora' : 'ultimo',
    };
}

// ---------- OpenWeather (referência oficial da cidade) ----------
export let oficialAtual = null;

export async function lerOpenWeather() {
    const { OPENWEATHER_KEY, OPENWEATHER_CIDADE = 'Guaiba,BR' } = process.env;
    if (!OPENWEATHER_KEY) return null;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(OPENWEATHER_CIDADE)}&units=metric&lang=pt_br&appid=${OPENWEATHER_KEY}`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`OpenWeather ${resposta.status}`);
    const j = await resposta.json();
    const em = (campo, v) => (valido(campo, v) ? v : null);
    return {
        temp: em('temperatura', j.main.temp),
        umidade: em('umidade', j.main.humidity),
        // grnd_level = pressão no nível do solo: é a comparável com o sensor, que mede a pressão no local
        pressao: em('pressao', j.main.grnd_level ?? j.main.pressure),
        pressaoMar: em('pressao', j.main.sea_level ?? j.main.pressure), // reduzida ao nível do mar
        vento: em('ventoVelocidade', j.wind.speed * 3.6), // m/s -> km/h
        condicao: j.weather?.[0]?.description ?? null,
        medidoEm: Number.isFinite(j.dt) ? j.dt * 1000 : null, // hora em que a OpenWeather mediu (ms), não a da consulta
    };
}

// ---------- Análise do momento ----------
// A frase usa TENDÊNCIA (comparação com ~3 h atrás), não duas leituras seguidas: a pressão oscila ±0,1 hPa
// por ruído do sensor, e isso fazia a frase trocar a cada leitura. Usa histerese (entra num limite, sai noutro).
const JANELA_TENDENCIA_H = 3;
const TOLERANCIA_JANELA_MS = 45 * 60 * 1000; // sem leitura a ~3 h (±45 min), não há tendência
const PRESSAO_QUEDA = { entra: 1, sai: 0.5 };   // hPa em 3 h (padrão meteorológico: ≥ 1 hPa/3 h já é queda)
const PRESSAO_QUEDA_RAPIDA = 3;                  // hPa em 3 h
const TEMPERATURA_VARIACAO = 3;                  // °C em 3 h
const UMIDADE_ALTA = { entra: 80, sai: 77 };     // %

// Leitura do histórico mais próxima de `horas` atrás (null se não houver uma por perto)
export function leituraDeHa(leituras, horas, referenciaMs) {
    const alvo = referenciaMs - horas * 3600000;
    let melhor = null, menor = Infinity;
    for (const l of leituras) {
        const d = Math.abs(l.timestamp - alvo);
        if (d < menor) { menor = d; melhor = l; }
    }
    return menor <= TOLERANCIA_JANELA_MS ? melhor : null;
}

// delta = pressão agora - pressão de 3 h atrás; `anterior` é o estado salvo na análise anterior
function tendenciaPressao(delta, anterior) {
    if (delta == null) return 'estavel';
    if (delta <= -PRESSAO_QUEDA.entra || (anterior === 'queda' && delta <= -PRESSAO_QUEDA.sai)) return 'queda';
    if (delta >= PRESSAO_QUEDA.entra || (anterior === 'alta' && delta >= PRESSAO_QUEDA.sai)) return 'alta';
    return 'estavel';
}

// a = leitura atual | passado = leitura de ~3 h atrás (ou null) | estadoAnterior = { pressao, umidadeAlta } da análise anterior
export function analisar(a, passado, estadoAnterior = {}) {
    const dP = a.pressao != null && passado?.pressao != null ? a.pressao - passado.pressao : null;
    const dT = a.temperatura != null && passado?.temperatura != null ? a.temperatura - passado.temperatura : null;
    const pressao = tendenciaPressao(dP, estadoAnterior.pressao);
    const umidadeAlta = a.umidade != null && (a.umidade > UMIDADE_ALTA.entra || (estadoAnterior.umidadeAlta === true && a.umidade > UMIDADE_ALTA.sai));
    const estado = { pressao, umidadeAlta };

    let texto;
    if (a.chuva > 0) texto = 'Chuva em andamento: pode haver acúmulo de água e redução da visibilidade.';
    else if (a.ventoVelocidade > 40) texto = 'Ventos fortes: atenção a rajadas e queda de objetos.';
    else if (dP != null && dP <= -PRESSAO_QUEDA_RAPIDA) texto = 'Pressão em queda rápida: risco de tempo instável ou tempestade nas próximas horas.';
    else if (pressao === 'queda' && umidadeAlta) texto = 'Pressão em queda e umidade alta: possibilidade de chuva nas próximas horas.';
    else if (pressao === 'queda') texto = 'Pressão em queda: o tempo tende a ficar instável.';
    else if (dT != null && dT >= TEMPERATURA_VARIACAO) texto = 'Temperatura subindo rapidamente: tendência de tempo mais quente nas próximas horas.';
    else if (dT != null && dT <= -TEMPERATURA_VARIACAO) texto = 'Temperatura caindo rapidamente: tendência de tempo mais frio nas próximas horas.';
    else if (a.umidade != null && a.umidade < 40) texto = 'Ar muito seco: risco de desconforto respiratório e de focos de incêndio.';
    else if (a.umidade == null && a.pressao == null) texto = 'Dados insuficientes para analisar o clima.';
    else if (pressao === 'alta') texto = 'Pressão em alta: tendência de tempo firme e estável.';
    else texto = 'Tempo estável: sem sinais de mudança brusca nas próximas horas.';
    return { texto, estado };
}

// A análise só é recalculada a cada 5 min (lê ~3 h de histórico, então poupa tráfego do Firebase)
const ANALISE_A_CADA_MS = 5 * 60 * 1000;

async function analiseDoMomento(s) {
    const salva = (await dbOw.ref('analise_atual').once('value')).val();
    if (salva?.texto && salva.calculadoEm && Date.now() - salva.calculadoEm < ANALISE_A_CADA_MS) {
        return { ...salva, status: s.status, atualizadoEm: s.atualizadoEm };
    }
    const snap = await dbOw.ref('historico').limitToLast(220).once('value');
    const passado = leituraDeHa(Object.values(snap.val() ?? {}), JANELA_TENDENCIA_H, Date.parse(s.atualizadoEm) || Date.now());
    const { texto, estado } = analisar(s, passado, salva?.estado);
    return { texto, estado, status: s.status, atualizadoEm: s.atualizadoEm, calculadoEm: Date.now() };
}

// ---------- Coletor: estação + OpenWeather -> análise -> salva no banco dados-openweather ----------
export let analiseAtual = { texto: null, status: 'desconhecido', atualizadoEm: null };

// Última leitura salva no histórico (o coletor não guarda estado: roda no servidor ou, avulso, no GitHub Actions)
async function ultimaDoHistorico() {
    const snap = await dbOw.ref('historico').limitToLast(1).once('value');
    return Object.values(snap.val() ?? {})[0] ?? null;
}

export async function coletar() {
    const s = await lerSensores();
    if (!s) return;

    const anterior = await ultimaDoHistorico();

    // Dado velho não vai para o histórico (senão repete a mesma leitura a cada ciclo)
    if (s.status === 'ultimo') {
        analiseAtual = { texto: 'Estação sem dados recentes: análise indisponível.', status: s.status, atualizadoEm: s.atualizadoEm };
        return console.log('Estação sem dados recentes, nada salvo.');
    }
    // Mesma medição já salva (a estação ainda não enviou nada novo)
    if (anterior?.atualizadoEm && anterior.atualizadoEm === s.atualizadoEm) return console.log('Medição já salva, nada novo.');

    analiseAtual = await analiseDoMomento(s);

    // A OpenWeather só é consultada quando há medição nova para salvar (poupa a cota da API)
    // Se a consulta falhar, a OpenWeather fica null (nunca reaproveita o valor antigo); a leitura da estação é salva igual
    try { oficialAtual = await lerOpenWeather(); } catch (e) { oficialAtual = null; console.error(e.message); }
    const ow = oficialAtual;
    const leitura = {
        timestamp: Date.now(), ...s,
        owTemp: ow?.temp ?? null, owUmidade: ow?.umidade ?? null, owPressao: ow?.pressaoMar ?? null, owPressaoSolo: ow?.pressao ?? null, owVento: ow?.vento ?? null, owCondicao: ow?.condicao ?? null, owMedidoEm: ow?.medidoEm ?? null,
    };
    await dbOw.ref('historico').push(leitura);
    await dbOw.ref('analise_atual').set(analiseAtual);
    console.log(`📊 ${analiseAtual.texto}`);
}

export function iniciarColetor() {
    const rodar = () => coletar().catch((e) => console.error('Falha na coleta:', e.message));
    rodar();
    setInterval(rodar, INTERVALO_MS);
}

// ---------- Histórico: 7 dias hora a hora, para os gráficos ----------
const soma = (v) => v.reduce((a, b) => a + b, 0);
const media = (v) => soma(v) / v.length;

// Média por hora; horas sem leitura repetem o último valor conhecido.
function porHora(leituras, campo, ateHora) {
    const horas = Array.from({ length: 24 }, () => []);
    leituras.forEach((l) => { if (typeof l[campo] === 'number') horas[new Date(l.timestamp).getHours()].push(l[campo]); });
    let ultimo = null;
    const saida = Array.from({ length: ateHora + 1 }, (_, h) => (ultimo = horas[h].length ? media(horas[h]) : ultimo));
    const primeiro = saida.find((v) => v !== null);
    return primeiro === undefined ? null : saida.map((v) => v ?? primeiro);
}

function resumoDoDia(leituras, ate) {
    const h = (campo) => porHora(leituras, campo, ate);
    const horaria = { temp: h('temperatura'), umidade: h('umidade'), pressao: h('pressao'), vento: h('ventoVelocidade'), chuva: h('chuva') };
    // Dia incompleto (sensor sem dados) cai para o exemplo no frontend
    if (Object.values(horaria).some((v) => !v)) return null;

    const comparaveis = leituras
        .filter((l) => typeof l.owTemp === 'number' && typeof l.temperatura === 'number')
        .map((l) => ({ timestamp: l.timestamp, d: l.temperatura - l.owTemp }));
    horaria.delta = comparaveis.length ? porHora(comparaveis, 'd', ate) : null;

    return {
        resumo: {
            tempMax: Math.max(...horaria.temp), tempMin: Math.min(...horaria.temp),
            umidade: media(horaria.umidade), pressao: media(horaria.pressao),
            chuva: soma(horaria.chuva), vento: media(horaria.vento),
        },
        horaria,
    };
}

export async function lerHistorico() {
    const agora = new Date();
    const inicio = new Date(agora);
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - 6);

    const snap = await dbOw.ref('historico').limitToLast(2500).once('value');
    // As chaves do push são cronológicas: as últimas 2500 leituras cobrem os 7 dias (a 5 min cada)
    const leituras = Object.values(snap.val() ?? {});

    const dias = Array.from({ length: 7 }, (_, i) => {
        const ini = new Date(inicio); ini.setDate(ini.getDate() + i);
        const fim = new Date(ini); fim.setDate(fim.getDate() + 1);
        const doDia = leituras.filter((l) => l.timestamp >= ini.getTime() && l.timestamp < fim.getTime());
        return doDia.length ? resumoDoDia(doDia, i === 6 ? agora.getHours() : 23) : null;
    });
    return { dias };
}

// ---------- Comparativo: estação x OpenWeather (agora + últimas 12 h em 7 pontos) ----------
const PONTOS = 7, PASSO_H = 2;

// Média das leituras em volta de cada ponto (a cada 2 h até agora); lacunas repetem o vizinho.
function serie(leituras, campo) {
    const fim = Date.now(), meio = (PASSO_H * 3600000) / 2;
    const pontos = Array.from({ length: PONTOS }, (_, i) => {
        const centro = fim - (PONTOS - 1 - i) * PASSO_H * 3600000;
        const v = leituras.filter((l) => Math.abs(l.timestamp - centro) <= meio && typeof l[campo] === 'number').map((l) => l[campo]);
        return v.length ? media(v) : null;
    });
    const primeiro = pontos.find((v) => v !== null);
    if (primeiro === undefined) return null;
    let ultimo = primeiro;
    return pontos.map((v) => (ultimo = v ?? ultimo));
}

export async function lerComparativo() {
    const s = await lerSensores();
    const snap = await dbOw.ref('historico').limitToLast(200).once('value');
    const leituras = Object.values(snap.val() ?? {});
    const par = (local, oficial) => {
        const l = serie(leituras, local), o = serie(leituras, oficial);
        return l && o ? { local: l, oficial: o } : null;
    };
    return {
        local: s && { temp: s.temperatura, umidade: s.umidade, pressao: s.pressao, vento: s.ventoVelocidade, status: s.status, atualizadoEm: s.atualizadoEm },
        oficial: oficialAtual,
        series: { temp: par('temperatura', 'owTemp'), umidade: par('umidade', 'owUmidade'), pressao: par('pressao', 'owPressao') },
    };
}
