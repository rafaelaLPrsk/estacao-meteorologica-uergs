import { buscarSensores } from '../servicos/api';
import { usePolling } from './usePolling';

// Últimos dados da estação (ou {} enquanto não chegam).
export const useSensores = (intervaloMs = 5000) => usePolling(buscarSensores, {}, intervaloMs);
