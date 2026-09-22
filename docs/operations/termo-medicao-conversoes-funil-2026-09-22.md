# TERMO — dicionário de eventos, conversões e funis

Data de corte: 22 de setembro de 2026  
Change: T44 — Medição de conversões e funil

## Decisão de medição

O indicador principal de aquisição com valor educacional é
`study_activation`. Ele representa o começo observável de estudo e só pode ser
emitido após `chapter_start` ou `exercise_generate_success`. O navegador o
deduplica por 30 minutos. Visualizações de página, abertura do app, login e
avaliação não equivalem a aprendizagem.

## KPIs e guardrails

| Papel | Métrica | Definição operacional | Fonte | Decisão suportada |
|---|---|---|---|---|
| KPI principal | usuários com `study_activation` | usuário que iniciou capítulo ou gerou exercício, com deduplicação de 30 min no navegador | GA4 e telemetria TERMO | qualidade da aquisição e começo de estudo |
| Driver | taxa `termo_open_app` → `study_activation` | usuários ativados divididos pelos usuários que abriram o app a partir da landing | GA4 | eficácia da landing e do CTA |
| Driver | taxa `chapter_start` → `exercise_generate_success` | usuários que geraram exercício divididos pelos que iniciaram capítulo, no período | GA4 | passagem da leitura para a prática |
| Guardrail | taxa de erro de geração | `exercise_generate_error` dividido por tentativas de geração | telemetria TERMO | não melhorar conversão sacrificando confiabilidade |
| Guardrail | avaliações enviadas | contagem de `rating_submitted`, sem comentário ou identidade | GA4 e telemetria TERMO | acompanhar feedback sem expor texto livre |

Não há meta numérica nova nesta Change. O domínio canônico mudou em 22/09/2026
e a série precisa acumular um período completo antes de fixar metas.

## Dicionário de eventos prioritários

| Evento | Disparo | Propriedades permitidas | Classificação |
|---|---|---|---|
| `termo_open_app` | clique da landing para o app | caminho de destino e rótulo estático | informativo de aquisição |
| `home_study_cta_click` | clique no CTA móvel de estudo | caminho de destino | informativo de landing |
| `chapter_start` | primeira abertura de capítulo na janela de 30 min | capítulo, item, página e método de entrada | evento-chave diagnóstico; conversão Ads secundária existente |
| `study_activation` | `chapter_start` ou `exercise_generate_success`, uma vez por 30 min | origem da ativação e contexto pedagógico | KPI principal; única conversão Ads primária recomendada |
| `exercise_start` | clique para iniciar geração | dificuldade | evento-chave legado; conversão Ads secundária existente |
| `exercise_generate_success` | exercício recebido e validado pelo app | dificuldade e contexto pedagógico | resultado de produto; não importar ao Ads nesta fase |
| `exercise_generate_error` | falha na geração | código/mensagem técnica higienizada | guardrail interno; não enviar ao Ads |
| `simulator_start` | abertura efetiva do simulador | identificador do simulador e método de entrada | engajamento informativo |
| `quiz_start` | início de simulado/desafio | capítulo, estágio e chave técnica do quiz | engajamento informativo |
| `login_success` | retorno OAuth iniciado pelo usuário e concluído | nenhuma propriedade identificadora | jornada paralela de autenticação |
| `rating_submitted` | avaliação armazenada com sucesso | nota inteira e indicador booleano de comentário | jornada paralela de feedback; não envia comentário |

Eventos legais, downloads, compartilhamentos, favoritos, cliques técnicos e
abertura/fechamento de solução continuam disponíveis para diagnóstico, mas não
são conversões publicitárias.

## Funis que devem ser analisados

### 1. Aquisição para estudo

Funil aberto, por usuário e período:

1. visita à landing (`page_view` em `/home.html`);
2. `termo_open_app`;
3. `chapter_start` **ou** `exercise_generate_success`;
4. `study_activation`.

O passo 3 contém caminhos alternativos. Não se deve exigir que o usuário gere
um exercício para reconhecer o início de estudo.

### 2. Leitura para prática

Funil aberto, por usuário e período:

1. `chapter_start`;
2. `exercise_start`;
3. `exercise_generate_success`;
4. `exercise_solution_open`, quando houver interesse em uso da solução.

### 3. Autenticação

`auth_open_click` → `auth_google_click` → `login_success`. Esse funil é
independente: o login pode ocorrer antes ou depois do estudo e não deve ser a
última etapa obrigatória do funil pedagógico.

### 4. Avaliação

`rating_prompt_shown` → `rating_selected` → `rating_submitted`. Comentário,
e-mail, nome e identificador de conta não entram no GA4.

## Contrato de privacidade e cardinalidade

- GA4 não recebe `user_id`, `session_id`, e-mail, nome, telefone, token,
  comentário de avaliação ou texto livre.
- Parâmetros UTM são processados nativamente pela plataforma; o app não os
  replica como dimensões personalizadas.
- A telemetria própria mantém um identificador aleatório de sessão e, quando
  autenticado, um UUID interno sujeito às regras do Supabase. Não há leitura
  pública da tabela.
- `rating_submitted` leva apenas `rating` e `has_feedback`; o texto permanece no
  fluxo administrativo de avaliações.

## Configuração recomendada nas plataformas

### GA4

- manter `study_activation`, `chapter_start` e `exercise_start` para preservar
  a série histórica existente;
- usar `exercise_generate_success`, `login_success` e `rating_submitted` como
  resultados diagnósticos, sem assumir uma ordem única entre eles;
- não marcar `page_view`, `session_start`, `termo_open_app` ou eventos de clique
  como resultado pedagógico.

### Google Ads

- `study_activation`: primária, contagem uma, sem valor monetário;
- `chapter_start` e `exercise_start`: secundárias, apenas observação;
- `TERMO (web) home_page_view`: secundária e fora dos lances;
- não importar `exercise_generate_success`, `login_success` ou
  `rating_submitted` até haver volume e uma decisão específica.

## Corte e comparabilidade

- 01/08/2026: início da configuração de eventos reais de estudo no GA4/Ads.
- 22/09/2026: `termo.app.br` tornou-se domínio canônico e a versão de analytics
  passou a `0922.1`.
- Comparações anteriores e posteriores devem indicar esses cortes. Diferença
  entre GA4 e Ads é esperada: Ads considera somente conversões atribuídas à
  publicidade.

## Evidência e limitações

- Código canônico: `assets/termo-analytics.js`, `assets/ai-exercises.js`,
  `assets/termo-auth.js` e `assets/termo-rating.js`.
- Configuração histórica: `docs/operations/google-ads-campaign-plan-2026-08.md`.
- Funil observado: `docs/operations/termo-c7-funil-estudo-2026-09-04.md`.
- Análise recente: `.specs/changes/042-analise-estatistica-integrada-uso/`.
- Esta execução não modifica GA4 ou Google Ads. O estado externo deve ser
  conferido antes de qualquer reclassificação de eventos ou conversões.
