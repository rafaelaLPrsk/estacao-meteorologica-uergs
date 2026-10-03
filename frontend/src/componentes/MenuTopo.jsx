import './MenuTopo.css';
import logoUergs from '../assets/logo.png';

function MenuTopo({ mudarPagina, paginaAtual }) {
    return (
        <header className="menu-container">
            <div className="logo-container">
                <img src={logoUergs} alt="Logo UERGS" className="logo-img" />
            </div>

            <div className="menu-navegacao">
                <h2 className="titulo-uergs">TEMPO UERGS</h2>
                <nav className="botoes-menu">
                    <button
                        className={`botao ${paginaAtual === 'agora' ? 'ativo' : ''}`}
                        onClick={() => mudarPagina('agora')}
                    >
                        AGORA
                    </button>
                    <button
                        className={`botao ${paginaAtual === 'historico' ? 'ativo' : ''}`}
                        onClick={() => mudarPagina('historico')}
                    >
                        HISTÓRICO
                    </button>
                    <button
                        className={`botao ${paginaAtual === 'comparativo' ? 'ativo' : ''}`}
                        onClick={() => mudarPagina('comparativo')}
                    >
                        COMPARATIVO
                    </button>
                    <button
                        className={`botao ${paginaAtual === 'sobre' ? 'ativo' : ''}`}
                        onClick={() => mudarPagina('sobre')}
                    >
                        SOBRE
                    </button>

                    <button
                        className={`botao ${paginaAtual === 'contato' ? 'ativo' : ''}`}
                        onClick={() => mudarPagina('contato')}
                    >
                        CONTATO
                    </button>

                </nav>
            </div>
        </header>
    );
}

export default MenuTopo;