# Change Plan: TERMO Gamificacao Predeploy Checks

## Objetivo

Executar a primeira lista de verificacoes antes de qualquer deploy da
gamificacao:

- revisar merge com `main`;
- testar login real;
- testar Supabase real;
- confirmar `TERMO_GAMIFICATION_RPC_MODE`;
- validar Vercel local.

## Resultado Em July 17, 2026

### Merge Com Main

Status:

- branch atual: `codex/gamificacao-offline`;
- commit da gamificacao: `d8a32d7`;
- `main` local: `e632bbe`;
- `origin/main`: `e632bbe`;
- branch offline esta 1 commit a frente de `main`;
- nao ha divergencia remota detectada nesta checagem.

Conclusao:

- ok para seguir como branch isolado;
- antes de merge final, ainda vale repetir a checagem se `main` receber novos
  commits.

### Vercel Local

Validado em `http://127.0.0.1:3000`:

- `index.html?view=journey`: `200`;
- `index.html?view=journey&section=quiz&chapter=02`: `200`;
- `slides/capitulo-04/page_6.html`: `200`;
- `/api/public-config`: `200`, com Supabase e Google configurados;
- `/api/chapter-quiz?chapterId=02`: `200`;
- `/api/gamification-profile` sem login: `401` esperado;
- `/api/gamification-event` sem login: `401` esperado.

Conclusao:

- Vercel local esta servindo a interface e as APIs esperadas;
- os endpoints protegidos rejeitam chamadas anonimas.

### Supabase Real

Validado com service role local, sem imprimir segredos e sem gravar dados:

- `gamification_profiles`: `200`;
- `gamification_event_log`: `200`;
- `gamification_item_progress`: `200`;
- `chapter_quiz_attempts`: `200`;
- RPC `apply_gamification_event_atomic`: existente, respondeu erro de validacao
  esperado quando `p_user_id` foi enviado como `null`;
- RPC `record_chapter_quiz_attempt_atomic`: existente, respondeu erro de
  validacao esperado quando `p_user_id` foi enviado como `null`.

Conclusao:

- tabelas principais estao acessiveis pelo backend;
- RPCs existem e estao expostas para uso via service role;
- nao houve write neste smoke test.

### TERMO_GAMIFICATION_RPC_MODE

Antes da checagem:

- `.env.local`: `TERMO_GAMIFICATION_RPC_MODE=true`;
- `.env.development.local`: `TERMO_GAMIFICATION_RPC_MODE=true`;
- Vercel Production: variavel ausente.

Ajuste feito:

- adicionada `TERMO_GAMIFICATION_RPC_MODE=true` em Vercel Production;
- a variavel foi salva como `Sensitive`, portanto aparece como `Encrypted` na
  listagem da Vercel.

Conclusao:

- Production agora esta configurado para usar o caminho RPC atomico.

### Login Real

Parcialmente validado:

- config publica indica Supabase e Google presentes;
- endpoints protegidos rejeitam chamadas sem token;
- fluxo visual de login ja foi usado durante o desenvolvimento local.

Pendente antes de deploy:

- fazer uma confirmacao visual/manual final com Google no navegador:
  - abrir `index.html?view=journey`;
  - confirmar que a conta aparece logada;
  - abrir `Estudo guiado`;
  - marcar um item como estudado;
  - confirmar que pontos/checklist atualizam;
  - enviar um simulado e confirmar resultado salvo.

Motivo:

- o terminal nao deve capturar nem reutilizar token real do usuario para simular
  uma sessao Google.

## Observacao Supabase

O changelog atual do Supabase reforca que novas tabelas podem nao ser expostas
automaticamente a Data API. Por isso a validacao incluiu acesso real as tabelas
e existencia das RPCs, alem de manter RLS/grants documentados no pacote SQL.

## Proximo Passo

Antes de deploy:

1. executar a confirmacao manual de login real;
2. se passar, fazer push do branch offline;
3. abrir PR ou preparar merge controlado;
4. so entao considerar deploy.
