# Estação Meteorológica UERGS

Painel web da estação de Guaíba, comparando os sensores com a OpenWeather.

```
frontend/   React + Vite (telas)
backend/    Node + Express (lê o Firebase, consulta a OpenWeather, analisa e salva)
```

## Fluxo
1. O ESP32 grava as leituras no Firebase `tempo-uergs` (`estacao/ESTACAO_001`).
2. A cada 5 min o backend lê a estação, descarta valores fora da faixa real, consulta a OpenWeather e gera a análise do momento.
3. Se os dados da estação são recentes (≤ 15 min), salva a leitura no banco `dados-openweather` (`historico` e `analise_atual`).
4. O frontend consulta o backend (`/api/sensores`, `/api/analise`, `/api/historico`, `/api/comparativo`) e monta cards e gráficos.

Enquanto não houver histórico salvo, as telas de gráficos usam dados de exemplo (`frontend/src/dadosExemplo.js`).

## Arquivos

**Resumo rápido:** quem **lê/envia** dados está em `backend/src/`; quem **analisa** também (`clima.js`); quem **mostra** está em `frontend/src/`.

### Backend (`backend/`)
| Arquivo | O que faz |
|---|---|
| `src/server.js` | Sobe o Express (porta 3001), define as rotas `/api/*` e inicia o coletor. |
| `src/clima.js` | **Principal.** Lê os sensores, valida faixas (`LIMITES`), consulta a OpenWeather, **gera a análise (frase do clima)** (`analisar`), **envia/salva** no banco (`coletar`) e monta o histórico e o comparativo. |
| `src/firebase.js` | Conexões com os dois Firebase: `tempo-uergs` (estação, só leitura) e `dados-openweather` (histórico, leitura e escrita). |
| `src/chave.json` | Chave da conta de serviço do `dados-openweather`. **Secreta, não vai para o git.** |
| `.env` / `.env.example` | Configurações: `OPENWEATHER_KEY`, cidade, ID da estação, intervalo de coleta. |

Rotas da API:
- `GET /api/sensores` – leitura atual da estação
- `GET /api/analise` – texto de análise do momento
- `GET /api/historico` – 7 dias, hora a hora
- `GET /api/comparativo` – estação x OpenWeather

### Frontend (`frontend/src/`)
| Pasta/arquivo | O que faz |
|---|---|
| `main.jsx`, `App.jsx` | Entrada do React e troca de abas (Agora, Histórico, Comparativo, Sobre, Contato). |
| `servicos/api.js` | **Único lugar que chama o backend** (`fetch` das rotas `/api`). |
| `hooks/` | Buscam os dados da API e atualizam sozinhos (`usePolling.js`): `useSensores`, `useAnalise`, `useHistorico`, `useComparativo`. |
| `componentes/` | Telas e blocos visuais, cada um com seu `.css`: `MenuTopo`, `PainelClima`, `CardSensores`, `PaginaHistorico`, `PaginaComparativo`, `SeletorDia`, `PaginaSobre`, `PaginaContato`. |
| `dadosExemplo.js` | Dados falsos usados enquanto não há histórico real. |
| `assets/` | Logos e ícones dos sensores. |
| `../vite.config.js` | Redireciona `/api` para o backend (`localhost:3001`) em desenvolvimento. |


## Rodar
Coloque a chave da conta de serviço do `dados-openweather` em `backend/src/chave.json` (não vai para o git).

```
cd backend  && cp .env.example .env   # preencher OPENWEATHER_KEY
npm install && npm run dev            # porta 3001
cd frontend && npm install && npm run dev
```

## Publicar o frontend na Vercel (grátis)

1. Entre em [vercel.com](https://vercel.com) com a conta do GitHub e clique em **Add New → Project**.
2. Importe o repositório `estacao-meteorologica-uergs`.
3. Em **Root Directory**, escolha `frontend`. O restante é detectado sozinho (Framework: Vite, build `npm run build`, saída `dist`).
4. Clique em **Deploy**. Você recebe um link `https://....vercel.app` que abre no celular.

A cada push, a Vercel publica de novo. Branches e Pull Requests ganham um link de prévia próprio, útil para testar o layout no celular antes de ir para a `main`.

**Atenção:** a Vercel hospeda só o frontend. O backend (`backend/`) precisa estar hospedado em outro lugar (Railway, Render etc.). Sem ele, o layout abre, mas os cards ficam vazios e os gráficos usam os dados de exemplo. Com o backend no ar, em **Settings → Environment Variables** da Vercel crie:

```
VITE_API_URL = https://URL-DO-SEU-BACKEND/api
```

e faça um novo deploy. No backend, o `cors()` já está liberado para qualquer origem.
