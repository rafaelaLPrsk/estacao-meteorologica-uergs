import './PaginaSobre.css';
import logoUergs from '../assets/logo-uergs.png';

function PaginaSobre({ voltar }) {
    return (
        <div className="sobre-wrapper">

            {/* 1. CARTÃO PRINCIPAL COM O MAPA "VAZANDO" */}
            <div className="card-sobre">
                <div className="bloco-gps">
                    <iframe
                        className="mapa"
                        title="Localização da estação"
                        src="https://www.google.com/maps?q=Rua+Santa+Maria,+2300,+Jardim+dos+Lagos,+Gua%C3%ADba+-+RS&output=embed"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    />
                    <span className="texto-gps-interno">Rua Santa Maria, 2300 · Jardim dos Lagos, Guaíba - RS</span>
                </div>

                <div className="texto-sobre">
                    <h2>Sobre o projeto</h2>
                    <p>
                        O Tempo UERGS é um projeto de iniciação científica que observa e registra as condições do tempo 
                        inicialmente no bairro Jardim dos Lagos, em Guaíba-RS, com medições de temperatura, umidade, pressão, vento,
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