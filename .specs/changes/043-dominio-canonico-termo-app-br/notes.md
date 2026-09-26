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

## Complemento de validação — 25/09/2026

- A propriedade de prefixo `https://termo.app.br/` foi verificada no Search
  Console e seu sitemap passou a `Success`, com 104 páginas descobertas. Ver
  T46 para distinguir descoberta de indexação efetiva.
- O fluxo web existente do GA4 (`TERMO site`, ID `15257525097`) recebeu a URL
  canônica `https://termo.app.br`, mantendo o ID de medição `G-NHEVHE096H`.
  O painel confirmou recebimento de tráfego nas últimas 48 horas. O vínculo
  GA4–Google Ads com a conta `383-835-9068` permanece concluído.
- O vínculo GA4–Search Console ainda aponta para a propriedade legada.
  O Google não oferece edição do vínculo: a substituição exige excluir a
  associação atual e criar outra. A decisão foi encaminhada ao titular;
  nenhuma exclusão foi feita nesta etapa.
- No Google Ads, os sitelinks `Abrir o App`, `Mapa de Conteúdo` e `Página
  Inicial` foram atualizados para o domínio canônico.
- A primeira tentativa de alterar a URL final do anúncio responsivo foi
  interrompida pela confirmação de identidade `AD_FINAL_URL`. Após o titular
  concluí-la no Chrome, a edição foi salva novamente. A linha do anúncio
  `816822769596` passou a mostrar a URL final persistida
  `https://termo.app.br/home.html` e o domínio de exibição `termo.app.br`.
  O histórico de alterações ainda mostrava apenas os três sitelinks no
  momento da consulta (o relatório avisa que não é em tempo real), mas o
  estado atual do anúncio confirmou a URL nova.
- O status de política ainda exibiu `Disapproved (Destination mismatch)` e
  força do anúncio `Pending` imediatamente após o salvamento. A orientação
  oficial do Google é que a edição e o salvamento reenviam o anúncio para
  revisão; aguardar o resultado antes de recorrer ou editar de novo. Isso
  não comprova elegibilidade nem retomada de impressões.
- O sitelink `Código do Projeto` continua em GitHub. Sua troca por `Buscar
  conteúdo` foi barrada pela revisão de segurança por ser uma alteração
  adicional, não apenas correção de domínio; nenhuma troca foi salva.

## Conferência posterior — 25/09/2026

- O GA4 passou a mostrar exatamente um vínculo com o Search Console: a
  propriedade de prefixo `https://termo.app.br/`, ligada ao fluxo web `TERMO
  site` (ID `15257525097`). A associação legada não aparece mais na lista.
- No Search Console, `/sitemap.xml` permanece com status `Success`, última
  leitura em 25/09/2026 e 104 páginas descobertas. Descoberta não equivale a
  indexação de todas as páginas.
- Após a revisão, o anúncio responsivo da campanha `TERMO - Search - BR - PT`
  aparece como `Enabled` e `Eligible`, com URL final
  `https://termo.app.br/home.html` e domínio exibido `termo.app.br`.
- Nenhuma campanha, orçamento, evento ou conversão foi alterado nesta
  conferência; o sitelink `Código do Projeto` segue como estava.
