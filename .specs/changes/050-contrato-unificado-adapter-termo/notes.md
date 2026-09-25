# Notas e decisões — Change 050

## Premissas

- A T49 permanece imutável e publicada.
- O registry editorial é autoridade de elegibilidade.
- Os drafts SQL descrevem a intenção local; T51 deverá auditar o schema remoto real.

## Decisões

- O adapter v1 descreve a política alvo, não finge que o runtime já a aplica.
- `daily_return` fica sem recompensa na política, com conflito atual explícito.
- Um único simulado de 80% não basta para nova alegação de domínio.
- `record_simulator_open` é apenas atividade.
- Toda telemetria do navegador permanece analytics-only.

## Decisões humanas pendentes

- A exceção observada na raiz vazia do host legado permanece registrada como
  compatibilidade operacional; o domínio canônico continua sendo
  `https://termo.app.br`.

## Status de publicação

- Commit: `d001739` (`feat: establish unified gamification contract and ledger v1`).
- Push: realizado em `main` em 25/09/2026.
- Deploy: o contrato foi incluído na revisão publicada; a T50 isoladamente não
  ativou comportamento público nem exigiu migration remota.
- Reconciliação documental: T55, em 25/09/2026.
