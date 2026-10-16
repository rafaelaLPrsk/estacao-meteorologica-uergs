import { useState, useEffect, useMemo } from 'react';
import { ouvirUltimaLeitura, interpretarLeitura } from '../servicos/firebase';

// Últimos dados da estação, lidos direto do Firebase em tempo real (ou {} enquanto não chegam).
export function useSensores() {
    const [leitura, setLeitura] = useState(null);
    const [agora, setAgora] = useState(Date.now());

    useEffect(() => ouvirUltimaLeitura(setLeitura), []);
    // Reavalia o status (agora / último registro) mesmo sem leitura nova
    useEffect(() => {
        const id = setInterval(() => setAgora(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);

    return useMemo(() => (leitura ? interpretarLeitura(leitura, agora) : {}), [leitura, agora]);
}
