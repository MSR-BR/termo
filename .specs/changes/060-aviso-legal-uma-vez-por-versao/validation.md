# Validação

## Gates

- `node --test tests/auth-legal-prompt.test.mjs tests/auth-public-config-recovery.test.mjs`
- `npm run check`
- `node --check assets/termo-auth.js`
- `git diff --check`
- Conferência do script publicado e status READY após CPD.

## Resultado local — 08/10/2026

- `node --test tests/auth-legal-prompt.test.mjs tests/auth-public-config-recovery.test.mjs`: 11 testes aprovados.
- `npm run check`: aprovado; 6 capítulos e registry editorial válidos.
- `node --check assets/termo-auth.js` e `git diff --check`: aprovados.
- Chromium local com Supabase simulado, sem conta real: primeira janela mostra aviso pendente; segunda janela da mesma conta não mostra; abertura manual continua possível; título para conta conectada está correto.
- A primeira tentativa do teste de navegador falhou apenas por ausência de `charset` no servidor de teste; repetição com UTF-8 passou. Nenhuma alteração no produto decorreu dessa falha do fixture.

## Publicação

Commit `f578359` enviado para `origin/main`. Vercel confirmou deployment de produção `dpl_4VhoEd2PYsN1bC8S1DGrSw7FvQGV` em estado READY, associado ao SHA integral desse commit. O domínio canônico `termo.app.br` respondeu HTTP 200 e entregou o novo script contendo a regra de exibição única e o título corrigido. Cache-Control do asset: `public, max-age=0, must-revalidate`.

O teste de duas janelas foi feito localmente com sessão simulada; nenhuma credencial real foi usada. O comportamento da sessão pessoal do usuário em produção não foi reproduzido automatizadamente.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback: `não observado`.
- Tokens: `não medidos`.
