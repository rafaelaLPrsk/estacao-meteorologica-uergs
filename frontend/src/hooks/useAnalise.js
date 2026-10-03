import { buscarAnalise } from '../servicos/api';
import { usePolling } from './usePolling';

// Análise do clima do momento, gerada pelo backend.
export const useAnalise = () => usePolling(buscarAnalise, { texto: null }, 30000);
