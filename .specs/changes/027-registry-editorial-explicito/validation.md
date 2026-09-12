# Validação — Change 027

Executada localmente em 2026-09-11.

| Gate | Resultado |
|---|---|
| Construção do registry | aprovado; 6 capítulos e 61 seções |
| `npm run check` | aprovado; 61 públicas e 43 elegíveis para exercício IA |
| `npm run test:editorial` | aprovado; 6/6 testes |
| `npm run test:gamification` | aprovado; 8/8 testes |
| `npm run test:analytics` | aprovado; 7/7 testes |
| `npm run test:seo` | aprovado; 6/6 testes |
| `npm run validate:search-index` | aprovado; 61 URLs e capítulo 5 ausente |
| `npm run smoke:ai-context` | aprovado |
| `npm run smoke:ai-quiz-context` | aprovado; capítulos 01, 02, 03, 04 e 06 |
| `npm run smoke:math-contract` | aprovado |
| Verificação de sintaxe dos JS/MJS alterados | aprovada |
| Validação de JSON | aprovada |
| `git diff --check` e whitespace | aprovados |
| Varredura de segredos | aprovada; nenhuma credencial incorporada |
| Navegador: seção 2.3 | exercício IA visível e operável |
| Navegador: seção 6.9 | conteúdo visível e exercício IA ausente |
| Produção | publicada e validada em `https://termo.app.br` |

Publicação em 2026-09-11:

- commit de implementação: `1e1aaf0`;
- deployment: `dpl_2k4ZBCgPAe6RK8zKNts3tynxdRsR`;
- estado Vercel: `READY`;
- aliases confirmados: `https://termo.app.br` e
  `https://termo-theta.vercel.app`;
- respostas públicas do registry, busca e páginas 2.3 e 6.9: HTTP 200;
- tentativa de exercício para 6.9: HTTP 403 com
  `section_not_ai_eligible`;
- navegador em produção: exercício presente em 2.3, ausente em 6.9 e conteúdo
  didático preservado;
- logs de erro do novo deployment: nenhum encontrado no período verificado.
