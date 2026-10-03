import { useSensores } from '../hooks/useSensores';
import './CardSensores.css';
import iconeVento from '../assets/vel_vento.png';
import iconePressao from '../assets/pressão.png';
import iconeUv from '../assets/uv.png';
import iconeDirecao from '../assets/vel_direcao.png';
import iconeUmidade from '../assets/umidade.png';
import iconeLuminosidade from '../assets/luminosidade.png'

function CardSensores() {
    const s = useSensores();
    // null = leitura ausente ou fora da faixa válida (descartada pelo backend)
    const velocidadeVento = s.ventoVelocidade ?? '--';
    const pressao = s.pressao ?? '--';
    const uv = s.uv ?? '--';
    const direcaoVento = s.ventoDirecao ?? '--';
    const umidade = s.umidade ?? '--';
    const luminosidade = s.luminosidade ?? '--';

    return (
        <div className="card-container">
            <div className="grid-sensores">

                {/* Vento */}
                <div className="sensor-item">
                    <img src={iconeVento} alt="Vento" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">{velocidadeVento} km/h</span>
                        <span className="legenda-sensor">velocidade do vento</span>
                    </div>
                </div>

                {/* Pressão */}
                <div className="sensor-item">
                    <img src={iconePressao} alt="Pressão" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">{pressao} hPa</span>
                        <span className="legenda-sensor">Pressão</span>
                    </div>
                </div>

                {/* Índice UV */}
                <div className="sensor-item">
                    <img src={iconeUv} alt="UV" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">{uv}</span>
                        <span className="legenda-sensor">índice UV</span>
                    </div>
                </div>

                {/* Direção do Vento */}
                <div className="sensor-item">
                    <img src={iconeDirecao} alt="Direção" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">{direcaoVento}</span>
                        <span className="legenda-sensor">direção do vento</span>
                    </div>
                </div>

                {/* Umidade */}
                <div className="sensor-item">
                    <img src={iconeUmidade} alt="Umidade" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">{umidade}%</span>
                        <span className="legenda-sensor">Umidade</span>
                    </div>
                </div>

                {/* Luz */}
                <div className="sensor-item">
                    <img src={iconeLuminosidade} alt="Lux" className="icone-sensor icone-luz" />
                    <div>
                        <span className="valor-sensor">{luminosidade} lux</span>
                        <span className="legenda-sensor">Luminosidade</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CardSensores;
