# Objetivo — Change 043

Validar `termo.app.br` como domínio público do TERMO e, somente se todas as
rotas e redirecionamentos estiverem corretos, adotá-lo como endereço canônico
único sem perder tráfego, SEO, autenticação, links existentes ou métricas.

## Resultado observável

- `https://termo.app.br` atende o produto publicado com HTTPS válido;
- URLs Vercel redirecionam preservando caminho, query string e fragmento;
- canônicos, Open Graph, JSON-LD, sitemap, robots e links internos usam o
  domínio próprio; e
- GA4, Ads e Search Console passam a reconhecer o domínio canônico correto.

## Limites

- Não trocará de domínio se DNS, Vercel, rotas, autenticação ou e-mail falharem.
- Não altera conteúdo didático, Supabase, Gemini ou o capítulo 5.
