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

    // Cada sensor vem como { valor, unidade, ativo }. Sensor desligado (ativo: false) ou fora da faixa vira null.
    const pega = (campo, no) => (no?.ativo !== false && valido(campo, no?.valor) ? no.valor : null);

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
        ventoDirecao: s.vento?.direcao?.ativo === false ? null : s.vento?.direcao?.valor ?? null,
        atualizadoEm: ultimo ? new Date(ultimo).toISOString() : null,
        // 'agora' = dado recente | 'ultimo' = último registro conhecido | 'desconhecido' = sem horário
        status: !ultimo ? 'desconhecido' : Date.now() - ultimo <= ATUAL_ATE_MS ? 'agora' : 'ultimo',
    };
}

// ---------- OpenWeather (referência oficial da cidade) ----------
export let oficialAtual = null;

async function lerOpenWeather() {
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
        pressao: em('pressao', j.main.pressure),
        vento: em('ventoVelocidade', j.wind.speed * 3.6), // m/s -> km/h
        condicao: j.weather?.[0]?.description ?? null,
    };
}

// ---------- Análise do momento ----------
function analisar(a, anterior) {
    const pressaoCaindo = anterior?.pressao != null && a.pressao != null && a.pressao < anterior.pressao;
    const esquentando = anterior?.temperatura != null && a.temperatura != null && a.temperatura > anterior.temperatura + 1;

    if (a.chuva > 0) return 'Chuva em andamento: pode haver acúmulo de água e redução da visibilidade.';
    if (pressaoCaindo && a.umidade > 80) return 'Pressão em queda e umidade alta: possibilidade de chuva nas próximas horas.';
    if (a.ventoVelocidade > 40) return 'Ventos fortes: atenção a rajadas e queda de objetos.';
    if (esquentando) return 'Temperatura subindo rapidamente: tendência de tempo mais quente nas próximas horas.';
    if (a.umidade != null && a.umidade < 40) return 'Ar muito seco: risco de desconforto respiratório e de focos de incêndio.';
    if (a.umidade == null && a.pressao == null) return 'Dados insuficientes para analisar o clima.';
    return 'Tempo estável: sem sinais de mudança brusca nas próximas horas.';
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
    try { oficialAtual = await lerOpenWeather() ?? oficialAtual; } catch (e) { console.error(e.message); }

    analiseAtual = { texto: analisar(s, anterior), status: s.status, atualizadoEm: s.atualizadoEm };

    // Dado velho não vai para o histórico (senão repete a mesma leitura a cada ciclo)
    if (s.status === 'ultimo') return console.log('Estação sem dados recentes, nada salvo.');
    // Mesma medição já salva (a estação ainda não enviou nada novo)
    if (anterior?.atualizadoEm && anterior.atualizadoEm === s.atualizadoEm) return console.log('Medição já salva, nada novo.');

    const ow = oficialAtual;
    const leitura = {
        timestamp: Date.now(), ...s,
        owTemp: ow?.temp ?? null, owUmidade: ow?.umidade ?? null, owPressao: ow?.pressao ?? null, owVento: ow?.vento ?? null,
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
