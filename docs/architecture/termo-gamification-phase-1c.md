# TERMO Gamification Fase 1C

## Posicao No Plano

Esta e a terceira subfase da `Fase 1`.

Escopo desta entrega da `Fase 1C` em `July 16, 2026`:

- persistencia inicial real de `profile`;
- persistencia inicial real de `event log`;
- consolidacao minima de `item progress`;
- persistencia real minima de `chapter-quiz`.

## Objetivo Desta Entrega

Sair do estado de `rascunho tecnico offline` e passar a ter backend com
persistencia real minima para os tres fluxos mais centrais:

- abrir a jornada logada;
- registrar progresso autoritativo.
- concluir quiz de capitulo com snapshot consolidado.

## O Que Passou A Ser Real

### `GET /api/gamification-profile`

Agora faz:

- validacao de sessao;
- validacao de configuracao do Supabase com `service role`;
- leitura real em `gamification_profiles`;
- criacao automatica do profile no primeiro acesso quando nao existir;
- devolucao do payload consolidado para a jornada.

### `POST /api/gamification-event`

Agora faz:

- validacao de sessao;
- validacao do payload;
- verificacao real de `idempotency_key`;
- leitura ou criacao do `gamification_profiles`;
- insert real em `gamification_event_log`;
- consolidacao minima de `gamification_item_progress` para
  `study_item_complete`;
- patch real do profile consolidado com:
  - `xp_total`
  - `level`
  - `current_streak`
  - `best_streak`
  - `last_active_on`
  - `studied_items_count`
  - `chapters_mastered_count`
  - `last_quiz_summary`
  - `recent_badges_json`
  - `next_action_json`

### `GET/POST /api/chapter-quiz`

Agora faz:

- leitura real do catalogo versionado de quizzes no repo;
- entrega do quiz sanitizado para o cliente via `GET`;
- validacao de sessao e do payload via `POST`;
- correcao local das respostas no backend;
- calculo de `score`, `correct_count`, `feedback` e `xp_awarded`;
- insert real em `chapter_quiz_attempts`;
- patch real de `gamification_profiles` com:
  - `last_quiz_summary`
  - `next_action_json`
  - `xp_total`
  - `level`
  - `current_streak`
  - `best_streak`
  - `recent_badges_json`

## O Que Ainda Nao Esta Pronto

### Consolidacao transacional

Ainda nao entrou nesta fatia:

- migration oficial das funcoes transacionais;
- troca dos handlers reais para RPC;
- validacao real das funcoes contra um projeto Supabase com schema aplicado.

### Draft ja preparado offline

Mesmo sem a CLI do Supabase neste ambiente, esta fase agora ja deixa pronto:

- draft SQL de funcoes atomicas em `private`;
- contrato intermediario em que o backend calcula o `patch` e o banco grava
  tudo numa transacao;
- caminho de migracao para substituir as multiplas chamadas REST atuais.

Referencia:

- [docs/architecture/termo-gamification-phase-1c-rpc.md](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/docs/architecture/termo-gamification-phase-1c-rpc.md)
- [supabase/drafts/termo-gamification-phase-1c-rpc.sql](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/supabase/drafts/termo-gamification-phase-1c-rpc.sql)
- [supabase/drafts/termo-gamification-phase-1c-apply-package.sql](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/supabase/drafts/termo-gamification-phase-1c-apply-package.sql)
- [docs/operations/termo-gamification-supabase-apply-package.md](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/docs/operations/termo-gamification-supabase-apply-package.md)

### Cobertura local minima

O worktree offline agora tambem possui testes de contrato com `node:test`
para reduzir regressao antes da migration oficial:

- `GET /api/chapter-quiz` sem depender de Supabase;
- `POST /api/gamification-event` com `RPC mode` ligado;
- `POST /api/chapter-quiz` com `RPC mode` ligado;
- validacao da feature flag `TERMO_GAMIFICATION_RPC_MODE`.

Referencias:

- [tests/gamification-handlers.test.mjs](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/tests/gamification-handlers.test.mjs)
- [package.json](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/package.json)

### Migrations oficiais

Ainda nao foi possivel criar a migration oficial do Supabase neste ambiente
porque a CLI nao esta disponivel.

Por isso, nesta data:

- o backend foi preparado para a `Fase 1C`;
- o schema oficial continua representado pelo draft SQL da `Fase 1B`.

## Riscos E Limites Conhecidos

Esta entrega ainda nao usa RPC SQL transacional.

Implicacoes:

- `event log`, `quiz attempts` e `profile` ainda nao compartilham uma unica
  transacao;
- o fluxo de quiz foi desenhado para usar poucas leituras e escritas no
  Supabase durante esta fase de testes;
- a versao mais robusta ainda deve mover a consolidacao para funcao SQL
  idempotente quando a migration oficial entrar.

## Arquivos Alterados Nesta Entrega

- `lib/gamification-shared.mjs`
- `lib/gamification-profile-handler.mjs`
- `lib/gamification-event-handler.mjs`
- `lib/gamification-quiz-catalog.mjs`
- `lib/chapter-quiz-handler.mjs`
- `docs/architecture/termo-gamification-phase-1c-rpc.md`
- `supabase/drafts/termo-gamification-phase-1c-rpc.sql`
- `supabase/drafts/termo-gamification-phase-1c-apply-package.sql`
- `docs/operations/termo-gamification-supabase-apply-package.md`
- `tests/gamification-handlers.test.mjs`
- `package.json`

## Proximo Passo Natural

Ainda dentro da `Fase 1C`, a proxima fatia recomendada e:

1. promover o schema draft para migration oficial
2. ligar os handlers reais ao draft transacional quando a migration existir
3. testar o fluxo real ponta a ponta com schema aplicado
