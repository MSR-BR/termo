# TERMO Gamification Fase 1A

## Posicao No Plano

Esta e a primeira subfase da `Fase 1`.

Em `July 16, 2026`, a nomenclatura corrigida ficou assim:

- `Fase 1A`: contrato minimo da jornada
- `Fase 1B`: rascunho tecnico offline
- `Fase 1C`: implementacao real de banco e backend

## Objetivo

Fechar o contrato minimo da jornada gamificada para a primeira integracao real
no app, mantendo:

- baixo acoplamento com o produto atual;
- no maximo uma leitura principal da jornada por abertura;
- poucas escritas autoritativas no Supabase;
- compatibilidade com a `Area Pessoal` que ja existe hoje.

## Decisao De Entrada No Produto

### Ponto de entrada real

Na versao atual do app, o encaixe natural nao e um cabecalho novo isolado.
O melhor ponto de entrada da fase 1A e:

- drawer `Area Pessoal`;
- nova view `journey`;
- novo item `Minha jornada` no topo de `personalViews`.

URL sugerida:

- `index.html?view=journey`

Motivo:

- reaproveita a navegacao ja existente;
- evita criar mais um eixo de descoberta no topo;
- conversa bem com login opcional;
- reduz risco visual e tecnico na primeira integracao.

### Comportamento para visitante

Ao clicar em `Minha jornada` sem login:

- o app abre a view `journey`;
- nao faz leitura no Supabase;
- mostra teaser com valor da funcionalidade;
- explica que progresso persistente exige login;
- oferece CTA de `Entrar com Google`.

Visitante nao recebe:

- XP oficial;
- streak oficial;
- missoes persistidas;
- historico de simulados salvo.

### Comportamento para usuario logado

Ao abrir `Minha jornada` logado:

- a UI renderiza um esqueleto leve;
- faz uma chamada para `GET /api/gamification-profile`;
- mostra primeiro o resumo;
- so abre camada de capitulos e simulados sob demanda.

## Estrutura De Navegacao Da Jornada

Para manter a tela respiravel, a view `journey` nasce em tres camadas:

1. `Resumo`
2. `Capitulos`
3. `Simulados e revisao`

### Resumo

Mostra apenas:

- streak atual;
- maior streak;
- XP total;
- nivel atual;
- itens estudados;
- ultimo simulado;
- missao do dia;
- proxima acao sugerida.

### Capitulos

Mostra:

- progresso por capitulo;
- itens estudados por capitulo;
- CTA para continuar estudo;
- CTA para abrir simulado quando existir.

### Simulados e revisao

Mostra:

- simulado do capitulo;
- resultado;
- revisao guiada;
- revisao curta;
- nova tentativa orientada.

## Contrato Minimo De Leitura

### Regra principal

Uma abertura da jornada logada deve custar uma leitura principal consolidada.

Endpoint:

- `GET /api/gamification-profile`

Esse endpoint devolve tudo que a UI precisa para o primeiro paint da jornada.

### Resposta sugerida

```json
{
  "ok": true,
  "viewer": {
    "isAuthenticated": true,
    "entryView": "journey",
    "defaultSection": "overview"
  },
  "summary": {
    "xpTotal": 168,
    "level": 2,
    "levelProgressPercent": 68,
    "currentStreak": 4,
    "bestStreak": 9,
    "studiedItemsCount": 18,
    "chaptersMasteredCount": 1
  },
  "nextAction": {
    "type": "chapter_quiz",
    "label": "Abrir simulado de Capitulo 02",
    "href": "index.html?view=journey&section=quiz&chapter=02",
    "reason": "capitulo perto de consolidacao"
  },
  "missions": [
    {
      "key": "quiz-cap02",
      "title": "Fechar o simulado de Potenciais",
      "description": "Concluir 1 simulado do capitulo 02 com pelo menos 4 acertos.",
      "progressLabel": "0 / 1 concluido",
      "completed": false
    }
  ],
  "recentBadges": [
    {
      "key": "sequencia_3_dias",
      "title": "Sequencia de 3 dias",
      "description": "Constancia inicial consolidada com tres retornos seguidos.",
      "awardedAt": "2026-07-14T08:10:00Z"
    }
  ],
  "lastQuizResult": {
    "chapterId": "02",
    "chapterTitle": "Potenciais e Legendre",
    "score": 80,
    "correctCount": 4,
    "total": 5,
    "completedAt": "2026-07-16T09:05:00Z"
  },
  "chapterProgress": [
    {
      "chapterId": "02",
      "title": "Potenciais e Legendre",
      "progressPercent": 66,
      "studiedItems": 6,
      "totalItems": 9,
      "hasQuiz": true,
      "dominantTheme": "Bom andamento, ideal para um simulado rapido."
    }
  ],
  "preferences": {
    "dailyChallengeEmailEnabled": false,
    "preferredSendTime": "07:10"
  },
  "featureFlags": {
    "showJourney": true,
    "showDailyChallengeEmail": false,
    "enabledQuizChapterIds": ["02", "04"]
  }
}
```

### Resposta para visitante

Na fase 1A, visitante nao chama esse endpoint.
O teaser deve ser local e estatico.

## Contrato Minimo De Escrita

### Regra principal

Gamificacao oficial so escreve no Supabase quando existe um marco pedagogico.

Escritas permitidas na fase 1A:

- marcar item como estudado;
- concluir simulado;
- concluir revisao curta;
- concluir nova tentativa orientada;
- registrar retorno diario quando houver um evento elegivel real.

Escritas que ficam fora desta fase:

- abrir pagina;
- scroll;
- abrir drawer;
- abrir teaser da jornada;
- clique em aba;
- selecionar alternativa antes do submit final.

### Endpoint autoritativo

`POST /api/gamification-event`

Uso inicial:

- `study_item_complete`
- `daily_return`

Payload sugerido:

```json
{
  "eventType": "study_item_complete",
  "idempotencyKey": "study:02:2.4",
  "chapterId": "02",
  "itemId": "2.4",
  "occurredAt": "2026-07-16T09:00:00-03:00",
  "payload": {
    "pagePath": "/slides/capitulo-02/page_4.html"
  }
}
```

### Endpoint de simulado

`POST /api/chapter-quiz`

Esse endpoint deve gravar apenas a tentativa concluida, nunca cada clique.

Payload sugerido:

```json
{
  "quizKey": "cap02",
  "chapterId": "02",
  "attemptType": "full_quiz",
  "answers": [
    { "questionId": "cap02-q1", "choice": "b" },
    { "questionId": "cap02-q2", "choice": "b" }
  ],
  "startedAt": "2026-07-16T09:03:00-03:00",
  "completedAt": "2026-07-16T09:05:00-03:00"
}
```

Tipos iniciais:

- `full_quiz`
- `guided_review`
- `focused_retry`

## Schema Minimo Para A Conta Gratuita

### Tabelas que entram agora

1. `public.gamification_profiles`
2. `public.gamification_event_log`
3. `public.gamification_item_progress`
4. `public.chapter_quiz_attempts`

### Tabelas que saem da fase 1A

Ficam adiadas para nao aumentar custo e complexidade cedo:

- `gamification_badge_catalog`
- `gamification_user_badges`
- `gamification_daily_missions`
- `gamification_daily_mission_progress`
- `user_notification_preferences`
- `daily_challenge_dispatch_log`
- `chapter_quiz_catalog`
- `chapter_quiz_questions`

### Como manter a UX sem essas tabelas extras

Na fase 1A:

- quizzes ficam em arquivos versionados no repo;
- badges recentes ficam espelhadas em `gamification_profiles`;
- missao do dia fica calculada no backend e salva em snapshot no profile;
- preferencia de email fica adiada ou embutida em json no profile quando entrar.

### `public.gamification_profiles`

Funciona como agregado consolidado e snapshot da jornada.

Campos minimos sugeridos:

- `user_id uuid primary key`
- `xp_total integer not null default 0`
- `level integer not null default 1`
- `current_streak integer not null default 0`
- `best_streak integer not null default 0`
- `last_active_on date`
- `studied_items_count integer not null default 0`
- `chapters_mastered_count integer not null default 0`
- `last_quiz_summary jsonb not null default '{}'::jsonb`
- `recent_badges_json jsonb not null default '[]'::jsonb`
- `active_missions_json jsonb not null default '[]'::jsonb`
- `next_action_json jsonb not null default '{}'::jsonb`
- `preferences_json jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

Motivo:

- reduz round trips;
- permite uma leitura unica da jornada;
- posterga normalizacao completa para fase posterior.

### `public.gamification_event_log`

Log autoritativo enxuto.

Campos minimos:

- `id bigserial primary key`
- `user_id uuid not null`
- `event_type text not null`
- `idempotency_key text not null unique`
- `event_day date not null`
- `chapter_id text`
- `item_id text`
- `xp_delta integer not null default 0`
- `payload jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default timezone('utc', now())`

Indices minimos:

- `(user_id, created_at desc)`
- `(user_id, event_day desc)`

### `public.gamification_item_progress`

Campos minimos:

- `user_id uuid not null`
- `chapter_id text not null`
- `item_id text not null`
- `item_key text not null`
- `status text not null check (status in ('studied','reviewed'))`
- `completed_at timestamptz`
- `last_reviewed_at timestamptz`
- `source_event_id bigint`

Chave unica:

- `(user_id, item_key)`

### `public.chapter_quiz_attempts`

Campos minimos:

- `id uuid primary key`
- `user_id uuid not null`
- `quiz_key text not null`
- `chapter_id text not null`
- `attempt_type text not null`
- `score integer not null default 0`
- `correct_count integer not null default 0`
- `question_count integer not null default 0`
- `xp_awarded integer not null default 0`
- `answers jsonb not null default '[]'::jsonb`
- `feedback jsonb not null default '[]'::jsonb`
- `started_at timestamptz not null`
- `completed_at timestamptz not null`

Indices minimos:

- `(user_id, chapter_id, completed_at desc)`

## Eventos Autoritativos Minimos

Entram na fase 1A:

- `study_item_complete`
- `chapter_quiz_completed`
- `chapter_quiz_review_completed`
- `chapter_quiz_retry_completed`
- `daily_return`
- `chapter_mastery_completed`

Ficam para fase posterior:

- `exercise_saved`
- `exercise_favorited`
- `exercise_validation_submitted`
- `simulator_open_unique_day`

Motivo:

- esses eventos ja tem valor futuro, mas aumentam volume de escrita cedo;
- a primeira versao deve provar o loop central de estudo, erro, revisao e
  retorno antes de ampliar recompensa para tudo.

## Integracao Com O App Atual

### Drawer da Area Pessoal

Mudanca sugerida:

- inserir `Minha jornada` no array `personalViews`;
- colocar esse item acima de `Meus exercicios`;
- permitir abertura mesmo sem login.

### Renderizacao

Regras:

- `view=journey` e publica como teaser;
- `view=journey` logada busca o profile consolidado;
- views `saved`, `favorites` e `validation-review` continuam exigindo login.

### Painel principal

O painel central do `index.html` deve:

- mostrar teaser quando deslogado;
- mostrar resumo da jornada quando logado;
- manter capitulos e simulados em camadas internas, nao tudo de uma vez.

## Guardrails De Custo

Obrigatorios na fase 1A:

- nao usar polling;
- nao usar realtime;
- nao gravar clique de resposta;
- nao gravar pageview como XP;
- consolidar a jornada em um unico payload;
- manter quizzes como conteudo versionado no repo;
- evitar cron diario ate que o opt-in de email realmente entre.

## Entregas Da Fase 1A

Esta fase fica concluida quando existirem:

1. contrato de entrada `visitante x logado`
2. contrato unico de `GET /api/gamification-profile`
3. definicao do schema minimo de quatro tabelas
4. lista minima de eventos autoritativos
5. mapa de integracao da `journey` com a `Area Pessoal`
