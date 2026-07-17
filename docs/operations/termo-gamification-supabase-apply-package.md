# TERMO Supabase Apply Package

Data de preparo: `July 16, 2026`

## Objetivo

Concentrar em um unico lugar o que precisa acontecer para promover a
gamificacao da `Fase 1C` do estado `offline pronto` para `banco real validado`.

Este pacote serve para dois cenarios:

- aplicar manualmente pelo SQL Editor do Supabase;
- transformar em migration oficial assim que a CLI do Supabase estiver
  disponivel.

## Arquivo SQL Final

Arquivo pronto para aplicacao:

- [supabase/drafts/termo-gamification-phase-1c-apply-package.sql](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/supabase/drafts/termo-gamification-phase-1c-apply-package.sql)

Esse arquivo consolida:

- schema minimo da gamificacao;
- indices;
- triggers de `updated_at`;
- RLS e policies;
- grants explicitos para `authenticated`;
- grants explicitos para `service_role`;
- helper interno em `private`;
- RPCs publicas para consolidacao atomica.

## Checklist De Aplicacao

### Antes de aplicar

- confirmar que a aplicacao sera feita primeiro em ambiente de teste;
- confirmar que o projeto Supabase usado pelo TERMO e o correto;
- confirmar que `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` e
  `SUPABASE_SERVICE_ROLE_KEY` continuam sendo as credenciais pretendidas;
- deixar `TERMO_GAMIFICATION_RPC_MODE` desligado antes da aplicacao;
- salvar snapshot ou export do schema atual se voce quiser uma referencia
  rapida de comparacao.

### Aplicacao pelo SQL Editor

1. Abrir o projeto no dashboard do Supabase.
2. Ir para `SQL Editor`.
3. Criar uma nova query.
4. Colar o conteudo de
   [supabase/drafts/termo-gamification-phase-1c-apply-package.sql](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/supabase/drafts/termo-gamification-phase-1c-apply-package.sql).
5. Executar a query inteira.
6. Verificar se nao houve erro de sintaxe, grant, policy ou dependency.

### Aplicacao via CLI quando voltar

1. Rodar `supabase migration new termo_gamification_phase_1c`.
2. Copiar o SQL consolidado para a migration gerada.
3. Aplicar no banco de teste.
4. Registrar o nome final da migration criada.

## Checklist De Validacao Pos-Migration

### Estrutura de banco

- confirmar existencia de:
  - `public.gamification_profiles`
  - `public.gamification_event_log`
  - `public.gamification_item_progress`
  - `public.chapter_quiz_attempts`
- confirmar existencia de:
  - `private.ensure_gamification_profile_row`
  - `public.apply_gamification_event_atomic`
  - `public.record_chapter_quiz_attempt_atomic`
- confirmar que RLS esta habilitado nas quatro tabelas;
- confirmar que as policies de `authenticated` existem;
- confirmar que `service_role` tem grants explicitos de uso necessarios.

### Validacao funcional sem RPC

Com `TERMO_GAMIFICATION_RPC_MODE=false`:

1. autenticar no app com um usuario de teste;
2. chamar `GET /api/gamification-profile`;
3. confirmar que o profile nasce automaticamente se nao existir;
4. disparar um `study_item_complete`;
5. confirmar que:
   - entrou linha em `gamification_event_log`
   - entrou ou atualizou linha em `gamification_item_progress`
   - `gamification_profiles` refletiu `xp_total`, `streak` e `next_action`
6. enviar um quiz de capitulo;
7. confirmar que:
   - entrou linha em `chapter_quiz_attempts`
   - `last_quiz_summary` foi atualizado
   - `recent_badges_json` e `next_action_json` ficaram coerentes

### Validacao funcional com RPC

So depois da etapa anterior passar:

1. ligar `TERMO_GAMIFICATION_RPC_MODE=true` apenas no ambiente de teste;
2. repetir o fluxo de `study_item_complete`;
3. repetir o fluxo de `chapter-quiz`;
4. confirmar que os handlers continuam respondendo `200`;
5. confirmar que o modo RPC nao gera escrita duplicada em:
   - `chapter_quiz_attempts`
   - `gamification_event_log`
6. confirmar que o fluxo de quiz em RPC nao faz o insert REST redundante que
   a versao antiga fazia;
7. validar que `idempotency_key` continua impedindo dupla premiacao.

### Validacao de seguranca

- confirmar que usuario autenticado comum nao consegue chamar as RPCs
  diretamente sem permissao adequada;
- confirmar que as RPCs seguem com `EXECUTE` apenas para `service_role`;
- confirmar que nenhuma policy abriu leitura indevida de registros de outros
  usuarios;
- revisar se o schema `private` continua sem exposicao publica na Data API.

## Smoke Tests Recomendados

### Banco

- criar um usuario de teste novo e abrir a jornada pela primeira vez;
- registrar o mesmo `study_item_complete` duas vezes e verificar que so a
  primeira premiou;
- enviar o mesmo quiz duas vezes com o mesmo `completedAt` no modo RPC e
  verificar deduplicacao;
- enviar quiz com nota alta e confirmar bonus de XP no snapshot do profile.

### App

- abrir `Minha jornada` logado;
- confirmar que o resumo carrega sem erro;
- concluir um quiz e verificar se a recomendacao seguinte nasce do ultimo
  erro ou da ultima retomada.

## Critério Para Considerar Esta Etapa Concluida

Esta etapa so deve ser considerada concluida quando:

1. o SQL consolidado tiver sido aplicado com sucesso em ambiente de teste;
2. os fluxos REST passarem em banco real;
3. os fluxos RPC passarem em banco real;
4. `TERMO_GAMIFICATION_RPC_MODE` puder ser ligado com seguranca no ambiente
   de teste;
5. a equipe sentir confianca para partir da arquitetura offline para a
   integracao no app principal.

## Registro De Validacao Real

Data: `July 16, 2026`

Projeto Supabase validado:

- nome: `termo`;
- ref: `guifkjjuxsdgwjlhkmnx`.

Preparacao local:

- `.env.local` criado no worktree offline;
- `SUPABASE_SERVICE_ROLE_KEY` preenchida localmente, sem commit;
- `.env.development.local` criado apenas para teste local;
- `.gitignore` atualizado para ignorar `.env.*.local`;
- servidor local iniciado com variaveis carregadas explicitamente para o
  `vercel dev`.

Validacao REST com `TERMO_GAMIFICATION_RPC_MODE=false`:

- `GET /api/gamification-profile` autenticado retornou `200`;
- `POST /api/gamification-event` persistiu `study_item_complete`;
- `POST /api/chapter-quiz` persistiu tentativa completa do `cap02`;
- profile de teste chegou a `65` pontos.

Validacao RPC com `TERMO_GAMIFICATION_RPC_MODE=true`:

- `GET /api/gamification-profile` autenticado retornou `200`;
- `POST /api/gamification-event` persistiu via
  `public.apply_gamification_event_atomic`;
- `POST /api/chapter-quiz` persistiu via
  `public.record_chapter_quiz_attempt_atomic`;
- profile de teste chegou a `95` pontos.

Contagens confirmadas no banco apos a validacao:

- `public.gamification_profiles`: `1`;
- `public.gamification_event_log`: `3`;
- `public.gamification_item_progress`: `2`;
- `public.chapter_quiz_attempts`: `2`.

Validacao local final:

- `npm run check`: passou;
- `npm run test:gamification`: passou com `4/4` testes.

Observacao operacional:

- os dados acima pertencem a um usuario tecnico criado para validacao local;
- decisao atual: manter temporariamente esses dados tecnicos como massa minima
  de smoke test durante a integracao offline da UI real;
- antes de um rollout publico, limpar ou arquivar esses dados de teste de forma
  explicita;
- o modo RPC ficou validado, mas a escolha de liga-lo por padrao na proxima
  etapa ainda deve ser uma decisao explicita.

## O Que Ainda Nao Faz Parte Deste Pacote

- rollout em producao;
- ativacao no app principal;
- notificacoes por email em producao;
- normalizacao adicional de badges, missoes e catalogos em tabelas separadas.
