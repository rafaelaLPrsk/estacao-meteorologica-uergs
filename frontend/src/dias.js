// Rótulos dos últimos 7 dias (o último é hoje). Só datas, nenhum dado de medição.
const NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const COMPLETOS = ['Domingo', 'Segunda-Feira', 'Terça-Feira', 'Quarta-Feira', 'Quinta-Feira', 'Sexta-Feira', 'Sábado'];

export const DIAS = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { completo: `${COMPLETOS[d.getDay()]} (${d.getDate()})`, curto: NOMES[d.getDay()], rotulo: `${NOMES[d.getDay()]} ${d.getDate()}`, hoje: i === 6 };
});
