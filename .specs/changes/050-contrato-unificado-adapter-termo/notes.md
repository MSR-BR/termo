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

- Autorizar `cpd` desta Change, se aprovada.
- Autorizar início da T51 e qualquer acesso/mutação remota separadamente.
- Decidir se a exceção observada na raiz vazia do host legado merece uma Change
  corretiva própria; as rotas de conteúdo testadas redirecionam com `308`.

## Status de publicação

- Commit: não realizado.
- Push: não realizado.
- Deploy: não realizado e não aplicável ao comportamento público desta Change.
