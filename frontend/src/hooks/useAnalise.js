import { lerAnaliseAtual } from '../servicos/firebase';
import { usePolling } from './usePolling';

// Análise do clima do momento, gravada pela coleta no Firebase.
export const useAnalise = () => usePolling(lerAnaliseAtual, { texto: null }, 60000);
