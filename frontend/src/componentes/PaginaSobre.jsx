import './PaginaSobre.css';
import { useState } from 'react';
import logoUergs from '../assets/logo-uergs.png';
import fotoEstacao from '../assets/estacao_rua.jpg';
import sensorChuva from '../assets/sensor_chuva.jpeg';
import sensorDirecaoVento from '../assets/sensor_direcao_vento.jpeg';
import sensorSteverson from '../assets/sensor_steverson.jpeg';
import sensorVelocidadeVento from '../assets/sensor_velocidade_vento.jpeg';

const imagensSobre = [
    {
        src: fotoEstacao,
        titulo: 'Estação meteorológica · UERGS Guaíba',
        //alt: 'Estação meteorológica da UERGS Guaíba',
    },
    {
        src: sensorChuva,
        titulo: 'Sensor de chuva',
        //alt: 'Sensor de chuva da estação meteorológica',
    },
    {
        src: sensorDirecaoVento,
        titulo: 'Sensor de direção do vento',
        //alt: 'Sensor de direção do vento instalado na estação',
    },
    {
        src: sensorSteverson,
        titulo: 'Abrigo Stevenson · UV, umidade, pressão e temperatura ',
        //alt: 'Abrigo Stevenson da estação meteorológica',
    },
    {
        src: sensorVelocidadeVento,
        titulo: 'Sensor de velocidade do vento',
        //alt: 'Anemômetro para medir a velocidade do vento',
    },
];

function PaginaSobre({ voltar }) {
    const [imagemAtual, setImagemAtual] = useState(0);
    const imagem = imagensSobre[imagemAtual];

    function navegarImagens(direcao) {
        setImagemAtual((atual) => (atual + direcao + imagensSobre.length) % imagensSobre.length);
    }

    return (
        <div className="sobre-wrapper">

            {/* 1. CARTÃO PRINCIPAL COM A FOTO DA ESTAÇÃO */}
            <div className="card-sobre">
                <div className="bloco-gps" aria-label="Fotos da estação e dos sensores">
                    <div className="carrossel-foto">
                        <img className="foto-carrossel" src={imagem.src} alt={imagem.alt} />
                        <button
                            className="seta-carrossel seta-anterior"
                            type="button"
                            aria-label="Imagem anterior"
                            onClick={() => navegarImagens(-1)}
                        >
                            <span aria-hidden="true">‹</span>
                        </button>
                        <button
                            className="seta-carrossel seta-proxima"
                            type="button"
                            aria-label="Próxima imagem"
                            onClick={() => navegarImagens(1)}
                        >
                            <span aria-hidden="true">›</span>
                        </button>
                    </div>
                    <div className="legenda-carrossel" aria-live="polite">
                        {imagem.descricao ? (
                            <p><strong>{imagem.titulo}:</strong> {imagem.descricao}</p>
                        ) : (
                            <h3>{imagem.titulo}</h3>
                        )}
                    </div>
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