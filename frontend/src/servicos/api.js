const BASE = import.meta.env.VITE_API_URL ?? '/api';

export async function buscarSensores() {
    const resposta = await fetch(`${BASE}/sensores`);
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    return resposta.json();
}

export const buscarAnalise = () => fetch(`${BASE}/analise`).then((r) => r.json());
export const buscarHistorico = () => fetch(`${BASE}/historico`).then((r) => r.json());
export const buscarComparativo = () => fetch(`${BASE}/comparativo`).then((r) => r.json());
