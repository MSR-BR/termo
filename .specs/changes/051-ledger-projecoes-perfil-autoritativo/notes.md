# Notas — Change 051

## Dependências

- T50 validada.
- Skill Supabase e documentação atual obrigatórias.
- A exposição na Data API e RLS são verificações separadas.

## Decisões pendentes

- Reconciliar o histórico local/remoto de migrations.
- Autorizar o desligamento de auto-expose no projeto confirmado.
- Autorizar separadamente migration, reconciliação, flag e rollout.
- Definir janela e reversão da reconciliação.

## Decisões tomadas

- A T51 é opt-in e não altera o runtime público sem a variável
  `TERMO_GAMIFICATION_LEDGER_V1=true`.
- O fallback é desligar a flag; o rollback de banco é não destrutivo.
- `daily_return` permanece observável, mas não concede novos pontos.
- Tentativa de simulado, evento e projeção formam uma única transação.
- O projeto remoto foi auditado somente para leitura em 25/09/2026; não há
  alegação de prontidão de produção.
- Duas migrations históricas usam a versão `20260531`; elas não foram
  renomeadas sem comparação com o histórico remoto.
- A diferença remota de 45 pontos revelou e corrigiu localmente um backfill que
  não cobria perfis sem ledger.
- O ensaio de upgrade revelou que `gamification_item_progress` legada não tinha
  `source_event_id`; a migration agora adiciona a coluna de forma idempotente.
- `Automatically expose new tables` permanece ligado; nenhuma configuração foi
  alterada.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback: `não observado`.
- Tokens e latência: `não medidos`.

## Publicação

- Commit: não realizado.
- Push: não realizado.
- Deploy/mutação remota: não realizados.
