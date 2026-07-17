# TERMO Gamification Fase 1B

## Posicao No Plano

Esta e a segunda subfase da `Fase 1`.

Em `July 16, 2026`, a nomenclatura corrigida ficou assim:

- `Fase 1A`: contrato minimo da jornada
- `Fase 1B`: rascunho tecnico offline
- `Fase 1C`: implementacao real de banco e backend

## Objetivo

Materializar a `Fase 1A` em artefatos de implementacao offline:

- SQL base do schema minimo;
- esqueletos de endpoints;
- esqueletos de handlers;
- contrato de validacao para eventos e quiz.

## Entregas Desta Fase

### 1. SQL draft do core de gamificacao

Arquivo:

- `supabase/drafts/termo-gamification-phase-1b-core.sql`

Observacao importante:

- o repo nao tem Supabase CLI disponivel neste ambiente;
- por isso este arquivo entra como `draft` SQL, nao como migration canonica;
- quando a integracao real com Supabase comecar, o passo correto sera gerar a
  migration oficial com a CLI e entao transplantar este conteudo revisado.

### 2. Endpoints novos

Arquivos:

- `api/gamification-profile.js`
- `api/gamification-event.js`
- `api/chapter-quiz.js`

### 3. Handlers novos

Arquivos:

- `lib/gamification-shared.mjs`
- `lib/gamification-profile-handler.mjs`
- `lib/gamification-event-handler.mjs`
- `lib/chapter-quiz-handler.mjs`

## O Que Ja Esta Pronto

### `GET /api/gamification-profile`

Ja faz:

- validacao de metodo;
- validacao de configuracao minima do Supabase;
- leitura de bearer token;
- validacao da sessao em `auth/v1/user`;
- devolucao de payload draft no contrato da jornada.

Ainda nao faz:

- leitura de `gamification_profiles`;
- agregacao real de capitulos, badges e missoes;
- fallback de teaser via backend.

### `POST /api/gamification-event`

Ja faz:

- validacao de metodo;
- validacao de sessao;
- validacao de `eventType`;
- validacao de `idempotencyKey`;
- validacao de campos obrigatorios por tipo de evento;
- devolucao do evento normalizado.

Ainda nao faz:

- insert em `gamification_event_log`;
- consolidacao de `gamification_profiles`;
- atualizacao de `gamification_item_progress`;
- liberacao de XP real.

### `GET/POST /api/chapter-quiz`

Ja faz:

- contrato de leitura de quiz por `chapterId` ou `quizKey`;
- validacao de submissao de tentativa;
- validacao de `attemptType`;
- normalizacao de respostas e timestamps.

Ainda nao faz:

- leitura do catalogo versionado de quiz;
- correcao real das questoes;
- insert em `chapter_quiz_attempts`;
- feedback persistido;
- calculo de `xp_awarded`.

## Estrategia De Banco Nesta Fase

O SQL draft da `Fase 1B` cria apenas o core:

- `gamification_profiles`
- `gamification_event_log`
- `gamification_item_progress`
- `chapter_quiz_attempts`

Principios aplicados:

- RLS em todas as tabelas;
- politicas com `TO authenticated`;
- `USING` e `WITH CHECK` nas tabelas que recebem update;
- indices minimos por usuario e tempo;
- JSONB apenas onde reduz round trip com seguranca.

## Riscos Evitados

Nesta fase a implementacao ainda nao grava nada.
Isso evita:

- schema entrar no ar cedo demais;
- endpoint parcialmente funcional gerar XP acidental;
- acoplamento prematuro do cliente ao backend;
- uso extra do Supabase antes da hora.

## Proximo Passo Natural

Com a `Fase 1B` pronta, a fase seguinte passa a ser a `Fase 1C`:

1. promover o SQL draft para migration oficial do Supabase
2. implementar queries reais em `gamification-profile`
3. implementar insert idempotente em `gamification-event`
4. ligar `chapter-quiz` ao catalogo versionado no repo
