# Blueprint: TERMO gamificacao de engajamento

## Objective

Adicionar uma camada de gamificacao ao TERMO para aumentar engajamento,
retencao e progressao percebida de usuarios autenticados, sem prejudicar o tom
academico nem incentivar comportamento vazio.

## Why This Matters

Hoje o TERMO ja tem bons ativos de retorno:

- login opcional;
- favoritos;
- exercicios IA;
- simuladores;
- analytics.

Falta transformar isso em uma jornada com metas curtas, feedback de progresso e
motivos claros para voltar.

Restricao importante:

- a primeira iteracao precisa respeitar o plano gratuito do Supabase.

## Scope

Included:

- streak diaria;
- XP e niveis;
- painel `Minha jornada`;
- marcacao de item estudado;
- dominio por capitulo;
- simulado de multipla escolha por capitulo;
- revisao guiada por erro;
- nova tentativa orientada;
- badges iniciais;
- missoes diarias simples;
- desafio do dia opcional por email;
- backend e schema dedicados.

Out of scope:

- ranking global;
- multiplayer em tempo real;
- recursos de pagamento;
- chat ou comunidade aberta.

## Relevant Files

Likely files or folders:

- `index.html`
- `assets/termo-user-data.js`
- `assets/termo-analytics.js`
- `assets/ai-exercises.js`
- `assets/termo-auth.js`
- `api/...`
- `lib/...`
- `data/...`
- `supabase/migrations/...`

## Existing Patterns To Preserve

- Preserve login, Supabase, Gemini, PDF download, SEO, and analytics flows.
- O app principal continua centrado em leitura, capitulos e simuladores.
- A linguagem visual deve continuar academica, clara e discreta.
- O estado oficial nao deve depender de comportamento fragil do cliente.

Add any task-specific references:

- usar `assets/termo-analytics.js` apenas como observacao, nao como motor de
  recompensa;
- preservar o fluxo atual de favoritos e exercicios salvos.

## Content Requirements

Conceitos e elementos que devem aparecer:

- `Minha jornada`
- streak
- XP
- nivel
- simulado do capitulo
- revisao curta
- nova tentativa orientada
- badges
- missoes diarias
- progresso por capitulo
- desafio do dia
- CTA de login para salvar progresso gamificado

## UX Requirements

Expected behavior on desktop:

- painel de jornada legivel dentro da area pessoal;
- feedback curto ao ganhar XP ou badge;
- mapa de progresso por capitulo facil de escanear;
- fluxo de simulado claro e sem ambiguidade nas respostas;
- pos-simulado com recuperacao guiada, nao apenas nota final.

Expected behavior on mobile:

- resumo compacto da jornada;
- cards empilhados;
- missoes e streak visiveis sem excesso de scroll;
- simulado confortavel de responder no celular.

Accessibility/responsiveness concerns:

- nao depender apenas de cor para progresso;
- feedbacks com texto;
- alvos de clique confortaveis;
- animacoes discretas e opcionais.

## Data, APIs, And Services

Mention any Supabase, Gemini, Vercel, Storage, or analytics implications:

- Supabase guarda estado autoritativo de gamificacao;
- Vercel API intermedeia eventos elegiveis;
- GA4 e telemetry atual continuam para medicao agregada;
- Gemini nao precisa mudar para a fase 1, so emitir eventos quando cabivel;
- o desafio do dia por email precisa de infraestrutura de envio e preferencia de
  notificacao.

Diretrizes de custo:

- evitar alto volume de writes;
- evitar polling no cliente;
- preferir leituras agregadas;
- tratar email diario como fase opcional se o custo estiver alto.

## Implementation Notes

Preferred approach:

- criar camada dedicada `termo-gamification`;
- manter gamificacao separada de telemetry;
- usar tabelas relacionais e idempotencia;
- liberar por fases;
- tratar o simulado como guia de estudo curto e recorrente.
- otimizar para pouco consumo de Supabase no plano gratuito.

Known risks:

- premiar pageview;
- duplicar XP por refresh;
- UI gamificada demais para o contexto academico;
- sobrecarregar a area pessoal;
- transformar o email diario em ruido.
- aumentar demais o consumo do Supabase cedo na fase de teste.

## Validation

Required checks:

- `npm run check`

Targeted checks:

- `node --check assets/termo-gamification.js`
- `node --check api/gamification-event.js`

Manual verification:

- login;
- marcar item como estudado;
- ver streak e XP;
- resolver um simulado;
- passar pela revisao guiada;
- executar nova tentativa orientada;
- receber e clicar no desafio do dia;
- concluir missao;
- evitar premio duplicado.

## Release Notes

Short user-facing summary after implementation:

- O TERMO ganhou uma jornada pessoal com streak, progresso por capitulo,
  missoes diarias e reconhecimento por estudo consistente.

## Open Questions

- a view deve ser uma aba propria ou parte da area `personal`?
- o dominio do capitulo vira quando todos os itens forem estudados ou com
  percentual minimo?
- queremos teaser da jornada tambem na `home.html`?
- o desafio do dia por email deve ser sempre um simulado ou pode alternar com
  revisao de item?
- a nova tentativa orientada deve contar como nova tentativa oficial ou como
  etapa de recuperacao sem pontuacao cheia?
