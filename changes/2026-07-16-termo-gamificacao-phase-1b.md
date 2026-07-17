# Change Plan: TERMO Gamificacao Fase 1B

## Objetivo

Converter o contrato minimo da `Fase 1A` em artefatos tecnicos concretos, ainda sem
ativar persistencia real.

## O Que Entrou

### Core de backend

- `api/gamification-profile.js`
- `api/gamification-event.js`
- `api/chapter-quiz.js`
- `lib/gamification-shared.mjs`
- `lib/gamification-profile-handler.mjs`
- `lib/gamification-event-handler.mjs`
- `lib/chapter-quiz-handler.mjs`

### Core de banco

- `supabase/drafts/termo-gamification-phase-1b-core.sql`

### Documentacao

- `docs/architecture/termo-gamification-phase-1b.md`

## Decisoes Fechadas

### 1. Persistencia continua desligada

Os endpoints da `Fase 1B` validam contrato e sessao, mas nao gravam nada ainda.

### 2. Migration oficial ainda nao foi criada

Como a CLI do Supabase nao esta disponivel neste ambiente, o schema entrou como
`draft` SQL.

### 3. Contrato do profile ja esta executavel

Mesmo sem leitura real do banco, o endpoint de profile ja devolve o shape que a
UI da jornada deve consumir.

### 4. Contrato de evento ja esta protegido

Eventos invalidos ja falham com `422`, antes de qualquer integracao real.

### 5. Contrato de quiz ja delimita os tres tipos de tentativa

- `full_quiz`
- `guided_review`
- `focused_retry`

## Proximo Passo

Fase 1C:

- promover o SQL draft a migration oficial;
- implementar consultas reais no profile;
- implementar insert idempotente no event log;
- implementar correcao real do `chapter-quiz`.
