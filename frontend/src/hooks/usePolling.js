import { useState, useEffect } from 'react';

// Chama `buscar` agora e a cada `intervaloMs`; devolve o último resultado (ou `inicial`).
export function usePolling(buscar, inicial, intervaloMs) {
    const [dados, setDados] = useState(inicial);

    useEffect(() => {
        let ativo = true;
        const atualizar = () => buscar().then((d) => ativo && setDados(d)).catch(() => {});
        atualizar();
        const id = setInterval(atualizar, intervaloMs);
        return () => { ativo = false; clearInterval(id); };
    }, [buscar, intervaloMs]);

    return dados;
}
