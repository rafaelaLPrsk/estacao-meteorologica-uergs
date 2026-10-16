// Coleta e termina. Usado pelo GitHub Actions (.github/workflows/coletar.yml);
// no servidor (server.js) o mesmo coletar() roda em intervalo.
//
//   node src/coletar.js                              uma coleta só
//   node src/coletar.js --duracao 270 --intervalo 30 verifica a cada 30 s por 270 s
//
// A estação envia uma leitura a cada ~72 s; o coletar() só salva medição nova, sem repetir.
import { coletar } from './clima.js';

const arg = (nome, padrao) => {
    const i = process.argv.indexOf(`--${nome}`);
    return i > -1 ? Number(process.argv[i + 1]) : padrao;
};
const fim = Date.now() + arg('duracao', 0) * 1000;
const intervaloMs = arg('intervalo', 30) * 1000;

let tentativas = 0, falhas = 0;
while (true) {
    tentativas++;
    try { await coletar(); } catch (erro) { falhas++; console.error('Falha na coleta:', erro.message); }
    if (Date.now() + intervaloMs >= fim) break;
    await new Promise((r) => setTimeout(r, intervaloMs));
}

console.log(`Coletas: ${tentativas}, falhas: ${falhas}`);
process.exit(falhas === tentativas ? 1 : 0); // só falha se nenhuma tentativa funcionou
