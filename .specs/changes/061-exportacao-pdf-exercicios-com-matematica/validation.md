# Validação

## Gates planejados

- [x] `npm run check` — aprovado; 61 seções públicas, 43 elegíveis para IA.
- [x] `node --test tests/*.test.mjs` — 150/150 testes aprovados.
- [x] `node --check assets/termo-exercise-pdf.js` — aprovado.
- [x] `git diff --check` — aprovado.
- [x] PDF completo do exercício 4.2 renderizado e inspecionado em A4.
- [x] Equações MathJax compostas; 40 fórmulas reconhecidas no exemplo.
- [x] Inspeção em 390 px sem rolagem horizontal; botão manual habilitado.
- [x] Clique de exportação abriu nova aba, com 2 equações compostas e botão de impressão habilitado.
- [x] Arquivo novo HTTP 200 e revisão publicada `READY` verificados no domínio canônico.

## Produção

- Revisão `8d8f0ad` em produção no deployment `dpl_H5NuAbup3dPSGt8zZ8oduGruhkvH`.
- `https://termo.app.br/assets/termo-exercise-pdf.js?v=20261009`: HTTP 200.
- `https://termo.app.br/index.html`: referência ao script e texto “Exportar PDF” confirmados.
- Vercel: nenhum erro de runtime no intervalo recente de 15 minutos consultado.
- Teste com login real em produção não executado; não se acessou dados pessoais do proprietário.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback: `não observado`.
- Tokens e latência: `não medidos`.
