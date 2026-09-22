# Notas e decisões — Change 043

- O usuário confirmou em 22/09/2026 que `termo.app.br` é o domínio adquirido
  para o TERMO e deseja tratá-lo como destino canônico.
- Em 22/09/2026, a leitura da Vercel confirmou que `termo.app.br` pertence ao
  time `msr-brs-projects`, está atribuído ao projeto `termo` e responde em HTTPS.
- Antes desta Change, tanto `termo.app.br` quanto a origem Vercel respondiam
  com o mesmo conteúdo, sem redirecionamento da origem antiga. Isso permitiria
  competição de URLs nos buscadores.
- A implementação local adota `https://termo.app.br` em canônicos, Open Graph,
  JSON-LD, sitemap, robots, compartilhamento, e-mails de teste e links públicos.
- `vercel.json` contém o redirecionamento permanente da origem Vercel para o
  domínio canônico, preservando caminho e parâmetros quando for publicado.
- `AUTH_SITE_URL` permanece temporariamente na origem Vercel: ela funciona como
  ponte de retorno OAuth até que a configuração de URLs permitidas do Supabase
  seja conferida e `termo.app.br` seja incluído e testado.
- Nenhuma alteração externa foi realizada nesta execução.

## Status de publicação

- Commit: não realizado.
- Push: não realizado.
- Deploy: não realizado.

## Validações locais em 22/09/2026

- `npm run check`: aprovado.
- `npm run test:seo`, `npm run test:editorial`, `npm run test:analytics` e
  `npm run test:ratings`: aprovados.
- `npx vercel build --yes --target preview`: aprovado.
- Prévia local: landing, busca com `?q=entropia` e viewport de 390 px sem
  transbordamento horizontal; `search.html` apresentou 17 seções publicadas.
- `git diff --check`: aprovado.
