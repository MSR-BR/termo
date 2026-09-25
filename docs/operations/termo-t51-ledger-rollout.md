# TERMO T51 — auditoria, rollout e reversão do ledger v1

Data da preparação local: 24/09/2026

Auditoria remota somente leitura: 25/09/2026

Baseline Git: `51210c2bac49f36b45090b4c03763757d17a51ea`

Classificação de segurança: `S2_AUTHENTICATED`

Estado: implementação local e auditoria remota somente leitura concluídas;
produção não alterada.

## Identidade e limite da evidência

A sessão autenticada do Dashboard confirmou:

- organização: `MSR-BR's Org`;
- projeto: `termo`;
- ref: `guifkjjuxsdgwjlhkmnx`;
- branch: `main` (`PRODUCTION`);
- região: `us-east-2`;
- Postgres: `17.6`;
- estado exibido: saudável, compute Nano.

A auditoria usou somente consultas `SELECT` e leitura do Dashboard. Nenhuma
migration, reconciliação, alteração de grant, toggle, variável ou deploy foi
executado. O Dashboard também exibe fim do período de carência da cota e
ausência de backups; esses riscos operacionais não foram modificados.

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
- sete de 13 funções expostas, principalmente funções de trigger;
- `set_gamification_profiles_updated_at` e
  `set_gamification_item_progress_updated_at` ainda são executáveis por
  `anon` e `authenticated`; a migration v1 revoga esse acesso;
- “Automatically expose new tables” está ligado;
- limite máximo de resposta: 1.000 linhas.

Antes do rollout, o auto-expose deve ser desligado com autorização explícita.
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
disso, o remoto contém 14 migrations com versões completas que não coincidem
com vários nomes abreviados do diretório local; a única migration remota com
“gamification” no nome é
`20260717161844_termo_gamification_revoke_event_sequence_public_access`.

A T51 foi validada em um projeto temporário com versões únicas, sem renomear ou
alterar migrations históricas. Não se deve executar `supabase db push` neste
estado. Primeiro é necessário reconciliar o histórico local/remoto por um plano
revisado, sem reescrever migrations já aplicadas.

## Sequência de rollout — requer nova autorização

1. Resolver e revisar o plano de reconciliação do histórico de migrations.
2. Desligar “Automatically expose new tables” no projeto correto.
3. Comparar novamente o schema remoto com a migration aditiva e resolver a colisão do
   histórico sem reescrever migrations já aplicadas.
4. Executar o relatório de dry run; arquivar somente contagens agregadas.
5. Aplicar a migration pelo fluxo oficial Supabase e repetir pgTAP/advisors no
   ambiente remoto autorizado.
6. Executar reconciliação primeiro em `p_apply=false`; revisar diferenças.
7. Se aprovado, reconciliar em janela controlada e confirmar contagens.
8. Ativar `TERMO_GAMIFICATION_LEDGER_V1=true` no ambiente de preview e testar
   evento, retry, clique duplo, simulado e isolamento.
9. Somente após aceite humano e comando `cpd`, publicar e validar produção.

## Reversão segura

1. Desativar `TERMO_GAMIFICATION_LEDGER_V1`; o runtime volta ao caminho legado.
2. Se necessário, aplicar o kill switch de RPCs v1.
3. Não apagar colunas, ledger, tentativas ou baselines; preservar evidência e
   preparar correção forward-only.
4. Reconciliar somente em dry run até a causa estar compreendida.

## Achados

| ID | Severidade | Achado | Estado local |
|---|---|---|---|
| SEC-T51-01 | alta | idempotência legada global, não composta por usuário | corrigida na migration v1 |
| SEC-T51-02 | alta | escrita de evento/tentativa/perfil podia depender de etapas separadas | RPCs v1 atômicos e opt-in preparados |
| SEC-T51-03 | alta | navegador não deve escrever ledger nem escolher identidade autoritativa | verificado por grants, RLS e handlers |
| SEC-T51-04 | alta | estado remoto legado diverge do contrato v1 | inventariado; migration não aplicada |
| SEC-T51-05 | alta | histórico local/remoto de migrations não coincide e há duas versões locais `20260531` | bloqueia `db push` |
| SEC-T51-06 | alta | baseline anterior excluía perfis sem ledger | corrigido localmente após auditoria remota |
| SEC-T51-07 | média | auto-expose de novas tabelas está ligado | desligamento humano pendente |
| SEC-T51-08 | média | grants legados de `service_role` são amplos | redução preparada na migration v1 |
| SEC-T51-09 | alta | tabela legada de progresso não tinha `source_event_id` | upgrade aditivo corrigido e validado contra fixture legada |

Conclusão de release: `NEEDS_REVIEW`. O pacote local foi ajustado aos dados
remotos observados, mas o histórico de migrations e o auto-expose ainda
bloqueiam o rollout. O Supabase de produção não foi alterado.
