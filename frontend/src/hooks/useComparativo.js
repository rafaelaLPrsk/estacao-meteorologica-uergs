import { buscarComparativo } from '../servicos/historico';
import { usePolling } from './usePolling';

// Estação x OpenWeather do mesmo registro salvo (mesma hora). O que não existe vem null (a tela mostra "sem dados").
export function useComparativo() {
    const d = usePolling(buscarComparativo, null, 60000);
    return {
        local: d?.local ?? null,
        oficial: d?.oficial ?? null,
        series: {
            temp: d?.series.temp ?? null,
            pressao: d?.series.pressao ?? null,
            umidade: d?.series.umidade ?? null,
        },
    };
}
