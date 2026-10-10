# Validação

## Gates locais

- [x] `npm run check`: 6 arquivos de capítulo, registry, manifesto, grafo, ajuda e política válidos.
- [x] `npm run test:seo`: 11 testes passam, inclusive canônicos, sitemap, robots e capítulo bloqueado.
- [x] `npm run test:auth-config`: 7 testes passam.
- [x] `npm run test:analytics`: 22 testes passam, incluindo novos casos de `trk`, falha na limpeza da URL, callback OAuth, campanha, fila e rota.
- [x] `node --check assets/termo-analytics.js`.
- [x] `git diff --check`.
- [x] Commit de código `1996ced` publicado no projeto Vercel `termo`, deployment `dpl_3TnpBz4NoZFDFnbta4CdG8KefD7M` em `READY` e domínio `termo.app.br` associado.
- [x] Arquivos servidos conferidos: app, home, busca, sitemap, robots e analytics HTTP 200; código novo presente no app e no analytics.
- [x] Configuração pública de autenticação HTTP 200, habilitada para o projeto Supabase TERMO; sem leitura de credenciais.
- [x] Vercel sem erros de runtime na janela recente; contagem de drains indisponível pela API.
- [ ] Login real com sessão do proprietário e `pageLocation`/`pageReferrer` de visualizações pós-deploy ainda não confirmados. O GA4 detalhado estava atrasado: último evento às 17h42, antes do deploy das 18h50.
- [ ] Inspeção de URLs no Search Console; conector não expõe a propriedade.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback: `não observado`.
- Tokens: `não medidos`.
- Latência: `não medida`.

Não converter plano de modelo em telemetria de execução.
