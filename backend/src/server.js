import express from 'express';
import cors from 'cors';
import { lerSensores, lerHistorico, lerComparativo, analiseAtual, iniciarColetor } from './clima.js';

const app = express();
const PORTA = process.env.PORT || 3001;

app.use(cors());

const rota = (fn) => async (req, res) => {
    try {
        const dados = await fn();
        dados ? res.json(dados) : res.status(404).json({ erro: 'Sem dados' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Falha ao ler o banco de dados' });
    }
};

app.get('/api/sensores', rota(lerSensores));
app.get('/api/analise', rota(async () => analiseAtual));
app.get('/api/historico', rota(lerHistorico));
app.get('/api/comparativo', rota(lerComparativo));

app.listen(PORTA, () => {
    console.log(`Backend rodando em http://localhost:${PORTA}`);
    iniciarColetor();
});
