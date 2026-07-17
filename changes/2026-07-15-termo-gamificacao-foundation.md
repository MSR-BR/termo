# Change Plan: TERMO Gamificacao Foundation

## Objetivo

Implementar a base de gamificacao do TERMO com o menor acoplamento possivel ao
fluxo atual de auth, analytics e exercicios IA.

## Estrategia

Separar o trabalho em quatro camadas:

1. dados autoritativos;
2. API e processamento de regras;
3. integracao de cliente;
4. interface da jornada.

Restricao operacional desta fase:

- manter o consumo do Supabase compativel com conta gratuita;
- reduzir leituras repetidas, writes granulares e jobs desnecessarios;
- adiar qualquer desenho que dependa de alto volume de eventos.

## Fase 0 - Preparacao

- criar `.specs/termo-gamificacao-foundation/spec.md`;
- criar blueprint e arquitetura;
- confirmar taxonomia de eventos e XP;
- validar nomenclatura de views no app.

## Fase 0B - Prototipo Offline

Objetivo:

- validar a experiencia de gamificacao sem tocar no app atual;
- trabalhar apenas no worktree offline;
- usar dados locais e persistencia via navegador;
- confirmar o valor pedagogico antes de integrar backend real.

O que ja foi validado no prototipo:

- entrada por `Minha jornada` como CTA de cabecalho;
- teaser para visitante antes do login;
- separacao por camadas `Resumo`, `Capitulos` e `Simulados e revisao`;
- painel `Minha jornada`;
- linguagem mais amigavel em portugues;
- progresso por capitulo;
- simulado por capitulo;
- resultado com pontuacao e ganho simbolico;
- revisao guiada por erro;
- revisao curta dos erros;
- nova tentativa orientada focada so nos pontos fracos;
- desafio do dia contextual nascido do ultimo erro ou da ultima retomada.

Conclusao desta fase:

- o loop pedagogico principal mostrou boa coerencia para seguir depois para a
  fase de infraestrutura.

## Mapa Corrigido Das Fases

Atualizacao de nomenclatura em `July 16, 2026` para evitar ambiguidade:

- `Fase 0`: preparacao
- `Fase 0B`: prototipo offline
- `Fase 1A`: contrato minimo da jornada
- `Fase 1B`: rascunho tecnico offline
- `Fase 1C`: implementacao real de banco e backend
- `Fase 2`: integracao no cliente e no app principal
- `Fase 3`: UX integrada e fluxo final
- `Fase 4`: telemetria e medicao
- `Fase 5`: rollout

Observacao:

- `Fase 1A` e `Fase 1B` sao subfases da `Fase 1`, nao fases independentes do
  plano principal.
- o proximo passo para fechar a `Fase 1` e a `Fase 1C`.

## Fase 1 - Infraestrutura Autoritativa

### Fase 1A - Contrato Minimo Da Jornada

Ja concluida no worktree offline:

- entrada da jornada pela `Area Pessoal`;
- separacao `visitante x logado`;
- payload unico de leitura;
- definicao do schema minimo;
- lista minima de eventos autoritativos.

### Fase 1B - Rascunho Tecnico Offline

Ja concluida no worktree offline:

- SQL draft do core;
- endpoints esqueleto;
- handlers esqueleto;
- validacao de contratos sem persistencia real.

### Fase 1C - Implementacao Real De Banco E Backend

Criar migracoes Supabase para:

- `public.gamification_profiles`
- `public.gamification_event_log`
- `public.gamification_item_progress`
- `public.gamification_badge_catalog`
- `public.gamification_user_badges`
- `public.gamification_daily_missions`
- `public.gamification_daily_mission_progress`
- `public.chapter_quiz_catalog`
- `public.chapter_quiz_questions`
- `public.chapter_quiz_attempts`
- `public.user_notification_preferences`
- `public.daily_challenge_dispatch_log`

Observacao de custo:

- implementar apenas o conjunto minimo viavel na fase 1;
- se necessario, adiar tabelas de email e parte das missoes para uma fase
  posterior;
- manter indices estritamente uteis para evitar complexidade prematura.

Criar indices em:

- `(user_id, created_at desc)` no log;
- `(user_id, item_key)` no progresso;
- `(user_id, mission_date)` nas missoes diarias;
- `(user_id, badge_key)` nas conquistas.

Criar funcoes SQL ou RPC para:

- aplicar evento de gamificacao com idempotencia;
- recalcular streak;
- conceder badge se elegivel;
- atualizar agregados do profile;
- fechar tentativa de simulado e consolidar pontuacao.

Status em `July 16, 2026`:

- iniciado;
- persistencia minima real de `gamification-profile` e `gamification-event`
  entrou no worktree offline;
- persistencia minima real de `chapter-quiz` tambem entrou no worktree
  offline;
- migration oficial e consolidacao SQL/RPC ainda nao entraram.

## Fase 2 - Cliente E Integracao No App

Criar endpoints:

- `api/gamification-event.js`
- `api/gamification-profile.js`
- `api/gamification-missions.js`
- `api/chapter-quiz.js`
- `api/daily-challenge-preferences.js`

Criar handlers em `lib/`:

- `lib/gamification-event-handler.mjs`
- `lib/gamification-profile-handler.mjs`
- `lib/gamification-rules.mjs`
- `lib/chapter-quiz-handler.mjs`
- `lib/daily-challenge-service.mjs`

Responsabilidades:

- validar sessao autenticada;
- normalizar payload;
- gerar `idempotency_key`;
- gravar evento;
- chamar regra de consolidacao;
- devolver diff de XP, streak, badges e missoes afetadas;
- registrar tentativas de simulado;
- preparar payload de email do desafio diario.

Diretriz de economia:

- devolver no mesmo payload os agregados principais da jornada para evitar
  chamadas extras;
- evitar endpoints muito fragmentados;
- nao usar refresh automatico agressivo no cliente.

Criar assets:

- `assets/termo-gamification.js`
- `assets/termo-gamification.css`

Integracoes no cliente:

- `index.html` adiciona o painel `Minha jornada`;
- `assets/termo-user-data.js` segue responsavel por favoritos e exercicios;
- `assets/termo-analytics.js` continua separado da recompensa oficial;
- `assets/ai-exercises.js` emite eventos gamificados quando houver acao elegivel;
- o app passa a renderizar CTA e fluxo de simulado por capitulo.

Diretriz de economia no cliente:

- carregar a jornada sob demanda ou em pontos-chave da navegacao;
- evitar sincronizacao em tempo real;
- agrupar atualizacoes quando possivel.

Novos eventos de cliente:

- marcar item como estudado;
- concluir capitulo;
- iniciar simulado;
- responder questao;
- concluir simulado;
- abrir painel jornada;
- concluir missao;
- dispensar teaser de login da jornada.

## Fase 3 - UX Integrada

Adicionar no app:

- card de jornada na area pessoal;
- resumo compacto no topo do app para logados;
- CTA de login para usuarios anonimos;
- marcador por item estudado nas paginas de capitulo;
- barra de progresso por capitulo;
- entrada clara para `Simulado do capitulo`;
- bloco de preferencia para receber `Desafio do dia por email`.

Fluxo de aprendizagem validado no prototipo:

1. fazer simulado;
2. ver resultado;
3. abrir revisao guiada;
4. fazer revisao curta;
5. executar nova tentativa orientada;
6. receber desafio do dia contextual.

## Fase 4 - Telemetria E Medicao

Adicionar analytics para:

- `gamification_panel_open`
- `gamification_mission_complete`
- `gamification_badge_unlock`
- `gamification_streak_view`
- `gamification_teaser_login_click`
- `chapter_quiz_start`
- `chapter_quiz_complete`
- `daily_challenge_email_open`
- `daily_challenge_email_click`

Monitorar:

- retencao D1, D7 e D14;
- exercicios salvos por usuario;
- simulados concluidos por usuario;
- simuladores abertos por usuario;
- retorno via email do desafio diario;
- login rate em sessoes recorrentes.

## Fase 5 - Rollout

Rollout sugerido:

1. liberar apenas profile + streak + item complete;
2. adicionar XP, badges e simulado por capitulo;
3. adicionar missoes diarias;
4. adicionar desafio do dia por email para opt-in;
5. avaliar leaderboard opcional depois de dados reais.

Ajuste recomendado para conta gratuita:

1. profile + streak + item complete;
2. XP + badges + simulado por capitulo;
3. missoes diarias somente se o uso real justificar;
4. desafio do dia por email apenas depois de validar custo operacional;
5. ranking continua fora do escopo.

## Riscos

- premiar pageviews e incentivar comportamento vazio;
- usar metadata de auth para estado volumoso;
- acoplar analytics anonimo a recompensa oficial;
- criar UI motivacional demais e pouco academica;
- gerar duplicidade em eventos de clique;
- incentivar repeticao artificial de simulado para farm de XP;
- mandar email demais e aumentar descadastro.
- exceder leituras ou escritas do plano gratuito do Supabase cedo demais.

## Validacao

Automatizado:

- `npm run check`
- `node --check assets/termo-gamification.js`
- `node --check api/gamification-event.js`

Manual:

- login com Google;
- marcar item como estudado;
- ver XP e streak atualizados;
- refresh sem duplicar premio;
- completar um simulado e registrar tentativa corretamente;
- validar opt-in e opt-out do desafio diario;
- conclui capitulo e recebe badge;
- usuario anonimo ve teaser sem quebrar a navegacao.
