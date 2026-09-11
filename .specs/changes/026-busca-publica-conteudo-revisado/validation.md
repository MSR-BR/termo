# Validação — Change 026

Executado em 2026-09-11:

| Gate | Resultado |
|---|---|
| `npm run check` | aprovado |
| `npm run build:search-index` | aprovado; 61 seções |
| `npm run validate:search-index` | aprovado; URLs existentes e capítulo 5 ausente |
| `npm run test:seo` | aprovado; 6/6 testes |
| Testes no navegador | título, seção, vazio, `?q=`, teclado e mobile aprovados |
| `git diff --check` | aprovado |
| Produção | `search.html` e índice JSON responderam em `https://termo.app.br` |

Modelo e reasoning ativos: não expostos. Fallback: não observado. Tokens, custo e
latência: não medidos. Não inventar esses valores.

Publicação inicial: commit `55498df3e3a3f0e5e8c0ab2c3279a502ae3c02c6`,
push em `origin/main` e deployment Vercel
`dpl_3nYVuxw8WGrdbeEQXkALcQavdz1q`.
