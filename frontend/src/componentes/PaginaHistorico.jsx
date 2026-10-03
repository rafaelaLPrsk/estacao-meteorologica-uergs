import './PaginaHistorico.css';
import { useState } from 'react';
import { useHistorico } from '../hooks/useHistorico';

const soma = (v) => v.reduce((a, b) => a + b, 0);
const media = (v) => soma(v) / v.length;

const ICONES = {
    temp: 'M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z',
    umidade: 'M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z',
    pressao: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 12l4-4',
    chuva: 'M7 15h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 15zM8 18v2M12 18v3M16 18v2',
    vento: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8',
};
const Icone = ({ d }) => (
    <svg className="hist-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const L = 400, A = 150, M = { e: 34, d: 12, c: 12, b: 24 };

// Gráfico base: linhas e/ou barras sobre o mesmo eixo
function Grafico({ rotulos, destaque, linhas = [], barras = null, zero = false }) {
    const todos = [...linhas.flatMap((l) => l.v), ...(barras ? barras.v : [])];
    let min = Math.floor(Math.min(...todos, zero ? 0 : Infinity));
    let max = Math.ceil(Math.max(...todos));
    if (!zero) { min -= 1; max += 1; }
    const n = rotulos.length;
    const passo = (L - M.e - M.d) / n;
    const x = (i) => M.e + passo * (i + 0.5);
    const y = (v) => A - M.b - ((v - min) / (max - min || 1)) * (A - M.b - M.c);
    const caminho = (v) => v.map((val, i) => `${i ? 'L' : 'M'}${x(i)},${y(val)}`).join(' ');

    return (
        <svg viewBox={`0 0 ${L} ${A}`} className="hist-grafico">
            {[min, (min + max) / 2, max].map((v) => (
                <g key={v}>
                    <line x1={M.e} x2={L - M.d} y1={y(v)} y2={y(v)} className="hist-grade" />
                    <text x={M.e - 5} y={y(v) + 3} textAnchor="end" className="hist-eixo">{Math.round(v)}</text>
                </g>
            ))}
            {rotulos.map((r, i) => (r === '' ? null : (
                <text key={i} x={x(i)} y={A - 7} textAnchor="middle" className={`hist-eixo ${i === destaque ? 'hist-hoje' : ''}`}>{r}</text>
            )))}
            {barras && barras.v.map((v, i) => (
                <rect key={i} x={x(i) - passo * 0.28} y={y(v)} width={passo * 0.56} height={Math.max(y(min) - y(v), 0)} rx="4"
                    className={i === destaque ? 'hist-barra hist-barra-hoje' : 'hist-barra'} />
            ))}
            {linhas.map((l) => (
                <g key={l.nome}>
                    <path d={caminho(l.v)} className={l.classe} />
                    {destaque >= 0 && <circle cx={x(destaque)} cy={y(l.v[destaque])} r="4" className={`${l.classe}-ponto`} />}
                </g>
            ))}
        </svg>
    );
}

function Resumo({ icone, titulo, valor, unidade, detalhe }) {
    return (
        <div className="hist-stat">
            <span className="hist-stat-topo"><Icone d={ICONES[icone]} /> {titulo}</span>
            <strong>{valor}<small>{unidade}</small></strong>
            <span className="hist-stat-detalhe">{detalhe}</span>
        </div>
    );
}

function Cartao({ titulo, sub, legenda, children }) {
    return (
        <section className="hist-bloco">
            <header>
                <h3>{titulo}</h3>
                <span className="hist-sub">{sub}</span>
            </header>
            <div className="hist-legenda">
                {legenda && legenda.map((l) => <span key={l.nome}><i className={l.classe} /> {l.nome}</span>)}
            </div>
            {children}
        </section>
    );
}

function PaginaHistorico() {
    const { DIAS, SEMANA, horaria } = useHistorico();
    const [dia, setDia] = useState(null); // null = semana toda
    const f = (n, c = 1) => n.toFixed(c);

    let tempMax, tempMin, umidade, pressao, chuva, vento, rotulos, destaque;
    let resumoTemp, resumoChuva;

    if (dia === null) {
        ({ tempMax, tempMin, umidade, pressao, chuva, vento } = SEMANA);
        rotulos = DIAS.map((d) => (d.hoje ? 'Hoje' : d.curto));
        destaque = 6;
        resumoTemp = [...tempMax, ...tempMin];
        resumoChuva = chuva;
    } else {
        const t = horaria(dia, 'temp');
        tempMax = t; tempMin = null;
        umidade = horaria(dia, 'umidade');
        pressao = horaria(dia, 'pressao');
        chuva = horaria(dia, 'chuva');
        vento = horaria(dia, 'vento');
        rotulos = t.map((_, h) => (h % 3 === 0 ? `${String(h).padStart(2, '0')}h` : ''));
        destaque = DIAS[dia].hoje ? t.length - 1 : -1;
        resumoTemp = t;
        resumoChuva = chuva;
    }

    const minMaxTemp = dia === null
        ? [Math.min(...tempMin), Math.max(...tempMax)]
        : [Math.min(...tempMax), Math.max(...tempMax)];

    return (
        <div className="hist-wrapper">
            <div className="hist-titulo">
                <h2>{dia === null ? 'Histórico semanal' : `Histórico de ${DIAS[dia].completo}`}</h2>
                <span className="hist-sub">
                    {dia === null
                        ? 'ÚLTIMOS 7 DIAS · DADOS MEDIDOS PELA ESTAÇÃO'
                        : `MEDIÇÕES HORA A HORA${DIAS[dia].hoje ? ' · DIA EM ANDAMENTO' : ''}`}
                </span>
            </div>

            <div className="hist-painel">
                <aside className="hist-dias">
                    <button className={`hist-dia hist-dia-semana ${dia === null ? 'ativo' : ''}`} onClick={() => setDia(null)}>
                        SEMANA TODA
                    </button>
                    {DIAS.map((d, i) => (
                        <button key={d.rotulo} className={`hist-dia ${dia === i ? 'ativo' : ''}`} onClick={() => setDia(i)}>
                            <span className="hist-dia-nome">{d.hoje ? 'Hoje' : d.rotulo}</span>
                            <span className="hist-dia-faixa">{SEMANA.tempMin[i].toFixed(0)}° / {SEMANA.tempMax[i].toFixed(0)}°</span>
                        </button>
                    ))}
                </aside>

                <div className="hist-conteudo" key={dia === null ? 'semana' : dia}>
            <div className="hist-resumos">
                <Resumo icone="temp" titulo="Temperatura média" valor={f(media(resumoTemp))} unidade="°C"
                    detalhe={`Mín ${f(minMaxTemp[0])}° · Máx ${f(minMaxTemp[1])}°`} />
                <Resumo icone="umidade" titulo="Umidade média" valor={f(media(umidade), 0)} unidade="%"
                    detalhe={`Mín ${f(Math.min(...umidade), 0)}% · Máx ${f(Math.max(...umidade), 0)}%`} />
                <Resumo icone="pressao" titulo="Pressão média" valor={f(media(pressao))} unidade="hPa"
                    detalhe={`Mín ${f(Math.min(...pressao))} · Máx ${f(Math.max(...pressao))}`} />
                <Resumo icone="chuva" titulo="Chuva acumulada" valor={f(soma(resumoChuva))} unidade="mm"
                    detalhe={dia === null ? `${chuva.filter((c) => c > 0).length} dias com chuva` : `${chuva.filter((c) => c > 0).length} h com chuva`} />
            </div>

            <div className="hist-grid">
                <Cartao titulo="Temperatura" sub={dia === null ? 'Máxima e mínima de cada dia (°C)' : 'Temperatura ao longo do dia (°C)'}
                    legenda={dia === null ? [{ nome: 'Máxima', classe: 'leg-max' }, { nome: 'Mínima', classe: 'leg-min' }] : null}>
                    <Grafico rotulos={rotulos} destaque={destaque} linhas={dia === null ? [
                        { nome: 'Máxima', v: tempMax, classe: 'hist-linha-max' },
                        { nome: 'Mínima', v: tempMin, classe: 'hist-linha-min' },
                    ] : [{ nome: 'Temperatura', v: tempMax, classe: 'hist-linha-max' }]} />
                </Cartao>

                <Cartao titulo="Chuva" sub={dia === null ? 'Acumulado diário (mm)' : 'Acumulado por hora (mm)'}>
                    <Grafico rotulos={rotulos} destaque={destaque} barras={{ v: chuva }} zero />
                </Cartao>

                <Cartao titulo="Umidade relativa" sub={dia === null ? 'Média diária (%)' : 'Hora a hora (%)'}>
                    <Grafico rotulos={rotulos} destaque={destaque} linhas={[{ nome: 'Umidade', v: umidade, classe: 'hist-linha-max' }]} />
                </Cartao>

                <Cartao titulo="Pressão barométrica" sub={dia === null ? 'Média diária (hPa)' : 'Hora a hora (hPa)'}>
                    <Grafico rotulos={rotulos} destaque={destaque} linhas={[{ nome: 'Pressão', v: pressao, classe: 'hist-linha-min' }]} />
                </Cartao>

                <Cartao titulo="Velocidade do vento" sub={dia === null ? 'Média diária (km/h)' : 'Hora a hora (km/h)'}>
                    <Grafico rotulos={rotulos} destaque={destaque} barras={{ v: vento }} zero />
                </Cartao>
            </div>
                </div>
            </div>
        </div>
    );
}

export default PaginaHistorico;
