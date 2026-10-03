import './PaginaSobre.css';
import logoUergs from '../assets/logo-uergs.png'; // A importação do seu novo logo!

function PaginaSobre({ voltar }) {
    return (
        <div className="sobre-wrapper">

            {/* 1. CARTÃO PRINCIPAL COM O GPS "VAZANDO" */}
            <div className="card-sobre">
                <div className="bloco-gps">
                    <div className="mapa-fake">
                        {/* Se tiver a imagem do mapa, pode colocar uma tag <img> aqui depois! */}
                    </div>
                    <span className="texto-gps-interno">GPS</span>
                </div>

                <div className="texto-sobre">
                    <p>
                        O Tempo Uergs é um projeto de iniciação científica produzido com objetivo de observação e coleta de dados do tempo local.
                        <br /><br />
                        A estação está localizada no bairro Jardim dos Lagos em Guaíba-RS.
                    </p>
                </div>
            </div>

            {/* 2. NOVO RODAPÉ COM 3 DIVISÕES */}
            <div className="rodape-sobre">
                {/* Esquerda: Logo UERGS */}
                <div className="rodape-logo">
                    <img src={logoUergs} alt="Logo UERGS" className="img-uergs" />
                </div>

                {/* Centro: Texto do Rodapé */}
                <div className="rodape-texto">
                    <p>
                        A Universidade Estadual do Rio Grande do Sul é uma instituição de ensino superior pública e multicampi, com vinte e quatro unidades distribuídas pelo estado brasileiro do Rio Grande do Sul.
                    </p>
                </div>

                {/* Direita: Seta de Voltar */}
                <div className="rodape-voltar">
                    <button className="botao-voltar" onClick={voltar}>
                        &#8617;
                    </button>
                </div>
            </div>

        </div>
    );
}

export default PaginaSobre;