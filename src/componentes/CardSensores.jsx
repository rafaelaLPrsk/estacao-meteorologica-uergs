// 1. Importa as ferramentas de memória e escuta do React
import { useState, useEffect } from 'react';

// 2. Importa as ferramentas de leitura do Firebase
import { ref, onValue } from 'firebase/database';

// 3. Importa a chave de banco de dados
import { db } from '../firebase';




import './CardSensores.css';
import iconeVento from '../assets/vel_vento.png';
import iconePressao from '../assets/pressão.png';
import iconeUv from '../assets/uv.png';
import iconeDirecao from '../assets/vel_direcao.png';
import iconeUmidade from '../assets/umidade.png';
import iconeLuminosidade from '../assets/luminosidade.png'

function CardSensores() {
    // 1. AS GAVETAS (Criando espaço na memória para os 6 sensores do cartão)
    const [velocidadeVento, setVelocidadeVento] = useState(0);
    const [pressao, setPressao] = useState(0);
    const [uv, setUv] = useState('-');
    const [direcaoVento, setDirecaoVento] = useState('-');
    const [umidade, setUmidade] = useState(0);
    const [luminosidade, setLuminosidade] = useState(0);

    // 2. O OUVINTE (Conectando ao Firebase)
    useEffect(() => {
        // O mapa exato que você enviou ao seu colega do ESP32
        const caminhos = {
            ventoVel: ref(db, 'estacao/ESTACAO_001/sensores/vento/velocidade/valor'),
            pressao: ref(db, 'estacao/ESTACAO_001/sensores/pressao_atm/valor'),
            uv: ref(db, 'estacao/ESTACAO_001/sensores/uv/valor'),
            ventoDir: ref(db, 'estacao/ESTACAO_001/sensores/vento/direcao/valor'),
            umidade: ref(db, 'estacao/ESTACAO_001/sensores/umidade/valor'),
            luz: ref(db, 'estacao/ESTACAO_001/sensores/luminosidade/valor')
        };

        // Ligando a escuta para cada um deles
        onValue(caminhos.ventoVel, (snapshot) => setVelocidadeVento(snapshot.val() ?? 0));
        onValue(caminhos.pressao, (snapshot) => setPressao(snapshot.val() ?? 0));
        onValue(caminhos.uv, (snapshot) => setUv(snapshot.val() ?? '-'));
        onValue(caminhos.ventoDir, (snapshot) => setDirecaoVento(snapshot.val() ?? '-'));
        onValue(caminhos.umidade, (snapshot) => setUmidade(snapshot.val() ?? 0));
        onValue(caminhos.luz, (snapshot) => setLuminosidade(snapshot.val() ?? 0));
    }, []);

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






    return (
        <div className="card-container">
            <div className="grid-sensores">
                {/* Vento */}
                <div className="sensor-item">
                    <img src={iconeVento} alt="Vento" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">12 km/h</span>
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
                        <span className="valor-sensor">Baixo</span>
                        <span className="legenda-sensor">índice UV</span>
                    </div>
                </div>

                {/* Direção do Vento */}
                <div className="sensor-item">
                    <img src={iconeDirecao} alt="Direção" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">Norte</span>
                        <span className="legenda-sensor">direção do vento</span>
                    </div>
                </div>

                {/* Umidade */}
                <div className="sensor-item">
                    <img src={iconeUmidade} alt="Umidade" className="icone-sensor" />
                    <div>
                        <span className="valor-sensor">40%</span>
                        <span className="legenda-sensor">Umidade</span>
                    </div>
                </div>

                    {/* Luz */}
                    <div className="sensor-item">
                        <img src={iconeLuminosidade} alt="Lux" className="icone-sensor icone-luz" />
                        <div>
                            <span className="valor-sensor">1000</span>
                            <span className="legenda-sensor">Luminosidade</span>
                        </div>
                    </div>

            </div>
        </div>
    );
}

export default CardSensores;