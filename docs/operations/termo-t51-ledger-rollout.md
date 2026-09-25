# TERMO T51 — auditoria, rollout e reversão do ledger v1

Data da preparação local: 24/09/2026

Auditoria e rollout remoto: 25/09/2026

Revisão publicada: `d001739482ad1b9f963d44606dc8e971dc708d55`

Classificação de segurança: `S2_AUTHENTICATED`

Estado: migration T51 aplicada e validada em produção; runtime v1 permanece
desativado e o caminho legado continua ativo.

## Identidade e limite da evidência

A sessão autenticada do Dashboard confirmou:

- organização: `MSR-BR's Org`;
- projeto: `termo`;
- ref: `guifkjjuxsdgwjlhkmnx`;
- branch: `main` (`PRODUCTION`);
- região: `us-east-2`;
- Postgres: `17.6`;
- estado exibido: saudável, compute Nano.

A auditoria inicial usou somente consultas `SELECT` e leitura do Dashboard.
Depois de autorização humana explícita, o auto-expose de novas tabelas foi
desligado e a migration T51 foi aplicada em uma única transação pelo SQL Editor,
com registro da versão `20260924124810` em `schema_migrations`. A divergência
histórica impediu o uso seguro de `supabase db push`, por isso nenhuma migration
anterior foi renomeada ou regravada. A variável
`TERMO_GAMIFICATION_LEDGER_V1` não foi criada nem ativada. O Dashboard continua
exibindo fim do período de carência da cota e ausência de backups; esses riscos
operacionais não foram modificados.

## Snapshot remoto anterior à T51

| Objeto | Linhas exatas | RLS | Estado |
|---|---:|---|---|
| `gamification_profiles` | 36 | ativo | schema legado, sem campos de projeção v1 |
| `gamification_event_log` | 39 | ativo | idempotência global por chave |
| `gamification_item_progress` | 30 | ativo | schema legado |
| `chapter_quiz_attempts` | 10 | ativo | sem chave idempotente própria |

As quatro tabelas permitem `SELECT` autenticado com policy de propriedade. No
estado anterior à T51, `service_role` mantém privilégios amplos, incluindo
`UPDATE`, `DELETE`, `TRUNCATE`, `TRIGGER` e `REFERENCES`; a migration v1 reduz
esses privilégios ao mínimo necessário.

O ledger remoto contém 30 eventos `study_item_complete` (600 pontos), quatro
`chapter_quiz_completed` (150 pontos) e cinco
`chapter_quiz_review_completed` (30 pontos). Não há `daily_return` persistido.
Os perfis somam 825 pontos, enquanto os eventos somam 780: existe uma diferença
histórica de 45 pontos em um perfil. Há 32 perfis sem eventos e quatro usuários
com eventos. Esse achado levou à correção do backfill local para ancorar o
baseline em **todos** os perfis, inclusive os que não possuem ledger.

## Data API remota

- Data API ativa;
- dois de três schemas expostos;
- duas de 13 tabelas expostas: `exercise_validation_reports` e
  `saved_exercises`;
- nenhuma das quatro tabelas de gamificação está exposta a papéis públicos;
- após a migration, cinco de 19 funções aparecem como expostas pela Data API;
- `set_gamification_profiles_updated_at` e
  `set_gamification_item_progress_updated_at` não são mais executáveis por
  `anon` ou `authenticated`;
- “Automatically expose new tables” está desligado;
- limite máximo de resposta: 1.000 linhas.

O auto-expose foi desligado com autorização explícita antes da migration.
Grants e RLS continuam sendo controles separados da seleção de objetos na Data
API.

## Advisors remotos

- Security Advisor: zero erros, duas advertências e três sugestões;
- advertências: `record_simulator_open` como `SECURITY DEFINER` executável por
  autenticados e proteção contra senhas vazadas desativada;
- sugestões informativas: três tabelas com RLS e sem policy, por desenho
  administrativo (`app_ratings`, `email_campaigns` e
  `user_legal_preferences`);
- Performance Advisor: zero erros, duas advertências e 20 sugestões;
- advertências: inicialização RLS em `simulator_activity` e policies
  permissivas múltiplas em `qm_exercise_validation_reports`.

Nenhuma advertência remota indica falha atual de isolamento nas quatro tabelas
de gamificação, mas os achados fora da T51 devem permanecer registrados.

## Implementação preparada

- migration oficial e aditiva:
  `supabase/migrations/20260924124810_termo_gamification_ledger_v1.sql`;
- ledger append-only por usuário, com idempotência composta por
  `(user_id, idempotency_key)`;
- projeção autoritativa e versionada do perfil;
- tentativa de simulado e evento gravados na mesma transação;
- reconciliação com `dry-run` como padrão;
- `daily_return` observável, porém sem novos pontos;
- runtime v1 protegido pela variável opt-in
  `TERMO_GAMIFICATION_LEDGER_V1=true`;
- pacote de consulta agregada e pseudonimizada em
  `supabase/drafts/termo-gamification-ledger-v1-dry-run.sql`;
- kill switch não destrutivo em
  `supabase/drafts/termo-gamification-ledger-v1-disable.sql`.

## Matriz de acesso preparada

| Objeto | `anon` | `authenticated` | `service_role` |
|---|---|---|---|
| `gamification_profiles` | sem acesso | `SELECT` da própria linha via RLS | `SELECT, INSERT, UPDATE`; sem `DELETE` |
| `gamification_event_log` | sem acesso | `SELECT` das próprias linhas via RLS | `SELECT, INSERT`; sem `UPDATE/DELETE` |
| `gamification_item_progress` | sem acesso | `SELECT` das próprias linhas via RLS | `SELECT, INSERT, UPDATE`; sem `DELETE` |
| `chapter_quiz_attempts` | sem acesso | `SELECT` das próprias linhas via RLS | `SELECT, INSERT`; sem `UPDATE/DELETE` |
| RPCs v1 de escrita/reconciliação | sem `EXECUTE` | sem `EXECUTE` | `EXECUTE` explícito |

Grants e RLS são testados separadamente. A identidade autoritativa continua
sendo obtida pelo handler server-side a partir da sessão; o navegador não pode
executar os RPCs v1 nem fornecer uma identidade com autoridade de escrita.

## Preservação do histórico

A migration calcula baselines legados para **todos** os perfis, inclusive os
que não possuem eventos, itens ou domínio no ledger. A projeção v1 soma esses
baselines ao ledger, evitando zerar ou
recompensar novamente o histórico já consolidado. Nenhuma linha histórica é
apagada. O relatório de dry run compara projeção e estado atual sem exibir
e-mail, respostas de simulado ou tokens.

## Evidências do rollout remoto

- execução transacional concluída pelo Dashboard com `Success. No rows returned`;
- uma linha registrada para a versão `20260924124810`;
- RPCs `apply_gamification_event_atomic_v1`,
  `record_chapter_quiz_attempt_atomic_v1` e
  `reconcile_gamification_profile_v1` presentes;
- 36 perfis, 39 eventos, 30 itens de progresso e 10 tentativas preservados;
- soma dos perfis: 825 XP; ledger recompensado: 780 XP; baseline legado: 45 XP;
- RLS ativo nas quatro tabelas;
- `anon` sem leitura do ledger e `authenticated` sem inserção direta no ledger;
- `service_role` com `EXECUTE` na reconciliação e `authenticated` sem esse
  privilégio;
- dry run dos 36 perfis: zero divergências de XP, itens estudados ou capítulos
  dominados;
- nenhuma reconciliação com `p_apply=true` foi executada;
- nenhuma variável de ativação foi modificada.

## Evidências locais

- suíte de banco executada em stack Supabase temporária e isolada: 46 testes
  pgTAP do pacote e 2 verificações adicionais de atualização a partir do
  esquema legado, incluindo isolamento entre usuários, grants, RLS,
  idempotência, preservação de 45 pontos sem evento correspondente, ausência
  de persistência parcial e reconciliação em dry run;
- advisors locais do Supabase: nenhum problema encontrado;
- testes de handlers, contratos, migration e suíte completa do TERMO aprovados;
- `npm run check` aprovado;
- auditoria rápida de segurança do worktree aprovada;
- capítulo 5, conteúdo editorial, SEO e UI não foram modificados.

## Bloqueio preexistente do histórico de migrations

Os arquivos
`20260531_fix_exercise_validation_rls.sql` e
`20260531_moderate_exercise_validation_reports.sql` compartilham o mesmo
prefixo de versão `20260531`. O CLI Supabase rejeita esse histórico ao montar
uma stack local completa por colisão na chave de `schema_migrations`. Além
disso, o remoto continha 14 migrations com versões completas que não coincidiam
com vários nomes abreviados do diretório local. O rollout registrou somente a
nova versão `20260924124810`, preservando integralmente as 14 linhas anteriores.

A T51 foi validada em um projeto temporário com versões únicas, sem renomear ou
alterar migrations históricas, e aplicada manualmente em uma transação
controlada. Não se deve executar `supabase db push` neste estado. O histórico
local/remoto preexistente ainda precisa ser reconciliado por um plano separado,
sem reescrever migrations já aplicadas.

## Estado da sequência de rollout

1. Histórico remoto inventariado; divergência preexistente documentada e
   `db push` mantido bloqueado.
2. “Automatically expose new tables” desligado no projeto correto.
3. Schema remoto comparado com a migration aditiva.
4. Snapshot agregado arquivado neste documento.
5. Migration aplicada transacionalmente e versão registrada sem alterar o
   histórico anterior.
6. Reconciliação executada somente com `p_apply=false`: zero divergências nos
   36 perfis.
7. Reconciliação com `p_apply=true` dispensada porque a projeção já coincide com
   todos os perfis.
8. Ativação de `TERMO_GAMIFICATION_LEDGER_V1` e testes de runtime ficam para a
   Change seguinte; nenhuma ativação foi feita nesta etapa.

## Reversão segura

1. Desativar `TERMO_GAMIFICATION_LEDGER_V1`; o runtime volta ao caminho legado.
2. Se necessário, aplicar o kill switch de RPCs v1.
3. Não apagar colunas, ledger, tentativas ou baselines; preservar evidência e
   preparar correção forward-only.
4. Reconciliar somente em dry run até a causa estar compreendida.

## Achados

| ID | Severidade | Achado | Estado |
|---|---|---|---|
| SEC-T51-01 | alta | idempotência legada global, não composta por usuário | corrigida na migration v1 |
| SEC-T51-02 | alta | escrita de evento/tentativa/perfil podia depender de etapas separadas | RPCs v1 atômicos aplicados; runtime ainda opt-in |
| SEC-T51-03 | alta | navegador não deve escrever ledger nem escolher identidade autoritativa | verificado por grants, RLS e handlers |
| SEC-T51-04 | alta | estado remoto legado divergia do contrato v1 | migration aplicada e dry run sem divergências |
| SEC-T51-05 | alta | histórico local/remoto de migrations não coincide e há duas versões locais `20260531` | bloqueia `db push` |
| SEC-T51-06 | alta | baseline anterior excluía perfis sem ledger | corrigido; 45 XP preservados no baseline remoto |
| SEC-T51-07 | média | auto-expose de novas tabelas estava ligado | desligado antes da migration |
| SEC-T51-08 | média | grants legados de `service_role` eram amplos | reduzidos pela migration v1 |
| SEC-T51-09 | alta | tabela legada de progresso não tinha `source_event_id` | upgrade aditivo corrigido e validado contra fixture legada |

Conclusão da T51: `PASS` para o rollout de schema com o runtime v1 desativado.
Dados e projeções foram preservados, isolamento e privilégios foram confirmados
e o dry run não encontrou divergências. A divergência histórica continua
bloqueando `supabase db push`, mas não exige reverter a T51. A ativação do
runtime pertence à Change seguinte e requer validação própria.
