# Validação

## Gates locais

- [x] `npm run test:analytics` — 14/14 testes aprovados, incluindo abertura real de página de capítulo.
- [x] `npm run test:auth-config` — 7/7 testes aprovados.
- [x] `npm run check` — conteúdo, registro editorial, fontes IA, grafo, ajuda e política de avaliação aprovados.
- [x] `node --check` dos arquivos JavaScript alterados — aprovado.
- [x] `npm run test:seo` — 11/11 testes aprovados.
- [x] `node --test tests/*.test.mjs` — 156/156 testes aprovados.
- [x] `git diff --check` — aprovado.
- [x] Revisão final do diff — restrita à medição, testes e documentação T62; arquivos preexistentes preservados.
- [x] Deployment `dpl_3vYDw2pK6T5XrP6ZNmjvBxbA5baR` do commit `f63a3e2` em produção: `READY`, alias canônico presente.
- [x] `home.html`, `index.html` e script de analytics: HTTP 200 no domínio canônico.
- [x] Script público contém a filtragem `GA_PAGE_QUERY_KEYS` e `page_location: getSafePageLocation()`; ETag mudou de `W/"f2dc86fbc1d722b5d2b0012ef96e9aa8"` para `W/"7b05596d7c0dad0d9d73828cd3496134"` e responde com `max-age=0, must-revalidate`.
- [x] Erros de execução Vercel: nenhum no intervalo de uma hora consultado após a publicação.
- [ ] GA4 Realtime: nenhum evento nos últimos 30 minutos da consulta; ingestão real e ausência de novos parâmetros OAuth ainda não verificáveis.
- [ ] Login real pós-publicação não executado; testes locais de autenticação aprovados.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback utilizado: `não observado`.
- Tokens: `não medidos`.
- Latência: `não medida`.
- Fonte da evidência: metadados do ambiente, quando disponíveis.
