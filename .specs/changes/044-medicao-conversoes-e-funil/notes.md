# Notas e decisões — Change 044

- A T42 observou 114 conversões no Ads, mas também evento técnico de page view;
  por isso conversão publicitária não será tratada como aprendizagem sem auditoria.
- O funil atual termina com zero em login concluído após exercício, possível
  efeito da configuração sequencial e não prova de falha de usuário.

## Decisões de implementação em 22/09/2026

- `study_activation` permanece o KPI central e a única conversão Ads primária
  recomendada; sua série histórica foi preservada.
- Login e avaliação foram separados do funil pedagógico porque podem ocorrer em
  momentos independentes do estudo.
- `rating_submitted` passou a ser encaminhado ao GA4 somente com nota e o
  booleano `has_feedback`; o comentário nunca é incluído.
- O identificador aleatório `session_id`, já ausente de identificação direta,
  também foi removido do payload do GA4 para reduzir cardinalidade e risco.
- A versão do analytics passou a `0922.1` e os 151 HTMLs que carregam o asset
  receberam cache busting coerente.
- GA4 e Google Ads não foram modificados. A configuração recomendada está em
  `docs/operations/termo-medicao-conversoes-funil-2026-09-22.md`.

## Status de publicação

- Commit: não realizado.
- Push: não realizado.
- Deploy: não realizado.
