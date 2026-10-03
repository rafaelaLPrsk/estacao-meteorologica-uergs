
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

//  importações de CSS e imagens
import './PainelClima.css';
import iconeSol from '../assets/sol.png'; // Verifique se os nomes das suas imagens estão assim
import iconeGota from '../assets/gota.png';

function PainelClima() {
    // 2. As gavetas para a parte de cima
    const [temperatura, setTemperatura] = useState(0);
    const [chuva, setChuva] = useState(0);
    const [horaAtualizacao, setHoraAtualizacao] = useState('--:--');

    // 3. O ouvinte do Firebase
    useEffect(() => {
        const caminhos = {
            temp: ref(db, 'estacao/ESTACAO_001/sensores/temperatura/valor'),
            chuva: ref(db, 'estacao/ESTACAO_001/sensores/chuva/valor'),
            // Vamos usar o relógio do sensor de temperatura como referência geral
            timestamp: ref(db, 'estacao/ESTACAO_001/sensores/temperatura/timestamp')
        };

        // Escutando a temperatura e a chuva
        onValue(caminhos.temp, (snapshot) => setTemperatura(snapshot.val() ?? 0));
        onValue(caminhos.chuva, (snapshot) => setChuva(snapshot.val() ?? 0));

        // Escutando e formatando a hora
        onValue(caminhos.timestamp, (snapshot) => {
            const dataFirebase = snapshot.val();
            if (dataFirebase) {
                const data = new Date(dataFirebase);
                // Transforma "2026-09-29T11:42:00Z" em "11:42"
                const horaFormatada = data.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                setHoraAtualizacao(horaFormatada);
            }
        });
    }, []);

    return (
        <div className="painel-clima-wrapper">
            <div className="bloco-esquerda">

                {/* LOCALIZAÇÃO E HORA DA ATUALIZAÇÃO */}
                <div className="localizacao-container">
                    <span className="texto-local">
                        GUAÍBA - JARDIM DOS LAGOS - Atualizado às {horaAtualizacao}
                    </span>
                </div>

                <div className="dados-principais">
                    {/* TEMPERATURA */}
                    <div className="item-clima">
                        <img src={iconeSol} alt="Sol" className="icone-grande" />
                        <span className="valor-temperatura">{temperatura}°</span>
                    </div>

                    {/* CHUVA */}
                    <div className="item-clima">
                        <img src={iconeGota} alt="Chuva" className="icone-grande" />
                        <span className="valor-chuva">{chuva} mm</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default PainelClima;