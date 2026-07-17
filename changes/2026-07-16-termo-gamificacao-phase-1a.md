# Change Plan: TERMO Gamificacao Fase 1A

## Objetivo

Transformar a ideia de gamificacao em um contrato minimo de integracao real,
sem ainda alterar o app principal.

## Decisoes Fechadas

### 1. Entrada da jornada

`Minha jornada` entra pela `Area Pessoal` ja existente.

Implementacao futura:

- nova view `journey` em `index.html`;
- novo item no drawer `personal`;
- URL `index.html?view=journey`.

### 2. Visitante x logado

Visitante:

- pode abrir teaser da jornada;
- nao faz leitura no Supabase;
- recebe CTA de login.

Logado:

- abre a mesma view `journey`;
- faz uma leitura unica em `GET /api/gamification-profile`;
- ve resumo, capitulos e simulados por camadas.

### 3. Leitura consolidada

A jornada logada deve nascer de um unico payload principal contendo:

- resumo;
- proxima acao;
- missao do dia;
- badges recentes;
- ultimo simulado;
- progresso por capitulo;
- preferencias basicas.

### 4. Banco minimo

Tabelas que entram na fase 1A:

- `gamification_profiles`
- `gamification_event_log`
- `gamification_item_progress`
- `chapter_quiz_attempts`

Tabelas adiadas:

- badges normalizadas;
- missoes normalizadas;
- preferencias de notificacao dedicadas;
- logs de envio de email;
- catalogo de quiz no banco.

### 5. Conteudo de quiz

Quizzes ficam versionados no repo na primeira iteracao.

Vantagens:

- menos leitura no Supabase;
- revisao editorial mais simples;
- rollback facil por git;
- menor superficie de migracao no inicio.

### 6. Eventos autoritativos minimos

Entram:

- `study_item_complete`
- `chapter_quiz_completed`
- `chapter_quiz_review_completed`
- `chapter_quiz_retry_completed`
- `daily_return`
- `chapter_mastery_completed`

Saem desta fase:

- `exercise_saved`
- `exercise_favorited`
- `exercise_validation_submitted`
- `simulator_open_unique_day`

## Impacto Esperado

Com isso, a primeira definicao estrutural da gamificacao:

- prova o loop pedagogico principal;
- respeita a conta gratuita do Supabase;
- nao obriga reformular o app inteiro;
- deixa a `Fase 1B` livre para transformar esse contrato em rascunho tecnico
  offline.

## Arquivos De Referencia

- `docs/architecture/termo-gamification-architecture.md`
- `docs/architecture/termo-gamification-phase-1a.md`
- `.specs/termo-gamificacao-foundation/spec.md`
