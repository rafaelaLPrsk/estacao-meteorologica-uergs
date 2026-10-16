// Atraso dos dados: até 5 min é tolerável; acima disso a tela mostra o último valor com um aviso.
export const TOLERANCIA_ATRASO_MIN = 5;
export const estaAtrasado = (min) => min != null && min > TOLERANCIA_ATRASO_MIN;

// Minutos inteiros desde um instante (ms ou texto ISO); null se não houver instante válido.
export function minutosDesde(valor, agora = Date.now()) {
    const t = typeof valor === 'number' ? valor : Date.parse(valor);
    return Number.isFinite(t) ? Math.max(0, Math.floor((agora - t) / 60000)) : null;
}

// 7 -> "7 min" | 65 -> "1 h 05 min" | 1500 -> "1 d 1 h"
export function duracao(min) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60), m = min % 60;
    if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
    return m ? `${h} h ${String(m).padStart(2, '0')} min` : `${h} h`;
}
