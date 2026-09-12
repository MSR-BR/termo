# Validação — Change 028

Executada localmente em 2026-09-11.

| Gate | Resultado |
|---|---|
| Construção do manifesto | aprovado; 43 seções |
| Auditoria do manifesto | aprovada; 100% elegíveis, revisadas e rastreáveis |
| `npm run test:ai-source-manifest` | aprovado; 12/12 testes |
| Falha: página inexistente | detectada |
| Falha: URL ausente | detectada |
| Falha: referência ausente | detectada |
| Falha: fonte PDF ausente | detectada |
| Falha: páginas divergentes | detectada |
| Falha: revisão pendente | detectada |
| Falha: capítulo bloqueado elegível | detectada |
| Prompt com conteúdo arbitrário do cliente | impedido em teste automatizado |
| `npm run check` | aprovado |
| `npm run test:editorial` | aprovado; 6/6 testes |
| `npm run test:gamification` | aprovado; 8/8 testes |
| `npm run test:analytics` | aprovado; 7/7 testes |
| `npm run test:ratings` | aprovado; 6/6 testes |
| `npm run test:seo` | aprovado; 6/6 testes |
| Busca, corpus, taxonomia e índice temático | aprovados |
| `npm run smoke:ai-context` | aprovado; manifesto presente nos exemplos |
| `npm run smoke:ai-quiz-context` | aprovado |
| `npm run smoke:math-contract` | aprovado |
| Sintaxe JS/MJS e JSON | aprovada |
| `git diff --check` e whitespace | aprovados |
| Varredura de segredos e caminhos pessoais | aprovada |
| Produção | não publicada nesta etapa |
