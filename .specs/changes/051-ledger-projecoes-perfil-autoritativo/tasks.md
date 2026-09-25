# Tarefas — Change 051

1. [x] Confirmar organização, projeto e ref Supabase do TERMO no remoto.
2. [x] Consultar changelog, docs e comandos CLI atuais.
3. [x] Auditar remoto contra contrato e drafts locais.
4. [x] Desenhar migration oficial, rollback não destrutivo e dry run.
5. [x] Implementar ledger, projeções, RPCs e profile versionado.
6. [x] Preparar reconciliação sem duplicar pontos e validá-la localmente.
7. [x] Testar segurança, idempotência, retry e falha parcial em stack isolada.
8. [x] Rodar advisors e gates locais antes de solicitar auditoria remota.

## Próxima ação elegível

Reconciliar o histórico local/remoto de migrations sem reescrever migrations
aplicadas e desligar o auto-expose da Data API. Migration, reconciliação com
`apply=true`, variável de ambiente e deploy continuam bloqueados até revisão e
autorização explícitas.
