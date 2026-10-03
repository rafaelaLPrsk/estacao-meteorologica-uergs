// DADOS DE EXEMPLO: usados só enquanto o backend ainda não tem leituras salvas.
// Só há dados medidos: nada aqui é previsão. O último dia é sempre hoje (parcial).

const NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const COMPLETOS = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

export const DIAS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { completo: `${COMPLETOS[d.getDay()]} (${d.getDate()})`, curto: NOMES[d.getDay()], rotulo: `${NOMES[d.getDay()]} ${d.getDate()}`, hoje: i === 6 };
});

const HORA_ATUAL = new Date().getHours();

export const SEMANA = {
    tempMax: [24.1, 26.3, 27.8, 25.2, 22.9, 24.6, 23.4],
    tempMin: [14.2, 15.8, 17.1, 16.4, 13.7, 14.9, 16.0],
    umidade: [74, 68, 63, 71, 82, 76, 80],
    pressao: [1015.2, 1013.8, 1011.9, 1010.4, 1014.6, 1016.9, 1017.7],
    chuva: [0, 0, 1.2, 8.6, 14.3, 0.4, 0],
    vento: [9.5, 11.2, 14.8, 18.3, 12.1, 8.7, 12.0],
};

const onda = (h, pico) => Math.sin(((h - pico + 6) / 24) * 2 * Math.PI);

// Horas já medidas no dia (hoje vai só até a hora atual)
const horasDoDia = (dia) => Array.from({ length: dia === 6 ? HORA_ATUAL + 1 : 24 }, (_, h) => h);

// Valores horários de exemplo de um dia, derivados dos valores diários
export function horaria(dia, metrica) {
    const s = SEMANA;
    return horasDoDia(dia).map((h) => {
        switch (metrica) {
            case 'temp': return (s.tempMax[dia] + s.tempMin[dia]) / 2 + ((s.tempMax[dia] - s.tempMin[dia]) / 2) * onda(h, 15);
            case 'umidade': return s.umidade[dia] - 8 * onda(h, 15);
            case 'pressao': return s.pressao[dia] + 0.8 * onda(h, 10);
            case 'vento': return Math.max(s.vento[dia] + 4 * onda(h, 15), 0);
            case 'chuva': return h >= 14 && h <= 17 ? s.chuva[dia] / 4 : 0;
            default: return 0;
        }
    });
}

// Diferença (estação - OpenWeather) de temperatura, de exemplo
export function deltaHoraria(dia) {
    return horasDoDia(dia).map((h) => -(3 + (dia % 3) * 0.8 + 2.5 * onda(h, 12) + 0.3 * (((dia * 7 + h) % 3) - 1)));
}

// Comparativo estação x OpenWeather (usado enquanto o backend não tem dados)
export const COMPARATIVO_EXEMPLO = {
    local: { temp: 18.2, umidade: 80, pressao: 1017.7, vento: 12.0 },
    oficial: { temp: 23.9, umidade: 78, pressao: 1012.0, vento: 14.4, condicao: 'Nublado' },
    series: {
        temp: { local: [16, 15.5, 16.8, 18, 19.9, 18.5, 18.2], oficial: [18.2, 17.6, 20.5, 22.8, 23.4, 22, 23.9] },
        pressao: { local: [1016, 1016.5, 1017, 1017.4, 1017.8, 1017.5, 1017.7], oficial: [1011, 1011.4, 1011.8, 1012.2, 1012.5, 1012.1, 1012] },
        umidade: { local: [85, 84, 83, 81, 79, 80, 80], oficial: [80, 79, 77, 76, 76, 77, 78] },
    },
};
