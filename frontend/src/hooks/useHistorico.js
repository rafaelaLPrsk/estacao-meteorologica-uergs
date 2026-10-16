import { buscarHistorico } from '../servicos/historico';
import { usePolling } from './usePolling';
import { DIAS } from '../dias';

const INICIAL = { dias: null };

// Últimos 7 dias com dados reais do banco. `dias[i]` é null quando o dia não tem dados completos.
export function useHistorico() {
    const { dias } = usePolling(buscarHistorico, INICIAL, 300000);
    return { DIAS, dias: dias ?? Array(7).fill(null), carregando: dias === null };
}
