# Riscos — Change 051

| Risco | Probabilidade/impacto | Controle | Evidência |
|---|---|---|---|
| Duplicar ou perder pontos | média/crítica | dry run, idempotência e reconciliação | relatório de contagem |
| Abrir dados entre usuários | baixa/crítica | grants mínimos e testes RLS | matriz de papéis |
| Divergir do schema real | média/alta | auditoria remota antes da migration | inventário assinado |
| Persistência parcial | média/alta | transação/RPC atômica | testes de falha |
| Perder pontos de perfil sem ledger | alta/crítica | baseline ancorado em todos os perfis | diferença remota de 45 pontos e teste de migration |
| Aplicar migrations fora de ordem | alta/crítica | reconciliar histórico local/remoto antes de `db push` | inventário de 14 migrations remotas |
| Expor novos objetos por padrão | média/alta | desligar auto-expose antes do rollout e manter grants explícitos | Data API remota |
| Quebrar eventos após upgrade da tabela de progresso legada | média/alta | adicionar `source_event_id` de forma idempotente | fixture de upgrade + pgTAP |

## Bloqueios

- Ausência de autorização para mutação.
- Histórico local/remoto de migrations não reconciliado.
- “Automatically expose new tables” ainda ligado.
