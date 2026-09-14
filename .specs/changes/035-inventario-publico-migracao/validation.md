# Validação — Change 035

## Gates planejados

- [x] `npm run check`.
- [x] `git diff --check`.
- [x] revisão do diff e de segredos.
- [x] confirmação de que somente documentação da Change foi alterada.
- [x] confirmação de que nenhuma mutação remota foi realizada.

Não se aplicam testes visuais, responsivos ou autenticados porque a T35 não
modifica nenhuma interface ou comportamento do produto.

## Evidência de execução

- Data: 14/09/2026.
- Estado inicial: `main...origin/main`, sem alterações locais.
- GitHub: `MSR-BR/termo` público, `main`, permissão administrativa; Pages
  `built`, fonte `main:/docs`, URL `https://msr-br.github.io/termo/`.
- Destino proposto: consulta a `MSR-BR/msr-br.github.io` retornou `404`, portanto
  não há repositório de site pessoal ocupando esse nome no estado observado.
- Vercel: projeto local e remoto `termo`, aliases `termo.app.br` e
  `termo-theta.vercel.app`, ligação GitHub com `MSR-BR/termo` e `main`.
- Produção: landing retornou `200`.
- GitHub Pages: ponte, sitemap, índice IA, Markdown e notebook amostrados
  responderam `200` em seus caminhos diretos.
- Vercel: índice IA, Markdown interno, notebook, `CODEX_CONTEXT.md`, handler de
  `lib/`, script de build, teste e migration SQL amostrados responderam `200`.
- Segurança: arquivos `.env` não são rastreados; a consulta do Vercel foi filtrada
  para metadados de projeto e não leu variáveis de ambiente.
- Editorial: o registry continua marcando o capítulo 5 como bloqueado; nenhum
  artefato editorial foi modificado.
- Gates locais: `npm run check` aprovou seis capítulos, 61 seções públicas e 43
  seções elegíveis para exercícios IA; `git diff --check` foi aprovado.
- Diff: somente o registro da Change 035 e o roadmap canônico foram alterados;
  nenhum arquivo do produto, SEO, deploy ou configuração remota entrou no diff.

## Limitações verificadas

- O token GitHub disponível não permitiu consultar instalações de GitHub Apps.
  A autorização do Vercel sobre o futuro repositório privado precisa ser
  confirmada na interface ou por um teste controlado antes do corte.
- A criação do repositório público e o comportamento de precedência entre o Pages
  de projeto atual e uma eventual pasta `/termo/` não serão testados enquanto o
  programa de privatização permanecer suspenso.

## Decisão posterior à auditoria

- Repositório principal: permanecer público.
- GitHub Pages atual: permanecer ativo e inalterado.
- T37–T40: suspensas e não criadas.
- T36: somente poderá tratar de hardening do Vercel e do índice administrativo;
  não poderá alterar a visibilidade do repositório.
- Alterações remotas decorrentes desta decisão: nenhuma.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback utilizado: `não observado`.
- Tokens, latência e custo: `não medidos`.
- Fonte da evidência: o runtime não apresentou metadados verificáveis do modelo
  efetivamente usado.
