# Notas e decisões

- Inspeção em 02/10/2026. Migração QUANTUM confirmada pelo proprietário; nenhum arquivo QUANTUM alterado.
- Repositório real localizado em Documents/Developer/termo; caminho histórico Documents/GitHub/termo não existe.
- Site URL Supabase ainda http://localhost:3000; canonical termo.app.br não consta na allowlist. Fora do escopo de limpeza: login atual usa redirect explícito termo-theta.vercel.app, que será preservado. Não corrigir junto sem uma Change própria.
- Preview: verificação real pendente por inexistência de ambiente; não confundir deployment production com Preview.
- Alterações preexistentes não pertencem à T56: scripts/inject-auth-assets.mjs, scripts/inject-share-assets.mjs, scripts/inject-user-data-assets.mjs, SUPABASE-EXPLICIT-GRANTS-2026-10-30.md.

## Publicação

Alterações remotas já salvas no Google Cloud e no Supabase TERMO em 02/10/2026: duas origens qm e um callback antigo removidos no Google; dois redirects qm removidos no Supabase. Valores restantes conferidos após reabertura/reload em oauth-after.json. Código da aplicação não alterado. Reversão documentada em risks.md e oauth-before.json.

CPD limpo autorizado em 03/10/2026. Publicar somente esta pasta e sua linha no roadmap. Os três scripts modificados e o arquivo SUPABASE-EXPLICIT-GRANTS-2026-10-30.md não pertencem a este CPD e permanecem locais. Preferir deploy da integração Git do commit conferido, nunca upload do diretório com alterações preexistentes. Verificações npm run check e npm run test:auth-config repetidas e aprovadas antes do commit. Resultado da publicação será conferido no provedor.
