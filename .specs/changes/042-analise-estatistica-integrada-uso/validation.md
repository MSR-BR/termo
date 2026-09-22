# Validação — Change 042

## Gates planejados

- [x] fonte, período e escopo registrados para cada conjunto de métricas;
- [x] nenhuma configuração externa alterada;
- [x] não há dados pessoais, segredos ou feedback textual no registro;
- [x] reconciliação qualitativa entre Ads, GA4 e Search Console;
- [x] revisão do estado local e de `git diff --check`.

## Evidência de execução

- Data: 2026-09-20.
- Inspeção: GA4, Google Ads e Google Search Console em navegador autenticado,
  somente leitura; `git status --short` e `git diff --check` local.
- Resultado: dados extraídos e comunicados ao usuário sem alteração de conta ou
  de produto.
- Falha encontrada: a propriedade verificada no Search Console é apenas
  `https://termo-theta.vercel.app/`; não há propriedade do domínio próprio.
- Correção aplicada: nenhuma, pois requer decisão humana sobre domínio canônico
  e autorização explícita.
- Evidência: dashboards mostraram valores e períodos diretamente nas interfaces.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback utilizado: `não observado`.
- Tokens: `não medidos`.
- Latência: `não medida`.
- Fonte da evidência: metadados do ambiente, quando disponíveis.
