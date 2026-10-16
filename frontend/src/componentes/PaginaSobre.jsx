import './PaginaSobre.css';
import logoUergs from '../assets/logo-uergs.png';
import fotoEstacao from '../assets/estacao.jpg';

function PaginaSobre({ voltar }) {
    return (
        <div className="sobre-wrapper">

            {/* 1. CARTÃO PRINCIPAL COM A FOTO DA ESTAÇÃO */}
            <div className="card-sobre">
                <div className="bloco-gps">
                    <img className="foto-estacao" src={fotoEstacao} alt="Estação meteorológica da UERGS Guaíba" />
                    <span className="texto-gps-interno">Estação meteorológica · UERGS Guaíba</span>
                </div>

                <div className="texto-sobre">
                    <h2>Sobre o projeto</h2>
                    <p>
                        O Tempo UERGS é uma estação meterológica que coleta e armaneza as condições do tempo.
                        Está instalada no bairro Jardim dos Lagos, na unidade da Universidade Estadual do Rio Grande do Sul de Guaíba, fazendo medições de temperatura, umidade, pressão, vento,
                        chuva, radiação UV e luminosidade.
                    </p>
                    <p>
                        A estação foi construída com sensores de baixo custo e, para validar a sua precisão, seus dados
                        são comparados com os de uma fonte oficial, o que permite acompanhar o desvio entre as duas medições.
                    </p>
                    <div className="etiquetas-sobre">
                        
                        <span>Baixo custo</span>
                        <span>Comparativo com dados oficiais</span>
                    </div>
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