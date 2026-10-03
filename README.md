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

## Rodar
Coloque a chave da conta de serviço do `dados-openweather` em `backend/src/chave.json` (não vai para o git).

```
cd backend  && cp .env.example .env   # preencher OPENWEATHER_KEY
npm install && npm run dev            # porta 3001
cd frontend && npm install && npm run dev
```
