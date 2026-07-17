# TERMO Gamification Architecture

## Visao Geral

A gamificacao do TERMO deve ser uma camada de coordenacao de comportamento, nao
um enfeite visual.

Principio central:

- analytics observam;
- gamificacao decide;
- banco consolida;
- UI explica e motiva.

Restricao desta fase:

- a arquitetura deve caber confortavelmente no plano gratuito do Supabase.

## Principios De Design

### 1. Recompensar comportamento com sinal pedagogico

Eventos com premio oficial precisam apontar para estudo real:

- concluir item;
- salvar exercicio;
- usar simulador;
- fazer simulado de capitulo;
- revisar;
- voltar em dias diferentes.

Eventos com sinal fraco ficam so na telemetria:

- abrir pagina;
- scroll;
- refresh;
- clique acidental.

### 2. Evitar incentivo perverso

Aplicacao pratica de escolha publica:

- nao premiar volume cego;
- nao confiar no cliente para calcular XP;
- garantir idempotencia;
- usar limites diarios quando necessario;
- manter competicao opcional.

### 3. Crescer em camadas

Primeiro:

- streak;
- XP;
- dominio;
- simulados;
- badges;
- missoes.

Depois:

- desafios coletivos;
- prestigio por contribuicao;
- ranking opt-in.

### 4. Economizar infraestrutura

Nesta fase de teste:

- preferir poucas escritas de alto valor a muitas escritas pequenas;
- ler perfil consolidado em vez de recomputar tudo no cliente;
- evitar realtime, polling frequente e jobs pesados;
- tratar email diario como fase posterior ou opcional, dependendo do custo.

## Arquitetura Proposta

### Camada 1. Cliente

Arquivos novos:

- `assets/termo-gamification.js`
- `assets/termo-gamification.css`

Arquivos integrados:

- `index.html`
- `assets/ai-exercises.js`
- `assets/termo-user-data.js`
- `assets/termo-analytics.js`

Responsabilidades do cliente:

- renderizar o painel da jornada;
- capturar eventos elegiveis;
- renderizar e corrigir fluxo de simulado;
- enviar eventos para API;
- exibir feedback discreto de ganho;
- ler profile consolidado.

O cliente nao faz:

- calculo final de XP;
- decisao final de badge;
- consolidacao de streak.

### Camada 2. API

Arquivos novos:

- `api/gamification-event.js`
- `api/gamification-profile.js`
- `api/gamification-missions.js`
- `api/chapter-quiz.js`
- `api/daily-challenge-preferences.js`

Handlers novos:

- `lib/gamification-event-handler.mjs`
- `lib/gamification-profile-handler.mjs`
- `lib/gamification-rules.mjs`
- `lib/chapter-quiz-handler.mjs`
- `lib/daily-challenge-service.mjs`

Responsabilidades da API:

- validar JWT do usuario;
- normalizar timezone e contexto;
- aplicar `idempotency_key`;
- persistir evento;
- consolidar agregados;
- responder com delta de estado.

Meta adicional:

- concentrar as respostas necessarias em menos round trips.

### Camada 3. Banco

Usar tabelas relacionais no Supabase em vez de `auth.users.user_metadata`.

Motivo:

- consultas e indices melhores;
- trilha auditavel;
- menor risco de payload grande em auth;
- reprocessamento possivel;
- regras mais faceis de evoluir;
- historico de simulados e notificacoes mais simples de medir.

## Modelo De Dados

### `public.gamification_profiles`

Um registro por usuario.

Campos sugeridos:

- `user_id uuid primary key`
- `xp_total integer not null default 0`
- `level integer not null default 1`
- `current_streak integer not null default 0`
- `best_streak integer not null default 0`
- `last_active_on date`
- `studied_items_count integer not null default 0`
- `chapters_mastered_count integer not null default 0`
- `created_at timestamptz`
- `updated_at timestamptz`

### `public.gamification_event_log`

Log autoritativo de eventos que podem alterar estado.

Campos sugeridos:

- `id bigserial primary key`
- `user_id uuid not null`
- `event_type text not null`
- `idempotency_key text not null unique`
- `event_day date not null`
- `chapter_id text`
- `item_id text`
- `simulator_id text`
- `xp_delta integer not null default 0`
- `payload jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default timezone('utc', now())`

Observacao:

- esse log deve registrar apenas eventos com valor de negocio ou pedagogico;
- nao deve espelhar toda a telemetria do frontend.

### `public.gamification_item_progress`

Estado por item de estudo.

Campos sugeridos:

- `user_id uuid not null`
- `chapter_id text not null`
- `item_id text not null`
- `item_key text generated or persisted`
- `status text not null check (status in ('studied','reviewed'))`
- `completed_at timestamptz`
- `last_reviewed_at timestamptz`
- `source_event_id bigint`

Chave unica:

- `(user_id, item_key)`

### `public.gamification_badge_catalog`

Catalogo estatico versionado.

Campos sugeridos:

- `badge_key text primary key`
- `name text not null`
- `description text not null`
- `icon text`
- `rule_type text not null`
- `rule_config jsonb not null default '{}'::jsonb`
- `active boolean not null default true`

### `public.gamification_user_badges`

Conquistas do usuario.

Campos sugeridos:

- `user_id uuid not null`
- `badge_key text not null`
- `awarded_at timestamptz not null default timezone('utc', now())`
- `source_event_id bigint`

Chave unica:

- `(user_id, badge_key)`

### `public.gamification_daily_missions`

Missoes atribuidas por dia.

Campos sugeridos:

- `id uuid primary key`
- `user_id uuid not null`
- `mission_date date not null`
- `mission_key text not null`
- `title text not null`
- `description text not null`
- `goal_count integer not null default 1`
- `reward_xp integer not null default 0`
- `status text not null check (status in ('active','completed','expired'))`
- `created_at timestamptz`

### `public.gamification_daily_mission_progress`

Progresso granular da missao.

Campos sugeridos:

- `mission_id uuid not null`
- `user_id uuid not null`
- `current_count integer not null default 0`
- `completed_at timestamptz`
- `updated_at timestamptz`

### `public.chapter_quiz_catalog`

Catalogo de simulados por capitulo.

Campos sugeridos:

- `quiz_key text primary key`
- `chapter_id text not null`
- `title text not null`
- `question_count integer not null`
- `active boolean not null default true`
- `created_at timestamptz`

### `public.chapter_quiz_questions`

Questoes de multipla escolha do simulado.

Campos sugeridos:

- `id uuid primary key`
- `quiz_key text not null`
- `position integer not null`
- `prompt text not null`
- `options jsonb not null`
- `correct_option text not null`
- `explanation text`
- `difficulty text`

### `public.chapter_quiz_attempts`

Historico de tentativas do usuario.

Campos sugeridos:

- `id uuid primary key`
- `user_id uuid not null`
- `quiz_key text not null`
- `chapter_id text not null`
- `score integer not null default 0`
- `correct_count integer not null default 0`
- `question_count integer not null default 0`
- `attempt_number integer not null default 1`
- `xp_awarded integer not null default 0`
- `started_at timestamptz not null`
- `completed_at timestamptz`
- `answers jsonb not null default '[]'::jsonb`

### `public.user_notification_preferences`

Preferencias de notificacao do usuario.

Campos sugeridos:

- `user_id uuid primary key`
- `daily_challenge_email_enabled boolean not null default false`
- `preferred_send_hour smallint`
- `timezone text`
- `last_sent_on date`
- `created_at timestamptz`
- `updated_at timestamptz`

### `public.daily_challenge_dispatch_log`

Log de disparos do desafio do dia.

Campos sugeridos:

- `id bigserial primary key`
- `user_id uuid not null`
- `challenge_date date not null`
- `challenge_type text not null`
- `delivery_channel text not null default 'email'`
- `status text not null`
- `payload jsonb not null default '{}'::jsonb`
- `sent_at timestamptz`

Observacao de fase:

- esta tabela pode ser adiada se o email diario nao entrar na primeira
  iteracao.

## Contratos De API

### POST `/api/gamification-event`

Uso:

- registrar evento elegivel e receber diff consolidado.

Payload sugerido:

```json
{
  "eventType": "study_item_complete",
  "idempotencyKey": "study:02:2.4:2026-07-15",
  "chapterId": "02",
  "itemId": "2.4",
  "payload": {
    "pagePath": "/slides/capitulo-02/page_8.html"
  }
}
```

Resposta sugerida:

```json
{
  "ok": true,
  "awarded": true,
  "xpDelta": 20,
  "profile": {
    "xpTotal": 140,
    "level": 3,
    "currentStreak": 4,
    "bestStreak": 5
  },
  "badgesUnlocked": [
    "primeiro_item"
  ],
  "missionsUpdated": [
    {
      "missionKey": "study_one_item",
      "currentCount": 1,
      "goalCount": 1,
      "status": "completed"
    }
  ]
}
```

### GET `/api/gamification-profile`

Retorna:

- agregados;
- badges recentes;
- missoes do dia;
- progresso por capitulo;
- ultima atividade relevante.

Preferencia arquitetural:

- este endpoint deve devolver a maior parte do que a UI precisa em uma leitura
  consolidada.

### GET `/api/gamification-missions`

Retorna:

- missoes do dia;
- estado de progresso;
- recompensas previstas.

### GET/POST `/api/chapter-quiz`

Uso:

- buscar o simulado do capitulo;
- registrar tentativa concluida;
- devolver nota, acertos, feedback e XP.

### GET/POST `/api/daily-challenge-preferences`

Uso:

- ler opt-in do email diario;
- salvar preferencia de envio;
- permitir opt-out simples.

## Integracao Com O App Atual

### `assets/termo-analytics.js`

Continua responsavel por:

- GA4;
- telemetry anonima;
- fila de eventos de observacao.

Nao deve ser promovido a motor de recompensa.

### `assets/termo-user-data.js`

Continua com:

- exercicios salvos;
- favoritos;
- relatorios de validacao.

Pode oferecer hooks auxiliares para a camada gamificada, mas nao deve virar o
motor central de regras.

### `index.html`

Mudancas previstas:

- nova view `journey` ou painel dentro de `personal`;
- CTA de login da jornada;
- resumo compacto para usuarios autenticados;
- controle `Marcar item como estudado` em paginas elegiveis;
- CTA `Resolver simulado do capitulo`;
- configuracao `Receber desafio do dia por email`.

## Regras De Consolidacao

### Nivel

Regra simples inicial:

- nivel 1 comecando em 0 XP;
- proximo nivel a cada 100 XP nos primeiros niveis;
- curva pode crescer depois sem quebrar o contrato do cliente.

### Simulados

Regras iniciais sugeridas:

- cada capitulo tem um simulado com 5 questoes ou mais;
- o usuario pode repetir;
- a primeira conclusao do dia ou a melhor nota recente deve carregar o premio
  principal;
- repeticoes adicionais podem manter feedback pedagogico sem repetir XP cheio.

Estrategia de custo:

- guardar tentativa concluida, nao cada clique de resposta isolado;
- corrigir no submit final sempre que possivel.

### Streak

Ao registrar um evento elegivel:

- se `last_active_on` e nulo, streak vira 1;
- se o evento ocorreu no mesmo dia local, streak nao muda;
- se ocorreu no dia seguinte, streak soma 1;
- se houve quebra maior que 1 dia, streak reinicia em 1.

### Dominio De Capitulo

Um capitulo fica dominado quando:

- todos os itens marcados como obrigatorios no capitulo estiverem em
  `gamification_item_progress` como `studied`.

Origem da lista de itens:

- pode nascer de `data/` ou de um manifesto novo por capitulo.

## Anti-Abuse

Guardrails obrigatorios:

- `idempotency_key` unica por acao logica;
- unique constraints nas conquistas;
- premio unico por item estudado;
- premio unico por capitulo dominado;
- premio de simulador no maximo 1 vez por simulador por dia;
- premio cheio de simulado limitado por regra de tentativa;
- logs com payload minimo para auditoria;
- possibilidade de reprocessar XP se regra mudar.

## Fases Futuras

### Fase social inspirada em economia da dadiva

Depois da base:

- badge por ajudar a validar exercicios;
- prestigio por contribuicao util;
- desafios coletivos por turma;
- desbloqueios compartilhados;
- recomendacoes de estudo entre pares.

### Fase competitiva controlada

So depois de dados reais:

- ranking opt-in;
- janelas curtas, por turma ou cohort;
- foco em consistencia e nao so em volume.

## Decisoes Importantes

1. Estado oficial vai para tabelas dedicadas, nao metadata de auth.
2. Cliente emite intencao; backend decide premio.
3. Analytics e gamificacao ficam separados.
4. Leaderboard publico nao entra na fase 1.
5. O tom visual deve permanecer academico e sobrio.
