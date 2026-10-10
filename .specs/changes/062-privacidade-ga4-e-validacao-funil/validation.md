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
- [x] GA4 recebeu tráfego real após a publicação: 5 `page_view` às 09h e 2 às 13h de 10/10/2026 (fuso America/Sao_Paulo), após o deploy do código ficar `READY` às 08h06. Consulta feita às 15h14; dia ainda parcial.
- [x] Nas 22 ocorrências de eventos pós-publicação disponíveis na consulta (`eventName` + `pageLocation`), não foram encontrados parâmetros `code`, `state`, `access_token` ou `refresh_token`. O único registro com `code` no intervalo 09–10/10 ocorreu em 09/10 às 23h, antes da correção. O teste de login posterior foi confirmado separadamente pelo proprietário.
- [x] Consulta separada a `pageReferrer` nas mesmas 22 ocorrências: nenhum dos quatro parâmetros sensíveis acima; um `page_view` às 09h incluiu `trk` também no referenciador interno.
- [ ] Um dos 7 `page_view` pós-publicação ainda incluiu o parâmetro desconhecido `trk`. Nesse registro, `pageLocation` e `pageReferrer` apontam para o mesmo host/caminho; a transição é `view=chapters` → `view=simulators`, com `trk` preservado em ambas as URLs. Isso é forte evidência de visualização automática disparada por mudança de histórico; a configuração de medição aprimorada do GA4 não foi lida diretamente. A garantia de exclusão de todos os parâmetros desconhecidos ainda não está validada em produção.
- [ ] `termo_open_app` e `study_activation` não foram observados após o deploy nas horas processadas do dia 10/10; não concluir falha com essa amostra curta.
- [x] Login real pós-publicação no computador: proprietário confirmou que funcionou em 10/10/2026. A propriedade GA4 TERMO mostrou 1 `login_success` na janela Realtime de 30 minutos consultada às 17h01 (America/Sao_Paulo); a coincidência temporal é compatível, mas o relatório agregado não atribui o evento a uma pessoa.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback utilizado: `não observado`.
- Tokens: `não medidos`.
- Latência: `não medida`.
- Fonte da evidência: metadados do ambiente, quando disponíveis.
