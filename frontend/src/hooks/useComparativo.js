import { buscarComparativo } from '../servicos/historico';
import { usePolling } from './usePolling';
import { useSensores } from './useSensores';
import { COMPARATIVO_EXEMPLO as EX } from '../dadosExemplo';

// Estação x OpenWeather. O que ainda não tem dados salvos (ex.: séries sem histórico) usa o exemplo.
export function useComparativo() {
    const d = usePolling(buscarComparativo, null, 60000);
    const s = useSensores();
    const local = s.status
        ? { temp: s.temperatura, umidade: s.umidade, pressao: s.pressao, vento: s.ventoVelocidade, status: s.status, atualizadoEm: s.atualizadoEm }
        : EX.local;
    return {
        local,
        oficial: d?.oficial ?? EX.oficial,
        series: {
            temp: d?.series.temp ?? EX.series.temp,
            pressao: d?.series.pressao ?? EX.series.pressao,
            umidade: d?.series.umidade ?? EX.series.umidade,
        },
    };
}
