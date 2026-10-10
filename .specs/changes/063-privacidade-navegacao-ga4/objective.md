# Objetivo

Impedir que parâmetros desconhecidos de URLs comuns ou dados do retorno OAuth apareçam em visualizações automáticas de rota do GA4, preservando login e atribuição de campanhas. Confirmar separadamente o que pode ser verificado de SEO sem presumir indexação.

## Classificação do projeto

`INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP`

## Limites

- Fora do escopo: alteração remota de GA4, Google Ads, Search Console, Supabase, campanhas, conteúdo editorial ou domínio. O CPD da correção de código foi autorizado separadamente em 10/10/2026.
- Dependências: T62, fluxo PKCE em `termo-auth.js`, rotas em `index.html` e medição em `termo-analytics.js`.
- Decisões humanas: eventual ajuste da medição aprimorada no GA4 somente após conferência de suas opções atuais; teste real de login depende de sessão interativa do proprietário.
