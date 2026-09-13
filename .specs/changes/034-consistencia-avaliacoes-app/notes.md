# Notas — Change 034

## Diagnóstico

- O frontend atual usa um UUID em `localStorage` como identidade da avaliação.
- `localStorage` é separado por origem; `termo.app.br` e `termo-theta.vercel.app` recebem identificadores diferentes.
- O backend faz upsert corretamente, mas apenas para aquele identificador local.
- `ratedAt` só é gravado após sucesso; uma falha não estabelece intervalo.

## Decisão

- A sessão autenticada fornece somente o access token ao endpoint.
- O servidor valida o token no Supabase Auth e calcula `HMAC(serviceRoleKey, user.id)` com namespace específico.
- A coluna legada `visitor_hash`, já única e inacessível publicamente, armazena esse código pseudônimo; nenhuma alteração de schema é necessária.
- A consulta de estado é individual e retorna somente um booleano.
- Visitantes sem sessão continuam usando o conteúdo, mas não recebem a solicitação de avaliação.

## Domínio

Não será feita mudança de domínio nesta change. A deduplicação no servidor resolve a inconsistência entre origens sem arriscar callbacks de autenticação, links profundos ou a estratégia canônica atual.

## Publicação

- Commit funcional: `161eb7b` (`fix: deduplicate ratings by account`).
- Push: enviado a `origin/main` em 2026-09-13.
- Deploy: `dpl_FbeVb4GcF5grcsgNjXM21kL9gd6w`, produção `Ready`, aliases `termo.app.br` e `termo-theta.vercel.app`.
- Produção: consulta de estado e POST sem sessão retornaram `401`; asset versionado, intervalo e política atualizada foram confirmados; nenhum 5xx foi encontrado na janela de publicação.
