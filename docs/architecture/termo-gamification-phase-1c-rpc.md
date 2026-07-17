# TERMO Gamification Fase 1C RPC Draft

## Objetivo

Preparar a transicao da `Fase 1C` do modo `multiplas chamadas REST` para
`consolidacao atomica por SQL`, ainda sem tocar no projeto em producao e sem
depender da CLI do Supabase neste ambiente.

## Motivacao

Hoje os handlers reais da jornada ja funcionam, mas ainda gravam em etapas:

- `gamification-event` grava `event log`, depois `item progress`, depois
  `profile`;
- `chapter-quiz` grava `quiz attempt` e depois atualiza `profile`.

Isso ja e suficiente para a fase offline, mas deixa duas fragilidades:

- mais round trips ao Supabase;
- risco de persistencia parcial quando uma etapa salva e a seguinte falha.

## Estrategia Adotada

Em vez de mover toda a regra de negocio para SQL agora, o draft desta fase
prepara uma abordagem intermediaria:

- a regra de XP, streak, badges e `next_action` continua no backend Node;
- o banco recebe `patches` consolidados ja calculados;
- o SQL passa a cuidar da parte atomica de gravacao.

Isso mantem a conta gratuita protegida nesta etapa porque:

- evita leituras extras repetidas;
- reduz o numero de escritas por fluxo;
- adia normalizacao mais pesada para depois da validacao do conceito.

## Feature Flag De Transicao

Os handlers offline agora podem ser preparados para a virada sem trocar o
comportamento padrao.

Chave prevista:

- `TERMO_GAMIFICATION_RPC_MODE=true`

Comportamento:

- ausente ou `false`: continua no fluxo REST atual, ja funcional;
- `true`: tenta usar as funcoes RPC previstas nesta arquitetura.

Observacao:

- este modo ainda depende de a migration SQL oficial existir no Supabase;
- por isso, ele deve permanecer desligado ate a promocao do draft.

## Funcoes Draft

Arquivo:

- [supabase/drafts/termo-gamification-phase-1c-rpc.sql](/Users/marioreis/Library/CloudStorage/Dropbox/Mac%20(6)/Documents/GitHub/termo/worktrees/gamificacao-offline/supabase/drafts/termo-gamification-phase-1c-rpc.sql)

### `private.ensure_gamification_profile_row`

Responsabilidade:

- garantir que o usuario tenha linha em `gamification_profiles`;
- travar a linha para atualizacao no fluxo transacional.

### `public.apply_gamification_event_atomic`

Responsabilidade:

- deduplicar `idempotency_key`;
- bloquear dupla premiacao de `study_item_complete`;
- gravar `gamification_event_log`;
- opcionalmente atualizar `gamification_item_progress`;
- aplicar o `profile_patch` na mesma transacao.

Entrada esperada do backend:

- metadados do evento;
- `payload` do evento;
- `profile_patch` ja calculado em Node;
- `item_progress_patch` quando existir.

### `public.record_chapter_quiz_attempt_atomic`

Responsabilidade:

- deduplicar tentativa por combinacao simples de
  `user_id + quiz_key + attempt_type + completed_at`;
- gravar `chapter_quiz_attempts`;
- opcionalmente gravar evento correlato em `gamification_event_log`;
- aplicar o `profile_patch` do quiz na mesma transacao.

Entrada esperada do backend:

- tentativa corrigida;
- `xp_awarded`;
- `answers` e `feedback`;
- `profile_patch` ja calculado em Node;
- `event_type` e `event_idempotency_key` quando o quiz tambem gerar evento.

## Decisoes De Seguranca

- helper interno fica em `private`;
- funcoes RPC chamaveis ficam em `public`;
- execucao concedida apenas para `service_role`;
- `security invoker`;
- `search_path` vazio;
- nenhum grant para `anon` ou `authenticated`.

Motivo:

- o schema `private` nao fica acessivel pela Data API do Supabase;
- por isso, a funcao chamavel por `/rpc` precisa viver em schema exposto;
- o cliente nao deve chamar essas funcoes;
- o backend server-side continua sendo a unica porta de entrada;
- isso evita expor uma RPC privilegiada cedo demais.

## Como Os Handlers Devem Migrar

### `gamification-event`

Estado atual:

- varias chamadas REST server-side.

Estado desejado:

1. validar sessao
2. calcular `applied.next` no Node
3. chamar `public.apply_gamification_event_atomic`
4. devolver o profile retornado pela funcao

### `chapter-quiz`

Estado atual:

- insert da tentativa
- patch separado do profile

Estado desejado:

1. validar sessao
2. corrigir quiz no Node
3. calcular `quizSummary`, `nextAction` e `applied.next`
4. chamar `public.record_chapter_quiz_attempt_atomic`
5. devolver o profile retornado pela funcao

## O Que Ainda Nao Resolve

Este draft ainda nao e a versao final da arquitetura.

Ainda ficam pendentes:

- migration oficial criada pela CLI;
- teste real contra um projeto Supabase com o schema aplicado;
- eventual migracao de parte da regra de negocio para SQL se o volume crescer;
- politica final de deduplicacao para quiz, caso o cliente passe a reenviar
  tentativas por erro de rede.

## Proximo Passo Quando A CLI Estiver Disponivel

1. criar a migration oficial com `supabase migration new`
2. mover este draft para a migration
3. aplicar em ambiente de teste
4. trocar os handlers reais para RPC
5. verificar se a versao REST antiga pode ser removida
