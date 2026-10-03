import { useState } from 'react';
import SeletorDia from './SeletorDia';
import { useHistorico } from '../hooks/useHistorico';
import { useComparativo } from '../hooks/useComparativo';
import './PaginaComparativo.css';

// Rótulos do eixo: de 2 em 2 horas, terminando em "Agora"
const rotulosHoras = () => Array.from({ length: 7 }, (_, i) => {
    if (i === 6) return 'Agora';
    const h = new Date(Date.now() - (6 - i) * 2 * 3600000).getHours();
    return `${String(h).padStart(2, '0')}:00`;
});

const METRICAS = {
    temp: { rotulo: 'Temperatura', unidade: '°C' },
    pressao: { rotulo: 'Pressão', unidade: 'hPa' },
    umidade: { rotulo: 'Umidade', unidade: '%' },
};

// Ícones de linha (mesmo padrão da aba Agora)
const ICONES = {
    antena: 'M5 12.5a7 7 0 0 1 0-9M19 3.5a7 7 0 0 1 0 9M8.5 9.5a3 3 0 0 1 0-3M15.5 6.5a3 3 0 0 1 0 3M12 8v13',
    nuvem: 'M7 19h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 19z',
    delta: 'M4 12h6M7 9l3 3-3 3M20 12h-6M17 9l-3 3 3 3',
    info: 'M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
    temp: 'M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z',
    umidade: 'M12 3s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.2 12 3 12 3z',
    pressao: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 12l4-4',
    vento: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8',
};
const Icone = ({ d }) => (
    <svg className="comp-icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const media = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const desvioPadrao = (v) => {
    if (v.length < 2) return null;
    const m = media(v);
    return Math.sqrt(media(v.map((x) => (x - m) ** 2)));
};
const sinal = (n, casas = 1) => `${n > 0 ? '+' : ''}${n.toFixed(casas)}`;

function Grafico({ serie }) {
    const L = 600, A = 220, M = { e: 40, d: 20, c: 20, b: 30 };
    const { local, oficial } = serie;
    const HORAS = rotulosHoras();
    const todos = [...local, ...oficial];
    const min = Math.floor(Math.min(...todos) - 1);
    const max = Math.ceil(Math.max(...todos) + 1);
    const n = local.length - 1;
    const x = (i) => M.e + (i / n) * (L - M.e - M.d);
    const y = (v) => A - M.b - ((v - min) / (max - min)) * (A - M.b - M.c);
    const linha = (v) => v.map((val, i) => `${i ? 'L' : 'M'}${x(i)},${y(val)}`).join(' ');

    return (
        <svg viewBox={`0 0 ${L} ${A}`} className="comp-grafico">
            <defs>
                <linearGradient id="comp-degrade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
                </linearGradient>
            </defs>
            {[min, (min + max) / 2, max].map((v) => (
                <g key={v}>
                    <line x1={M.e} x2={L - M.d} y1={y(v)} y2={y(v)} className="comp-grade" />
                    <text x={M.e - 6} y={y(v) + 4} textAnchor="end" className="comp-eixo">{Math.round(v)}</text>
                </g>
            ))}
            {HORAS.map((h, i) => (
                <text key={h} x={x(i)} y={A - 8} textAnchor="middle" className="comp-eixo">{h}</text>
            ))}
            <path d={`${linha(local)} L${x(n)},${A - M.b} L${x(0)},${A - M.b} Z`} className="comp-area-local" />
            <path d={linha(oficial)} className="comp-linha-oficial" />
            <path d={linha(local)} className="comp-linha-local" />
            <circle cx={x(n)} cy={y(local[n])} r="5" className="comp-ponto-local" />
            <circle cx={x(n)} cy={y(oficial[n])} r="5" className="comp-ponto-oficial" />
        </svg>
    );
}

const TOLERANCIA = 6;

const pearson = (a, b) => {
    const ma = media(a), mb = media(b);
    const num = a.reduce((t, v, i) => t + (v - ma) * (b[i] - mb), 0);
    const den = Math.sqrt(a.reduce((t, v) => t + (v - ma) ** 2, 0) * b.reduce((t, v) => t + (v - mb) ** 2, 0));
    return den ? num / den : 0;
};

// Discrepância (estação - OpenWeather) por faixa horária ou por dia, com taxa de acerto
function Discrepancia() {
    const { DIAS, horaria, deltaHoraria } = useHistorico();
    const [dia, setDia] = useState(6);
    const dias = dia === null ? DIAS.map((_, i) => i) : [dia];
    const deltas = dias.flatMap((d) => deltaHoraria(d));
    const locais = dias.flatMap((d) => horaria(d, 'temp'));
    const oficiais = locais.map((v, i) => v - deltas[i]);

    let barras;
    if (dia === null) {
        barras = DIAS.map((d, i) => ({ rotulo: d.hoje ? 'Hoje' : d.curto, v: media(deltaHoraria(i)), ultimo: d.hoje }));
    } else {
        const d = deltaHoraria(dia);
        const horas = [4, 8, 12, 16, 20].filter((h) => h < d.length);
        barras = horas.map((h) => ({ rotulo: `${String(h).padStart(2, '0')}h`, v: d[h] }));
        if (DIAS[dia].hoje) barras.push({ rotulo: 'Agora', v: d[d.length - 1], ultimo: true });
    }

    const acerto = (deltas.filter((v) => Math.abs(v) <= TOLERANCIA).length / deltas.length) * 100;
    const L = 600, A = 190, M = { e: 20, d: 20, c: 26, b: 28 };
    const maximo = 7;
    const passo = (L - M.e - M.d) / barras.length;
    const h = (v) => (Math.abs(v) / maximo) * (A - M.b - M.c);
    const cor = (v) => (Math.abs(v) < 3 ? 'comp-barra-1' : Math.abs(v) < 5 ? 'comp-barra-2' : 'comp-barra-3');

    return (
        <section className="comp-card comp-grafico-card">
            <div className="comp-grafico-topo">
                <div>
                    <h3>Discrepância residual por {dia === null ? 'dia' : 'faixa horária'}</h3>
                    <span className="comp-sub">Afastamento da temperatura local em relação ao OpenWeather, apenas medições.</span>
                </div>
                <span className="comp-destaque">Tolerância aceitável: ±{TOLERANCIA.toFixed(1)}°C</span>
            </div>
            <SeletorDia valor={dia} onChange={setDia} />
            <svg viewBox={`0 0 ${L} ${A}`} className="comp-grafico comp-grafico-barras">
                <line x1={M.e} x2={L - M.d} y1={A - M.b} y2={A - M.b} className="comp-grade" />
                <line x1={M.e} x2={L - M.d} y1={A - M.b - h(TOLERANCIA)} y2={A - M.b - h(TOLERANCIA)} className="comp-tolerancia" />
                {barras.map((b, i) => {
                    const cx = M.e + passo * (i + 0.5);
                    return (
                        <g key={b.rotulo}>
                            <rect x={cx - passo * 0.22} y={A - M.b - h(b.v)} width={passo * 0.44} height={h(b.v)} rx="6" className={cor(b.v)} />
                            <text x={cx} y={A - M.b - h(b.v) - 6} textAnchor="middle" className="comp-valor-barra">{b.v.toFixed(1)}°</text>
                            <text x={cx} y={A - 8} textAnchor="middle" className={`comp-eixo ${b.ultimo ? 'comp-eixo-hoje' : ''}`}>{b.rotulo}</text>
                        </g>
                    );
                })}
            </svg>
            <div className="comp-rodape comp-rodape-disc">
                <span>Desvio padrão σ = <b>{desvioPadrao(deltas).toFixed(2)}</b></span>
                <span>Taxa de acerto (dentro da tolerância): <b>{acerto.toFixed(0)}%</b></span>
                <span className="comp-destaque">Correlação de Pearson r = {pearson(locais, oficiais).toFixed(3)}</span>
            </div>
        </section>
    );
}

function PaginaComparativo() {
    const [metrica, setMetrica] = useState('temp');

    const { local, oficial, series } = useComparativo();
    const delta = (k) => (local[k] == null || oficial[k] == null ? null : local[k] - oficial[k]);
    const serie = series[metrica];
    const dp = desvioPadrao(serie.local.map((v, i) => v - serie.oficial[i]));
    const fmt = (v, c = 1) => (v == null ? '--' : Number(v).toFixed(c));

    const linhas = [
        ['temp', 'Temperatura', '°C', 1],
        ['umidade', 'Umidade Relativa', '%', 0],
        ['pressao', 'Pressão Barométrica', 'hPa', 1],
        ['vento', 'Velocidade do Vento', 'km/h', 1],
    ];
    const subtitulos = {
        temp: 'Estação − referência',
        pressao: 'Estação − referência',
        umidade: 'Estação − referência',
    };

    return (
        <div className="comp-wrapper">
            <div className="comp-grid">
                <section className="comp-card comp-card-local">
                    <header className="comp-cabecalho">
                        <span className="comp-icone-cab"><Icone d={ICONES.antena} /></span>
                        <div>
                            <span className="comp-sub">SUA ESTAÇÃO</span>
                            <h3>LOCAL UERGS</h3>
                        </div>
                        <span className="comp-tag">Físico IoT</span>
                    </header>
                    {linhas.map(([k, nome, un, c]) => (
                        <div className="comp-linha" key={k}>
                            <span className="comp-rotulo"><Icone d={ICONES[k]} /> {nome}</span>
                            <strong>{fmt(local[k], c)}<small>{un}</small></strong>
                        </div>
                    ))}
                    <footer className="comp-rodape">
                        <span>Sensores da estação</span>
                        <span className="comp-destaque">
                            {local.status === 'agora' ? 'Dados de agora' : local.status ? 'Últimos dados registrados' : 'Exemplo'}
                        </span>
                    </footer>
                </section>

                <section className="comp-card comp-card-delta">
                    <header className="comp-cabecalho">
                        <span className="comp-icone-cab"><Icone d={ICONES.delta} /></span>
                        <div>
                            <span className="comp-sub">CÁLCULO DE DESVIO</span>
                            <h3>ANÁLISE RESIDUAL (Δ)</h3>
                        </div>
                    </header>
                    {['temp', 'pressao', 'umidade'].map((k) => (
                        <div className="comp-linha comp-linha-delta" key={k}>
                            <div className="comp-delta-texto">
                                <span className="comp-delta-nome">Δ {METRICAS[k].rotulo.toUpperCase()}</span>
                                <span className="comp-delta-sub">{subtitulos[k]}</span>
                            </div>
                            <strong className="comp-chip">
                                {delta(k) === null ? '--' : sinal(delta(k))} <small>{METRICAS[k].unidade}</small>
                            </strong>
                        </div>
                    ))}
                    <div className="comp-nota">
                        <Icone d={ICONES.info} />
                        <p>
                            <b>Desvio padrão ({METRICAS[metrica].rotulo}):</b> σ {dp === null ? '--' : dp.toFixed(2)} {METRICAS[metrica].unidade}
                            {' '}nas últimas 12 horas.
                        </p>
                    </div>
                </section>

                <section className="comp-card comp-card-oficial">
                    <header className="comp-cabecalho">
                        <span className="comp-icone-cab"><Icone d={ICONES.nuvem} /></span>
                        <div>
                            <span className="comp-sub">REFERÊNCIA OFICIAL</span>
                            <h3>OPENWEATHER</h3>
                        </div>
                        <span className="comp-tag">API Externa</span>
                    </header>
                    {linhas.map(([k, nome, un, c]) => (
                        <div className="comp-linha" key={k}>
                            <span className="comp-rotulo"><Icone d={ICONES[k]} /> {nome}</span>
                            <strong>{fmt(oficial[k], c)}<small>{un}</small></strong>
                        </div>
                    ))}
                    <div className="comp-linha">
                        <span className="comp-rotulo"><Icone d={ICONES.nuvem} /> Condição Global</span>
                        <strong className="comp-condicao">{oficial.condicao}</strong>
                    </div>
                    <footer className="comp-rodape">
                        <span>Estação base: Guaíba</span>
                        <span className="comp-destaque">OpenWeather</span>
                    </footer>
                </section>
            </div>

            <section className="comp-card comp-grafico-card">
                <div className="comp-grafico-topo">
                    <div>
                        <h3>Gráfico Comparativo de Variação (últimas 12 horas)</h3>
                        <span className="comp-sub">Traçado direto: estação local x OpenWeather</span>
                    </div>
                    <div className="comp-abas">
                        {Object.entries(METRICAS).map(([k, m]) => (
                            <button key={k} className={k === metrica ? 'ativo' : ''} onClick={() => setMetrica(k)}>
                                {m.rotulo}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="comp-legenda">
                    <span><i className="leg-local" /> Estação Local UERGS</span>
                    <span><i className="leg-oficial" /> Oficial (OpenWeather)</span>
                </div>
                <Grafico serie={serie} />
            </section>

            <Discrepancia />
        </div>
    );
}

export default PaginaComparativo;
