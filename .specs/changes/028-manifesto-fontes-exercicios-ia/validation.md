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
| Produção | publicada e validada em 2026-09-11 |

## Publicação

- Commit de implementação: `51106a1` (`feat: add AI exercise source manifest`).
- Deployment Vercel: `dpl_NV4QUp1cRJWYzsnbmm1LL7MXiMh5`.
- Estado: `READY`, alvo `production`.
- Build: concluído em 3 s.
- URL de produção: `https://termo.app.br`.
- Aliases confirmados: `termo.app.br`, `termo-theta.vercel.app` e
  `termo-msr-brs-projects.vercel.app`.
- Manifesto publicado: HTTP 200; 43 entradas, 43 aprovadas, nenhuma do
  capítulo 5 e nenhum caminho pessoal absoluto.
- Índice técnico publicado: HTTP 200.
- API em seção inelegível (`04` / `4.1`): HTTP 403 com
  `section_not_ai_eligible`, sem chamada ao provedor de IA.
- Logs de erro após a publicação: nenhum registro encontrado.
