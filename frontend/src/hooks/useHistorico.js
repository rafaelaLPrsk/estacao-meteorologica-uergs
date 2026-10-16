import { buscarHistorico } from '../servicos/historico';
import { usePolling } from './usePolling';
import { DIAS, SEMANA, horaria as horariaExemplo, deltaHoraria as deltaExemplo } from '../dadosExemplo';

const INICIAL = { dias: [] };

// Mesma interface do dadosExemplo, mas com dados reais do backend.
// Dias ainda sem leituras salvas continuam usando os dados de exemplo.
export function useHistorico() {
    const { dias } = usePolling(buscarHistorico, INICIAL, 300000);

    const semana = {};
    Object.keys(SEMANA).forEach((k) => {
        semana[k] = SEMANA[k].map((exemplo, i) => dias[i]?.resumo[k] ?? exemplo);
    });

    const horaria = (dia, metrica) => dias[dia]?.horaria[metrica] ?? horariaExemplo(dia, metrica);
    const deltaHoraria = (dia) => dias[dia]?.horaria.delta ?? deltaExemplo(dia);

    return { DIAS, SEMANA: semana, horaria, deltaHoraria };
}
