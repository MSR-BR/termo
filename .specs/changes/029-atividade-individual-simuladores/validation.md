# Validação — Change 029

## Gates planejados

- [x] `npm run check`
- [x] `npm run test:simulator-activity`
- [x] `npm run test:analytics`
- [x] `npm run test:gamification`
- [ ] `npx supabase test db`
- [x] `git diff --check`
- [x] revisão do diff, SQL, RLS e segredos
- [x] validação visual desktop/mobile e por teclado do fluxo público/anônimo
- [ ] validação autenticada contra o Supabase TERMO

## Evidência de execução

- Data: 2026-09-11.
- `npm run check`: aprovado.
- `npm run test:simulator-activity`: 6/6 testes aprovados.
- `npm run test:analytics`: 7/7 testes aprovados.
- `npm run test:gamification`: 8/8 testes aprovados.
- Regressões adicionais: avaliações 6/6, SEO 6/6, editorial 6/6 e manifesto de fontes IA 12/12 aprovados.
- JavaScript inline de `index.html`: 8/8 blocos sintaticamente válidos.
- Catálogo e jornada anônima: aprovados em desktop e em viewport móvel emulado de 390 × 844 px.
- Viewport móvel: `scrollWidth = clientWidth = 390`; nenhum transbordamento horizontal.
- Abertura em nova aba preservada nos links de simuladores; falhas de registro não bloqueiam a navegação.
- `npx supabase test db --local supabase/tests/simulator_activity_rls_test.sql`: não executado porque não há stack Supabase local disponível em `127.0.0.1:54322`.
- Migration remota: não aplicada; exige autorização explícita.
- Commit, push e deploy: não realizados.

## Modelo realmente observado

- Modelo: `não exposto`
- Reasoning: `não exposto`
- Fallback utilizado: `não observado`
- Tokens: `não medidos`
- Latência: `não medida`
- Fonte da evidência: metadados do ambiente, quando disponíveis

Não substituir valores desconhecidos por estimativas.
