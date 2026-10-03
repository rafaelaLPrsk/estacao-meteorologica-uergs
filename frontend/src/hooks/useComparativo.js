import { buscarComparativo } from '../servicos/api';
import { usePolling } from './usePolling';
import { COMPARATIVO_EXEMPLO as EX } from '../dadosExemplo';

// Estação x OpenWeather. O que o backend ainda não tem (ex.: séries sem histórico) usa o exemplo.
export function useComparativo() {
    const d = usePolling(buscarComparativo, null, 30000);
    return {
        local: d?.local ?? EX.local,
        oficial: d?.oficial ?? EX.oficial,
        series: {
            temp: d?.series.temp ?? EX.series.temp,
            pressao: d?.series.pressao ?? EX.series.pressao,
            umidade: d?.series.umidade ?? EX.series.umidade,
        },
    };
}
