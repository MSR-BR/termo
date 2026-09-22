# Validação — Change 044

- [x] Dicionário de eventos revisado.
- [x] Testes de evento sem PII aprovados.
- [x] Funil definido por jornada real, com login e avaliação em ramos paralelos.
- [x] Conversões Ads/GA4 reconciliadas com limitações explícitas a partir da evidência existente.
- [x] `npm run check`, testes específicos e `git diff --check` aprovados.

## Evidência local em 22/09/2026

- `npm run test:analytics`: 8/8 testes aprovados.
- `npm run test:ratings`: 12/12 testes aprovados.
- `npm run test:seo`: 7/7 testes aprovados.
- `npm run check`: aprovado.
- 151 HTMLs referenciam `termo-analytics.js?v=0922.1`; nenhuma referência à
  versão `0731.1` permanece.
- Nenhuma configuração externa, dado de usuário, conteúdo ou capítulo 5 foi alterado.
