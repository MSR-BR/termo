# Riscos — Change 043

| Risco | Controle |
|---|---|
| Queda de URLs existentes | matriz de rotas e testes de redirecionamento antes e depois |
| Perda de SEO | 301 unidirecional, canônicos consistentes e sitemaps sem mistura |
| Falha de login/API | teste anônimo, autenticado e administrativo em domínio novo |
| Métricas divididas | revisar URLs de dados, Ads e Search Console antes da publicação |

## Gate humano

DNS, Vercel, Google Ads e Search Console só podem ser alterados com autorização
explícita no momento da execução.
