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
- Após o comando `CPD` do usuário, a implementação foi versionada, enviada ao
  GitHub e publicada na Vercel em 22/09/2026.

## Status de publicação

- Commit principal: `4b1d8de` (`Adopt termo.app.br as canonical domain`).
- Push: `main` enviado para `origin/main`.
- Deploy de produção: `dpl_7MdaAPs8C57QXkqt3vaqZGA6uo6c`.
- URL do artefato: `https://termo-gxy585ke2-msr-brs-projects.vercel.app`.
- Aliases confirmados: `https://termo.app.br` e
  `https://termo-theta.vercel.app`.

## Validações locais em 22/09/2026

- `npm run check`: aprovado.
- `npm run test:seo`, `npm run test:editorial`, `npm run test:analytics` e
  `npm run test:ratings`: aprovados.
- `npx vercel build --yes --target preview`: aprovado.
- Prévia local: landing, busca com `?q=entropia` e viewport de 390 px sem
  transbordamento horizontal; `search.html` apresentou 17 seções publicadas.
- `git diff --check`: aprovado.

## Validações de produção em 22/09/2026

- Deployment Vercel: `Ready`, build de 18 segundos.
- `https://termo.app.br/` e `/home.html`: HTTP 200.
- As 104 URLs publicadas no sitemap foram verificadas: nenhuma falha.
- Busca, simulador Van der Waals e `/api/public-config`: HTTP 200.
- Origem `termo-theta.vercel.app`: HTTP 308 para `termo.app.br`, preservando
  caminho e parâmetros de consulta.
- `robots.txt` aponta para `https://termo.app.br/sitemap.xml`.
- Varredura inicial de logs Vercel: nenhum erro encontrado.
- Pendentes: validar login real após retorno Google, cadastrar/verificar o
  domínio no Search Console e atualizar a URL final do Google Ads.
