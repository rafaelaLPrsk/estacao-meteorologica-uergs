import { DIAS } from '../dias';
import './SeletorDia.css';

// Barra para percorrer os dias da semana (valor null = semana toda)
function SeletorDia({ valor, onChange }) {
    return (
        <div className="seletor-dia">
            {DIAS.map((d, i) => (
                <button key={d.rotulo} className={valor === i ? 'ativo' : ''} onClick={() => onChange(i)}>
                    {d.hoje ? 'Hoje' : d.rotulo}
                </button>
            ))}
            <span className="seletor-separador" />
            <button className={`seletor-semana ${valor === null ? 'ativo' : ''}`} onClick={() => onChange(null)}>
                SEMANA TODA
            </button>
        </div>
    );
}

export default SeletorDia;
