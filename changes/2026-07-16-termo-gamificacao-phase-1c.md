# Change Plan: TERMO Gamificacao Fase 1C

## Objetivo

Iniciar a implementacao real da `Fase 1`, ainda sem integrar o app principal.

## Escopo Desta Fatia

- persistencia real minima de `gamification-profile`
- persistencia real minima de `gamification-event`
- consolidacao minima de `item progress`
- persistencia real minima de `chapter-quiz`

## O Que Entrou

### Backend compartilhado

- `lib/gamification-shared.mjs` agora conhece:
  - `service role`
  - chamadas REST server-side
  - profile default
  - mapeamento do profile para o payload da jornada
  - consolidacao minima de XP, streak e badges

### Profile

- `lib/gamification-profile-handler.mjs` agora:
  - valida sessao
  - garante profile existente
  - le dado real de `gamification_profiles`
  - devolve payload consolidado real

### Event

- `lib/gamification-event-handler.mjs` agora:
  - valida `idempotency_key`
  - detecta duplicidade real
  - evita premiar novamente item ja estudado
  - grava `gamification_event_log`
  - atualiza `gamification_item_progress`
  - atualiza `gamification_profiles`

### Chapter Quiz

- `lib/gamification-quiz-catalog.mjs` agora:
  - publica o catalogo versionado de quizzes habilitados
  - separa payload sanitizado para o cliente
  - preserva gabarito e explicacoes apenas no backend

- `lib/chapter-quiz-handler.mjs` agora:
  - le quiz real por `chapterId` ou `quizKey`
  - corrige respostas no backend
  - grava tentativa em `chapter_quiz_attempts`
  - calcula `xp_awarded` com logica de primeira tentativa e bonus
  - gera `next_action` a partir do ultimo erro
  - atualiza `gamification_profiles` com o snapshot do ultimo quiz

### RPC Draft

- `supabase/drafts/termo-gamification-phase-1c-rpc.sql` agora:
  - prepara helper interno em `private` e RPC chamavel em `public`
  - deduplica `event log` e tentativa de quiz no lado SQL
  - consolida `event log`, `item progress`, `quiz attempt` e `profile`
    em menos round trips

- `docs/architecture/termo-gamification-phase-1c-rpc.md` agora:
  - descreve a migracao dos handlers atuais para RPC
  - documenta a estrategia intermediaria de `patch calculado no Node`
  - registra a feature flag `TERMO_GAMIFICATION_RPC_MODE`
  - registra o bloqueio atual da CLI do Supabase

- handlers reais agora:
  - continuam com fallback REST por padrao
  - ficam prontos para usar RPC quando a migration oficial existir

### Testes locais

- `tests/gamification-handlers.test.mjs` agora cobre:
  - leitura publica do catalogo de quiz
  - `gamification-event` em modo RPC
  - `chapter-quiz` em modo RPC
  - chave `TERMO_GAMIFICATION_RPC_MODE`

- `package.json` agora expõe:
  - `npm run test:gamification`

### Pacote de aplicacao no Supabase

- `supabase/drafts/termo-gamification-phase-1c-apply-package.sql` agora:
  - consolida schema minimo, RLS, grants e RPCs em um unico SQL
  - deixa grants de `service_role` explicitos
  - fica pronto para SQL Editor ou futura migration oficial

- `docs/operations/termo-gamification-supabase-apply-package.md` agora:
  - traz checklist de aplicacao
  - traz checklist de validacao pos-migration
  - organiza a ordem segura de ativacao do modo RPC

### Validacao real em Supabase

Em `July 16, 2026`, o pacote SQL consolidado foi aplicado manualmente no
projeto Supabase `termo` (`guifkjjuxsdgwjlhkmnx`) e validado contra banco real.

Fluxo REST validado com `TERMO_GAMIFICATION_RPC_MODE=false`:

- `GET /api/gamification-profile` autenticado retornou `200`;
- `POST /api/gamification-event` gravou um `study_item_complete`;
- `POST /api/chapter-quiz` gravou uma tentativa completa do quiz `cap02`;
- o perfil de teste chegou a `65` pontos.

Fluxo RPC validado com `TERMO_GAMIFICATION_RPC_MODE=true`:

- `GET /api/gamification-profile` autenticado retornou `200`;
- `POST /api/gamification-event` usou a RPC atomica e somou `20` pontos;
- `POST /api/chapter-quiz` usou a RPC atomica e somou `10` pontos;
- o perfil de teste chegou a `95` pontos.

Contagens confirmadas no Supabase apos os testes:

- `gamification_profiles`: `1`;
- `gamification_event_log`: `3`;
- `gamification_item_progress`: `2`;
- `chapter_quiz_attempts`: `2`.

Tambem passaram:

- `npm run check`;
- `npm run test:gamification` (`4/4` testes).

### Integracao offline da UI

A view `index.html?view=journey` foi integrada no worktree offline, ainda sem
commit/deploy na producao.

Nesta primeira versao visual:

- a entrada no cabecalho usa o nome `Estudo guiado`;
- a area logada busca `/api/gamification-profile`;
- o popup do usuario oferece atalho para continuar o estudo guiado;
- o layout voltou a usar cards internos, por ficar mais legivel na revisao visual;
- os simulados publicados aparecem em `Simulados disponiveis agora`;
- capitulos sem quiz publicado aparecem separadamente como `Capitulos sem
  simulado ainda`.

Regra importante de produto: nesta fatia, `simulado disponivel` significa que o
capitulo ja existe no catalogo versionado de quizzes. Os demais capitulos
continuam disponiveis para leitura, mas o quiz entra em fatias futuras.

## O Que Ficou De Fora Desta Fatia

- migration oficial criada com CLI
- rollout em producao
- limpeza dos dados tecnicos de teste no Supabase, mantidos temporariamente
  como massa minima de smoke test para a integracao offline da UI
- fluxo visual completo de resolver o simulado dentro da propria view
  `journey`

## Proximo Passo

Encerrar a `Fase 1C` como validada em banco real e seguir para as proximas
fatias offline:

1. revisar visualmente a UI real da jornada no app offline
2. integrar o fluxo visual de resolver simulado dentro do Estudo guiado
3. decidir se a primeira integracao offline deve nascer com RPC ligado por
   padrao ou com fallback REST
4. limpar ou arquivar os dados tecnicos de teste antes de qualquer rollout
   publico
