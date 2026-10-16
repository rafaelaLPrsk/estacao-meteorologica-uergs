import { lerHistoricoBruto } from './firebase';

// Cálculos de histórico (7 dias, hora a hora) e comparativo (estação x OpenWeather),
// feitos no navegador a partir das leituras que a coleta salva no Firebase.

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
    // Dia sem alguma das métricas não é mostrado (a tela exibe "sem dados")
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

export async function buscarHistorico() {
    const agora = new Date();
    const inicio = new Date(agora);
    inicio.setHours(0, 0, 0, 0);
    inicio.setDate(inicio.getDate() - 6);

    const leituras = await lerHistoricoBruto(2500); // cobre ~7 dias a 5 min cada

    const dias = Array.from({ length: 7 }, (_, i) => {
        const ini = new Date(inicio); ini.setDate(ini.getDate() + i);
        const fim = new Date(ini); fim.setDate(fim.getDate() + 1);
        const doDia = leituras.filter((l) => l.timestamp >= ini.getTime() && l.timestamp < fim.getTime());
        return doDia.length ? resumoDoDia(doDia, i === 6 ? agora.getHours() : 23) : null;
    });
    return { dias };
}

// ---------- Comparativo: agora + últimas 12 h em 7 pontos ----------
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

export async function buscarComparativo() {
    const leituras = await lerHistoricoBruto(200);
    const par = (local, oficial) => {
        const l = serie(leituras, local), o = serie(leituras, oficial);
        return l && o ? { local: l, oficial: o } : null;
    };
    const ultima = leituras.at(-1);
    // Os dois lados vêm do MESMO registro salvo, então são da mesma hora (comparação justa).
    const idadeMin = ultima ? (Date.now() - Date.parse(ultima.atualizadoEm)) / 60000 : null;
    return {
        local: ultima && {
            temp: ultima.temperatura ?? null, umidade: ultima.umidade ?? null, pressao: ultima.pressao ?? null,
            vento: ultima.ventoVelocidade ?? null,
            status: !Number.isFinite(idadeMin) ? 'desconhecido' : idadeMin <= 15 ? 'agora' : 'ultimo',
            atualizadoEm: ultima.atualizadoEm,
        },
        // OpenWeather da mesma coleta. Pressão: nível do solo (owPressaoSolo), comparável ao sensor;
        // owPressao (nível do mar) é de antes de 16/10 e fica só como referência.
        oficial: ultima && ultima.owTemp != null
            ? {
                temp: ultima.owTemp, umidade: ultima.owUmidade, pressao: ultima.owPressaoSolo ?? ultima.owPressao,
                vento: ultima.owVento, condicao: ultima.owCondicao ?? null, coletadoEm: ultima.timestamp,
            }
            : null,
        series: { temp: par('temperatura', 'owTemp'), umidade: par('umidade', 'owUmidade'), pressao: par('pressao', 'owPressaoSolo') },
    };
}
