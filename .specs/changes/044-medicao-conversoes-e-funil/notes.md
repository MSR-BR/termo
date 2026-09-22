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

- Commit funcional: `a9373d8` (`Implement T44 analytics measurement framework`).
- Push: realizado em `main`.
- Deploy de produção: `dpl_GUS4KzJnhZyZSeW6SMg7Z5NjZEtX`.
- URL do artefato: `https://termo-qlo9atp1p-msr-brs-projects.vercel.app`.
- Aliases confirmados: `https://termo.app.br`, `https://termo-theta.vercel.app`
  e `https://termo-msr-brs-projects.vercel.app`.
- Estado: `READY`; observação de 28 dias pendente.
