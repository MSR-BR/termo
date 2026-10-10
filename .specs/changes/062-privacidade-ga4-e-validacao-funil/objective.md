# Objetivo

Impedir que códigos temporários de OAuth e parâmetros desconhecidos da URL sejam enviados no `page_location` inicial do GA4, sem perder os parâmetros conhecidos de atribuição de campanha. Validar localmente os eventos `termo_open_app` e `study_activation` antes de qualquer otimização do Ads.

## Classificação do projeto

`INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP`

## Limites

- Fora do escopo: alterações remotas no GA4, Google Ads, Supabase ou Vercel; mudanças no login; análise causal da queda histórica de eventos.
- Dependências: `assets/termo-analytics.js`, testes e fluxo atual de retorno OAuth.
- Decisão humana necessária: autorizar publicação posterior e conferir eventos reais no GA4 após a publicação.
