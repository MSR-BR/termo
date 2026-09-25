# Notas — Change 051

## Dependências

- T50 validada.
- Skill Supabase e documentação atual obrigatórias.
- A exposição na Data API e RLS são verificações separadas.

## Decisões pendentes

- Reconciliar futuramente o histórico local/remoto de migrations por plano
  separado, sem renomear ou regravar versões já aplicadas.
- Não usar `supabase db push` enquanto essa divergência permanecer.

## Decisões tomadas

- A T51 é opt-in e não altera o runtime público sem a variável
  `TERMO_GAMIFICATION_LEDGER_V1=true`.
- O fallback é desligar a flag; o rollback de banco é não destrutivo.
- `daily_return` permanece observável, mas não concede novos pontos.
- Tentativa de simulado, evento e projeção formam uma única transação.
- O projeto remoto foi inicialmente auditado somente para leitura e, após
  autorização explícita, recebeu a migration T51 em transação controlada.
- Duas migrations históricas usam a versão `20260531`; elas não foram
  renomeadas sem comparação com o histórico remoto.
- A diferença remota de 45 pontos revelou e corrigiu localmente um backfill que
  não cobria perfis sem ledger.
- O ensaio de upgrade revelou que `gamification_item_progress` legada não tinha
  `source_event_id`; a migration agora adiciona a coluna de forma idempotente.
- `Automatically expose new tables` foi desligado antes da migration.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback: `não observado`.
- Tokens e latência: `não medidos`.

## Publicação

- Commit: `d001739` (`feat: establish unified gamification contract and ledger v1`).
- Push: realizado em `main` em 25/09/2026.
- Migration: `20260924124810` aplicada e registrada no projeto TERMO
  `guifkjjuxsdgwjlhkmnx`.
- Dry run remoto: 36 perfis e zero divergências de XP, itens estudados e
  capítulos dominados; nenhuma reconciliação com `p_apply=true` foi necessária.
- Runtime: permaneceu desligado no fechamento da T51 e foi ativado e validado
  pela T52 com `TERMO_GAMIFICATION_LEDGER_V1=true`.
- Reconciliação documental: T55, em 25/09/2026.
