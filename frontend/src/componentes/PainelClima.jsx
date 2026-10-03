
import { useSensores } from '../hooks/useSensores';
import { useAnalise } from '../hooks/useAnalise';

//  importações de CSS e imagens
import './PainelClima.css';

// Ícones de linha (mesmo padrão dos ícones dos sensores)
const props = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconeSol = () => (
    <svg {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
const IconeNuvemSol = () => (
    <svg {...props} width="22" height="22"><path d="M12 2v1.5M4.9 4.9l1 1M2 11h1.5M20.5 11H22M19.1 4.9l-1 1" /><path d="M7.5 11a4.5 4.5 0 0 1 9 0" /><path d="M7 20h10a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 7 20z" /></svg>
);
const IconeGota = () => (
    <svg {...props}><path d="M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z" /></svg>
);

function PainelClima() {
    const s = useSensores();
    const analise = useAnalise();
    const temperatura = s.temperatura ?? '--';
    const chuva = s.chuva ?? '--';
    // Deixa claro se o dado é de agora ou o último registrado
    const quando = s.atualizadoEm ? new Date(s.atualizadoEm) : null;
    const hora = quando?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataHora = quando && `${quando.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`;
    const horaAtualizacao = s.status === 'agora' ? `Agora · atualizado às ${hora}`
        : quando ? `Últimos dados · ${dataHora}`
        : 'Últimos dados registrados';

    const diagnostico = analise.texto ?? 'Analisando o clima...';

    return (
        <div className="painel-clima-wrapper">
            <div className="bloco-esquerda">

                {/* LOCALIZAÇÃO E HORA DA ATUALIZAÇÃO */}
                <div className="localizacao-container">
                    <span className="badge-ao-vivo">
                        <span className="ponto-ao-vivo" /> ESTAÇÃO AO VIVO
                    </span>
                    <span className="texto-local">
                        GUAÍBA - JARDIM DOS LAGOS - {horaAtualizacao}
                    </span>
                </div>

                <div className="dados-principais">
                    {/* TEMPERATURA */}
                    <div className="item-clima">
                        <span className="icone-grande"><IconeSol /></span>
                        <span className="valor-temperatura">{temperatura}<small>°C</small></span>
                    </div>

                    {/* CHUVA */}
                    <div className="item-clima">
                        <span className="icone-grande"><IconeGota /></span>
                        <span className="valor-chuva">{chuva}<small>mm</small></span>
                    </div>

                    {/* DIAGNÓSTICO */}
                    <div className="diagnostico">
                        <span className="diagnostico-icone"><IconeNuvemSol /></span>
                        <div className="diagnostico-conteudo">
                            <span className="diagnostico-titulo">DIAGNÓSTICO ATMOSFÉRICO</span>
                            <span className="diagnostico-texto">{diagnostico}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default PainelClima;