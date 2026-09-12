# Validação — Change 029

## Gates planejados

- [x] `npm run check`
- [x] `npm run test:simulator-activity`
- [x] `npm run test:analytics`
- [x] `npm run test:gamification`
- [x] teste RLS equivalente executado no Supabase TERMO
- [x] `git diff --check`
- [x] revisão do diff, SQL, RLS e segredos
- [x] validação visual desktop/mobile e por teclado do fluxo público/anônimo
- [x] validação autenticada contra o Supabase TERMO

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
- Migration remota: aplicada em 2026-09-11 no projeto TERMO
  (`guifkjjuxsdgwjlhkmnx`) pelo editor SQL do painel autenticado.
- Verificação remota: tabela existente, RLS habilitada, uma policy; `anon` sem
  `SELECT`, `INSERT` ou execução da função; `authenticated` com `SELECT` e
  execução da função, mas sem `INSERT` direto.
- Commit de implementação: `5524e8b`; push e deploy ainda não realizados neste
  ponto do registro.
- Commit de registro da migration: `2912552`; ambos enviados para `main`.
- Deploy de produção: `dpl_8Zrx91xmH2yun6uqdLDsATQLLPSr`, estado `READY`,
  com alias `https://termo.app.br`.
- Smoke test de produção: HTML HTTP 200, marcação T29 e versão nova do módulo de
  dados presentes; catálogo visível e simulador aberto em nova aba.
- Teste anônimo pela Data API: leitura da tabela e execução da RPC recusadas com
  HTTP 401, sem criar atividade.
- Em 2026-09-12, uma sessão Google real registrou o simulador S01; a jornada
  exibiu primeira e última abertura e a repetição elevou a contagem de 1 para 2,
  sem alterar os 690 pontos existentes e sem erros no console do navegador.
- O teste autenticado foi realizado na sessão ativa
  `mario.reis.junior@gmail.com`; a conta `marioreis@id.uff.br` não estava ativa
  no TERMO durante essa validação.
- Isolamento RLS remoto validado com dois usuários temporários: cada identidade
  enxergou somente a própria linha, os incrementos 2× e 1× foram preservados e a
  transação foi revertida integralmente ao final.
- T29 encerrada sem pendências funcionais em 2026-09-12.

## Modelo realmente observado

- Modelo: `não exposto`
- Reasoning: `não exposto`
- Fallback utilizado: `não observado`
- Tokens: `não medidos`
- Latência: `não medida`
- Fonte da evidência: metadados do ambiente, quando disponíveis

Não substituir valores desconhecidos por estimativas.
