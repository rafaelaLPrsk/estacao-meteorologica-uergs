// Faz UMA coleta e termina. Usado pelo GitHub Actions (.github/workflows/coletar.yml);
// no servidor (server.js) o mesmo coletar() roda em intervalo.
import { coletar } from './clima.js';

try {
    await coletar();
    process.exit(0);
} catch (erro) {
    console.error('Falha na coleta:', erro.message);
    process.exit(1);
}
