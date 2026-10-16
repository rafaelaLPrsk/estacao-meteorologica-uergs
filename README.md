# Estação Meteorológica UERGS

Painel web da estação meteorológica de baixo custo da UERGS Guaíba, que compara as medições do sensor com uma fonte de referência (OpenWeather).

Site: https://rafaelalprsk.github.io/estacao-meteorologica-uergs/

```
frontend/   React + Vite (as telas; lê os dados direto do Firebase)
backend/    Node (coleta: lê a estação, consulta a OpenWeather, analisa e salva)
.github/    Workflows: coleta contínua e publicação do site
```

## Interface

A interface web mostra, em tempo real e no histórico, os dados da estação, e os compara com a OpenWeather. É construída com React e Vite, hospedada gratuitamente no GitHub Pages e tem layout responsivo (computador e celular). Não depende de servidor próprio: lê os dados diretamente dos bancos e calcula os gráficos no navegador.

### Telas
- **Agora:** leituras mais recentes da estação, em tempo real, e um diagnóstico atmosférico em texto.
- **Histórico:** últimos 7 dias, com resumos e gráficos de temperatura (máxima e mínima), umidade, pressão, chuva e vento, por dia ou hora a hora. Só aparecem dias com dados reais e completos.
- **Comparativo:** estação x OpenWeather em temperatura, umidade, pressão e vento. Mostra os desvios (estação menos referência), o desvio padrão, um gráfico das últimas 12 horas e a discrepância por faixa horária, com taxa de acerto dentro de uma tolerância e correlação de Pearson.
- **Sobre** e **Contato:** o projeto, a equipe e a instituição.

### Tratamento da qualidade dos dados
- **Validação física:** valores fora de faixas plausíveis (constante `LIMITES` em `backend/src/clima.js` e `frontend/src/servicos/firebase.js`) são descartados.
- **Pressão comparável:** o sensor mede a pressão no local, em Pascal, convertida para hPa. A comparação usa a pressão ao **nível do solo** da OpenWeather (`owPressaoSolo`), não a reduzida ao nível do mar (`owPressao`), que fica ~3 hPa acima.
- **Mesmo instante:** os dois lados do Comparativo vêm do **mesmo registro salvo**, e a defasagem entre as medições é informada na tela.
- **Atraso:** o site sempre mostra o último valor conhecido e a hora da medição. **Até 5 min de atraso é tolerável**; acima disso aparece "⚠ Atrasado há X min" (aba Agora e Comparativo). O limite está em `frontend/src/tempo.js`. A OpenWeather atualiza em ritmo próprio (~10 min), então o aviso dela pode aparecer mesmo com a coleta funcionando.
- **Sem dado inventado:** não existe dado de exemplo. Onde não há dados, a tela diz "sem dados". `--` só aparece quando o valor é fisicamente impossível ou nunca houve dado.
- **Diagnóstico por tendência:** a frase usa a variação das últimas ~3 h, não leituras consecutivas, com histerese (ver "Frase de análise").

## Como funciona

```
ESP32 -> Firebase "tempo-uergs"  (uma leitura a cada ~72 s)
              |
   GitHub Actions roda backend/src/coletar.js
   (valida, consulta a OpenWeather, analisa)
              |
              v
Firebase "dados-openweather"  (historico + analise_atual)
              |
              v
   Site (GitHub Pages) lê os dois bancos e desenha as telas
```

1. O ESP32 grava as leituras no Firebase `tempo-uergs` (`estacao/ESTACAO_001/leituras`). Esse banco guarda **todas** as leituras (desde 05/10/2026).
2. A coleta lê a última medição e só segue se ela for **nova** e **recente** (≤ 15 min). Então consulta a OpenWeather e grava tudo junto em `dados-openweather/historico`, mais a frase em `analise_atual`. A OpenWeather só é consultada quando há medição nova a salvar.
3. O site lê os sensores do `tempo-uergs` e o histórico e a análise do `dados-openweather` (leitura pública) e calcula os gráficos no navegador (`frontend/src/servicos/`).

### Campos do histórico (`dados-openweather/historico`)
- **Tempo:** `timestamp` (hora da coleta), `atualizadoEm` (hora da medição na estação), `status`.
- **Estação:** `temperatura`, `umidade`, `pressao`, `chuva`, `uv`, `luminosidade`, `ventoVelocidade`, `ventoDirecao`.
- **OpenWeather:** `owTemp`, `owUmidade`, `owPressaoSolo` (comparável com `pressao`), `owPressao` (nível do mar, só referência), `owVento`, `owCondicao`, `owMedidoEm`.
- `owMedidoEm` é a hora em que a **própria OpenWeather** mediu o dado (ms), diferente do `timestamp`. Serve para descartar pares com diferença de tempo grande. Só existe de 16/10/2026 em diante, assim como `owPressaoSolo`.
- Se a consulta à OpenWeather falhar, os campos `ow*` ficam `null` (nunca se repete um valor antigo) e os da estação são salvos normalmente.

### Frase de análise (`analisar` em `backend/src/clima.js`)
Usa a **tendência de ~3 horas** (comparação com a leitura mais próxima de 3 h atrás, aceitando 2h15 a 3h45). A pressão oscila ±0,1 hPa por ruído do sensor, e comparar leituras vizinhas fazia a frase trocar a cada coleta. Sem histórico suficiente (primeiras ~3 h), fica em "Tempo estável".

| # | Condição | Frase |
|---|---|---|
| 1 | chuva > 0 | Chuva em andamento |
| 2 | vento > 40 km/h | Ventos fortes |
| 3 | pressão caiu ≥ 3 hPa em 3 h | Queda rápida: risco de tempestade |
| 4 | pressão em queda **e** umidade alta | Possibilidade de chuva |
| 5 | pressão em queda | Tempo tende a ficar instável |
| 6 | temperatura subiu ≥ 3 °C em 3 h | Temperatura subindo rapidamente |
| 7 | temperatura caiu ≥ 3 °C em 3 h | Temperatura caindo rapidamente |
| 8 | umidade < 40% | Ar muito seco |
| 9 | pressão subiu ≥ 1 hPa em 3 h | Pressão em alta |
| 10 | nenhuma das anteriores | Tempo estável |

**Histerese** (evita a frase piscar perto do limite): a pressão entra em "queda" com −1 hPa em 3 h e só sai em −0,5; a umidade fica "alta" acima de 80% e só deixa de ser alta em 77% ou menos. O estado fica em `analise_atual/estado`. A análise é recalculada a cada 5 min e é só o texto do painel: **não entra nos dados do artigo**.

## Coleta contínua (GitHub Actions)

O workflow `.github/workflows/coletar.yml` executa `backend/src/coletar.js` (`--duracao 270 --intervalo 30`): cada execução fica ~4,5 min verificando a estação a cada 30 s e salvando toda medição nova (a estação envia uma a cada ~72 s). Sem argumentos, `coletar.js` faz uma coleta só.

**Como se mantém rodando:** o agendamento (`cron`, de 5 em 5 min) do GitHub atrasa e às vezes nem dispara. Por isso cada execução, ao terminar, **dispara a próxima** (`gh workflow run`), e o `cron` fica só como reserva para religar a corrente se ela quebrar. Se a coleta falhar, espera 2 min antes de disparar a próxima. Duas execuções nunca rodam juntas (`concurrency`).

**Para conferir:**
- `gh run list --workflow=coletar.yml --limit 5`: deve haver sempre uma execução `in_progress` ou recém-concluída.
- O aviso "⚠ Atrasado há X min" do site aparece se o histórico parar de ser salvo.
- Se a corrente quebrar e o `cron` não religar: `gh workflow run coletar.yml`.
- **Para parar de propósito:** desative o workflow em Actions (cancelar uma execução não basta, ela já dispara a próxima).

**Configuração existente** (Settings → Secrets and variables → Actions → Secrets): `FIREBASE_CHAVE_JSON` (conteúdo de `backend/src/chave.json` em base64: `base64 -w0 backend/src/chave.json`) e `OPENWEATHER_KEY`. Quem gerencia o repositório precisa de permissão de administrador para alterá-los.

## Limitações (citar no artigo)
- O agendamento do GitHub Actions é irregular, e a coleta pode ter **lacunas**. As leituras da estação **não se perdem** (o `tempo-uergs` guarda todas), então os buracos podem ser preenchidos depois. Só o valor da OpenWeather daquele momento não é recuperável (a API gratuita não dá histórico).
- A OpenWeather dá uma **estimativa** por modelo e estações próximas, não uma medição no ponto, com umidade e pressão em valores inteiros. Os desvios são entre uma medição local e uma estimativa regional.
- Leituras anteriores a 16/10/2026 não têm `owPressaoSolo` nem `owMedidoEm`, e o histórico antigo não tem pressão confiável.
- Se o repositório ficar **60 dias sem commits**, o GitHub desativa o agendamento (basta reativar em Actions). Para os minutos serem ilimitados, o repositório precisa ser público.
- Não rode o backend local e o Actions coletando ao mesmo tempo: gera registros duplicados.

## Arquivos

**Resumo rápido:** quem **lê e envia** dados está em `backend/src/`; quem **analisa** também (`clima.js`); quem **mostra** está em `frontend/src/`.

### Backend (`backend/`)
| Arquivo | O que faz |
|---|---|
| `src/clima.js` | **Principal.** Lê os sensores, valida faixas (`LIMITES`), consulta a OpenWeather, **gera a frase** (`analisar`) e **salva** no banco (`coletar`). |
| `src/coletar.js` | Executa a coleta e termina (usado pelo GitHub Actions). |
| `src/firebase.js` | Conexões com os dois Firebase: `tempo-uergs` (estação, só leitura) e `dados-openweather` (histórico, leitura e escrita). Lê a chave de `FIREBASE_CHAVE_JSON` ou, no computador, de `src/chave.json`. |
| `src/chave.json` | Chave da conta de serviço do `dados-openweather`. **Secreta, não vai para o git.** |
| `.env` / `.env.example` | `OPENWEATHER_KEY`, cidade, ID da estação, intervalo de coleta. |
| `src/server.js` | Servidor opcional (porta 3001) com as rotas `/api/*` (`sensores`, `analise`, `historico`, `comparativo`) e coleta em intervalo. **O site não usa**; ficou como alternativa. |

### Frontend (`frontend/src/`)
| Pasta/arquivo | O que faz |
|---|---|
| `main.jsx`, `App.jsx` | Entrada do React e troca de abas. |
| `servicos/firebase.js` | **Lê direto do Firebase:** sensores em tempo real (`tempo-uergs`) e histórico/análise (`dados-openweather`). Valida faixas e converte a pressão de Pa para hPa. |
| `servicos/historico.js` | **Calcula os gráficos** de Histórico e Comparativo a partir das leituras salvas. |
| `servicos/api.js` | Chama as rotas `/api` do servidor opcional. Não usado pelo site. |
| `hooks/` | Buscam os dados e atualizam sozinhos: `useSensores`, `useAnalise`, `useHistorico`, `useComparativo`. |
| `componentes/` | Telas e blocos visuais, cada um com seu `.css`: `MenuTopo`, `PainelClima`, `CardSensores`, `PaginaHistorico`, `PaginaComparativo`, `SeletorDia`, `PaginaSobre`, `PaginaContato`. |
| `tempo.js` | Cálculo e formato do atraso dos dados (tolerância de 5 min). |
| `dias.js` | Rótulos dos últimos 7 dias (só datas). |
| `assets/` | Logos, ícones dos sensores e foto da estação. |

## Rodar localmente
Coloque a chave da conta de serviço do `dados-openweather` em `backend/src/chave.json`.

```
cd backend  && cp .env.example .env   # preencher OPENWEATHER_KEY
npm install && npm run coletar        # uma coleta (grava no banco)
cd frontend && npm install && npm run dev
```

O site não precisa do backend rodando. O `npm run dev` do backend sobe o servidor opcional e **coleta a cada 5 min**: use só para testar, e não junto com o Actions.

## Publicação do site
O workflow `.github/workflows/pages.yml` publica o `frontend/` no GitHub Pages a cada push na `main` (o Pages está configurado com a fonte "GitHub Actions").
