# Arquivos — Change 034

## Criar

- `.specs/changes/034-consistencia-avaliacoes-app/*`

## Modificar

- `.specs/changes/README.md`
- `api/app-rating.js`
- `lib/app-rating-handler.mjs`
- `assets/termo-rating.js`
- `index.html`
- `privacidade.html`
- `tests/app-rating.test.mjs`

## Não modificar

- `supabase/migrations/*`: o índice único existente em `visitor_hash` já satisfaz a deduplicação.
- configuração de autenticação, dados pessoais e e-mail;
- área administrativa, exceto pela regressão da API compartilhada;
- domínios, SEO, conteúdo científico, simuladores e gamificação.
