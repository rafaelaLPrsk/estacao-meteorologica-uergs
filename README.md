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
4. O frontend lê os sensores (cards e painel "Agora") **direto do Firebase** e consulta o backend para `/api/analise`, `/api/historico` e `/api/comparativo`, montando cards e gráficos.

> Por isso, no GitHub Pages os sensores aparecem mesmo sem backend hospedado. Análise, histórico e comparativo só funcionam com o backend no ar.

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
| `servicos/api.js` | Chama o backend (`fetch` das rotas `/api`): análise, histórico e comparativo. |
| `servicos/firebase.js` | **Lê os sensores direto do Firebase `tempo-uergs`, em tempo real, sem backend.** Também valida as faixas e converte a pressão de Pa para hPa. |
| `hooks/` | Buscam os dados da API e atualizam sozinhos (`usePolling.js`): `useSensores` (Firebase direto), `useAnalise`, `useHistorico`, `useComparativo` (estes três usam o backend). |
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

## Hospedar o backend na nuvem (Render, Railway etc.)

O backend precisa ficar no ar 24h: é ele que coleta e salva os dados a cada 5 min, e é ele que o site publicado consulta. Só o frontend (GitHub Pages ou Vercel) não mostra dados.

O `firebase.js` já está preparado: na nuvem ele lê a chave da variável `FIREBASE_CHAVE_JSON`; no computador continua usando `src/chave.json`.

### 1. Gerar o valor da chave
No terminal, na pasta `backend/`:
```
base64 -w0 src/chave.json
```
Copie o texto gigante que aparecer (é o conteúdo do `chave.json` em base64). **Trate como senha**: não coloque no git, em print ou em chat.

### 2. Criar o serviço (exemplo: Render)
1. Em [render.com](https://render.com), **New → Web Service** e conecte este repositório.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Em **Environment**, crie as variáveis:

| Variável | Valor |
|---|---|
| `FIREBASE_CHAVE_JSON` | o texto base64 do passo 1 |
| `OPENWEATHER_KEY` | a chave da OpenWeather |
| `OPENWEATHER_CIDADE` | `Guaiba,BR` (opcional) |
| `ESTACAO_ID` | `ESTACAO_001` (opcional) |
| `INTERVALO_MIN` | `5` (opcional) |

A porta é definida pelo próprio serviço (o código já lê `PORT`). No Railway os passos são os mesmos: Root Directory `backend` e as mesmas variáveis.

**Plano grátis do Render:** o serviço "dorme" após ~15 min sem acesso, e **a coleta para junto**. Para coletar 24h, use um plano pago (~US$5/mês) ou mantenha acessos periódicos (ex.: UptimeRobot chamando `/api/sensores` a cada 5 min).

### 3. Testar
Abra `https://SEU-SERVICO.onrender.com/api/sensores`. Deve aparecer um JSON com temperatura, umidade etc.

### 4. Ligar o site ao backend
No GitHub: **Settings → Secrets and variables → Actions → Variables → New repository variable**
- Nome: `VITE_API_URL`
- Valor: `https://SEU-SERVICO.onrender.com/api`

Depois rode de novo o workflow **Publicar frontend no GitHub Pages** (Actions → Run workflow). A variável é embutida no site na hora do build, então é preciso publicar de novo sempre que ela mudar.

> Na Vercel, a mesma variável (`VITE_API_URL`) é criada em Settings → Environment Variables.

## Publicar o frontend no GitHub Pages

O workflow `.github/workflows/pages.yml` publica o `frontend/` a cada push na `main`. Para funcionar, quem é administradora do repositório precisa ir em **Settings → Pages → Source** e escolher **GitHub Actions** (a opção "Deploy from a branch" publica a branch `gh-pages`, que não é atualizada pelo workflow). Link: `https://rafaelalprsk.github.io/estacao-meteorologica-uergs/`. O repositório precisa ser público no plano grátis.
