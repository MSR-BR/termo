# Notas e decisões — Change 049

## Premissas

- O endpoint e as variáveis públicas estão saudáveis em produção no momento da auditoria.
- A captura observada é compatível com aba antiga/bfcache somado a uma falha transitória de configuração.
- A busca de configuração não contém segredos; a chave publicável do Supabase é intencionalmente pública.

## Decisões

- Erro de transporte/HTTP/JSON será `unavailable`; resposta válida desabilitada será `missing`.
- Uma falha não será gravada como configuração canônica.
- A recuperação será limitada e explícita, sem loop contínuo.
- O callback legado de OAuth será preservado nesta Change.

## Decisões humanas pendentes

- Autorizar separadamente commit, push e deploy, caso a validação local seja aprovada.
- Migrar `AUTH_SITE_URL` somente após confirmar `termo.app.br` na allow-list do Supabase.

## Status de publicação

- Commit: realizado no fechamento da Change em 24/09/2026.
- Push: realizado para `origin/main` no fechamento da Change.
- Deploy: produção Vercel do projeto `termo`, autorizado pelo comando `cpd`.
