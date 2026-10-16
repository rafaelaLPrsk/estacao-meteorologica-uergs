import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, limitToLast, onValue, get } from 'firebase/database';

// Banco da estação (tempo-uergs): configuração pública, leitura direta pelo navegador (sem backend).
const app = initializeApp({
    apiKey: 'AIzaSyCY7Dg8dZgm0twrJVHk3XHibbEFrnDE_xc',
    authDomain: 'tempo-uergs.firebaseapp.com',
    databaseURL: 'https://tempo-uergs-default-rtdb.firebaseio.com',
    projectId: 'tempo-uergs',
    storageBucket: 'tempo-uergs.firebasestorage.app',
    messagingSenderId: '673346551715',
    appId: '1:673346551715:web:e2e1ef3c138fdafa31a416',
});
const db = getDatabase(app);

const ESTACAO = import.meta.env?.VITE_ESTACAO_ID ?? 'ESTACAO_001';
export const ATUAL_ATE_MS = 15 * 60 * 1000; // dado mais velho que isso deixa de ser "agora"

// Faixas fisicamente possíveis: fora delas a leitura é descartada (vira null). Igual ao backend.
const LIMITES = {
    temperatura: [-20, 55], umidade: [0, 100], pressao: [870, 1085],
    ventoVelocidade: [0, 200], uv: [0, 16], chuva: [0, 500], luminosidade: [0, 200000],
};
const valido = (campo, v) => typeof v === 'number' && Number.isFinite(v) && v >= LIMITES[campo][0] && v <= LIMITES[campo][1];

// Valor fora da faixa válida (ou ausente) vira null. O campo `ativo` da estação não é usado: o valor enviado é mostrado.
const pega = (campo, no) => (valido(campo, no?.valor) ? no.valor : null);

// Uma leitura crua do Firebase -> o formato que as telas usam (mesmo de /api/sensores).
export function interpretarLeitura(s, agora = Date.now()) {
    const segundos = Number(s?.dataHora?.timestamp);
    const ultimo = Number.isFinite(segundos) ? segundos * 1000 : null;
    const pa = s?.pressao?.pressurePa; // vem em Pa; a tela usa hPa
    return {
        temperatura: pega('temperatura', s?.humidade?.temperatura),
        umidade: pega('umidade', s?.humidade?.humidade),
        pressao: pega('pressao', typeof pa?.valor === 'number' ? { ...pa, valor: Math.round(pa.valor) / 100 } : null),
        chuva: pega('chuva', s?.chuva),
        uv: pega('uv', s?.uv),
        luminosidade: pega('luminosidade', s?.luminosidade),
        ventoVelocidade: pega('ventoVelocidade', s?.vento?.velocidade),
        ventoDirecao: s?.vento?.direcao?.valor ?? null,
        atualizadoEm: ultimo ? new Date(ultimo).toISOString() : null,
        // 'agora' = dado recente | 'ultimo' = último registro conhecido | 'desconhecido' = sem horário
        status: !ultimo ? 'desconhecido' : agora - ultimo <= ATUAL_ATE_MS ? 'agora' : 'ultimo',
    };
}

// Recebe em tempo real a leitura mais recente da estação. Devolve a função para parar de ouvir.
export function ouvirUltimaLeitura(aoReceber) {
    const consulta = query(ref(db, `estacao/${ESTACAO}/leituras`), limitToLast(1));
    return onValue(consulta, (snap) => {
        const leituras = snap.val();
        if (leituras) aoReceber(Object.values(leituras)[0]);
    }, (erro) => console.error('Firebase:', erro.message));
}

// Banco dados-openweather (histórico e análise gravados pela coleta): leitura pública, sem backend.
const appOw = initializeApp({
    databaseURL: 'https://dados-openweather-default-rtdb.asia-southeast1.firebasedatabase.app',
}, 'openweather');
const dbOw = getDatabase(appOw);

// Últimas `n` leituras salvas (as chaves do push são cronológicas).
export async function lerHistoricoBruto(n) {
    const snap = await get(query(ref(dbOw, 'historico'), limitToLast(n)));
    return Object.values(snap.val() ?? {});
}

export async function lerAnaliseAtual() {
    const snap = await get(ref(dbOw, 'analise_atual'));
    return snap.val() ?? { texto: null };
}
