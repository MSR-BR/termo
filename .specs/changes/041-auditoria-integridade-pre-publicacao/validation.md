# Validação — Change 041

## Gates planejados

- [x] `npm run check`.
- [x] testes de analytics, avaliações, gamificação, SEO, registry editorial,
  manifesto IA e atividade de simuladores.
- [x] validação do índice público de busca.
- [x] smokes do contexto de exercícios IA, simulados IA e contrato matemático.
- [x] sintaxe de todos os arquivos `.js` e `.mjs`.
- [x] auditoria de referências locais.
- [x] auditoria HTTP das rotas públicas.
- [x] validação visual e funcional no navegador.
- [x] `git diff --check`, revisão final e busca de segredos.
- [x] validação pós-deploy.

## Evidência de execução

- Data: 14/09/2026.
- Estado inicial: `main` sincronizada com `origin/main`; somente o diretório
  local `outputs/` estava sem rastreamento por conter o slide solicitado antes
  desta auditoria.
- `npm run check`: aprovado; seis capítulos, 61 seções públicas e 43 seções
  elegíveis para exercícios IA.
- Testes: 57/57 aprovados — analytics 7, avaliações 12, gamificação 13, SEO 7,
  editorial 6, manifesto IA 12 e atividade de simuladores 6.
- Sintaxe JavaScript: todos os arquivos `.js` e `.mjs` aprovados por
  `node --check`.
- Busca pública: 61 seções válidas, capítulo 5 ausente e todas as URLs físicas.
- Smokes: contexto IA representativo aprovado; cinco simulados IA mockados;
  contrato matemático aprovado nos casos válidos e nas rejeições esperadas.
- Referências estáticas: 206 arquivos públicos e 2.367 referências examinadas;
  zero arquivos ausentes.
- HTTP local: 114 rotas e recursos retornaram `200` com conteúdo significativo,
  incluindo landing, app, páginas editoriais, 61 seções, simuladores, sitemap e
  `/api/public-config`.
- Navegador: landing, catálogo do app, capítulo 1, seção 1.1, busca por
  `entropia`, estado sem resultado, catálogo de simuladores, S05 e desafio do
  dia sem sessão renderizaram conforme o contrato.
- O parâmetro legado `view=simulators&sim=...` normaliza intencionalmente para o
  catálogo; os simuladores atuais usam páginas dedicadas e nova aba, conforme a
  convenção registrada no projeto.
- Correção aplicada: nenhuma; não houve falha reproduzível.
- Gates finais: `git diff --check` aprovado; revisão do diff e varredura de
  segredos aprovadas.
- Commit auditado: `511d442`; push concluído em `origin/main`.
- Deploy de produção: `dpl_HkZiJYJkWHnEv8Zs5yWVGFdncikF`, estado `Ready`,
  promovido para `https://termo.app.br` e `https://termo-theta.vercel.app`.
- Pós-deploy HTTP: 114/114 rotas e recursos responderam `200` com conteúdo
  significativo, inclusive `/api/public-config`.
- Pós-deploy no navegador: landing, busca com 17 resultados para `entropia`,
  capítulo 1 e simulador S05 renderizaram corretamente.
- Logs Vercel: nenhum erro de runtime nem resposta `5xx` encontrado na janela
  de validação.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback utilizado: `não observado`.
- Tokens, latência e custo: `não medidos`.
- Fonte da evidência: o runtime não apresentou metadados verificáveis do modelo
  efetivamente usado.
