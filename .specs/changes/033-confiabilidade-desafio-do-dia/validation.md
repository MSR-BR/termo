# Validação — Change 033

## Gates planejados

- [x] `node --check` nos módulos e testes alterados.
- [x] `npm run test:gamification`.
- [x] `npm run smoke:math-contract`.
- [x] `npm run smoke:ai-quiz-context`.
- [x] `npm run check`.
- [x] teste dos cinco capítulos elegíveis e exclusão do capítulo 5.
- [x] validação de URL física da retomada na contingência.
- [x] revisão do diagnóstico para impedir conteúdo bruto e dados pessoais.
- [x] `git diff --check`.
- [x] revisão visual local da rota em estado sem login, responsividade e teclado.
- [x] validação controlada do estado de falha e da contingência pela API e pelos testes.
- [x] revisão de segredos e de escopo do diff.

## Evidência de execução

- Data: 2026-09-13.
- Estado inicial: `main...origin/main`, sem alterações locais.
- Testes de gamificação: 13 testes aprovados, incluindo falha matemática realista, fallback nos capítulos 01, 02, 03, 04 e 06, bloqueio do 05 e contrato acessível de nova tentativa.
- Contrato matemático: smoke aprovado para delimitadores válidos e rejeição de dólar, LaTeX cru, atribuição crua e delimitadores desbalanceados.
- Contexto de quiz IA: cinco capítulos ativos com corpus e referências completas; simulados normais preservados com cinco perguntas.
- Conteúdo e registry: 6 arquivos de capítulo, 61 seções públicas e 43 elegíveis para exercício IA validados.
- Interface: rota local carregada corretamente no estado sem login, sem overlay nem erro de console, sem rolagem horizontal em 390 px e com ação de login alcançável por teclado. O estado de contingência foi validado pela API local e o estado de falha por teste controlado; não havia sessão autenticada local para repetir visualmente a jornada completa.
- Falha encontrada: a versão anterior pedia cinco perguntas, convertia a modalidade em `during`, só tinha catálogo estático para dois capítulos e mostrava o erro técnico.
- Correção aplicada: modalidade própria de uma pergunta, reparo de baixa temperatura, contingência editorial assinada, diagnóstico seguro, `502` e nova tentativa com intervalo.
- Publicação: commit funcional `d88ed9a` enviado a `origin/main`; deploy Vercel `dpl_BdKtJR2KMb7SPAt4hMXKLfS8TpMy` concluído como `Ready` e associado a `termo.app.br` e `termo-theta.vercel.app`.
- Produção: o endpoint canônico respondeu `200` em aproximadamente 2,5 s, com `questionCount: 1`, `chapterId: 01`, token assinado e fonte `ai_generated_on_demand`. A consulta aos logs da janela de publicação não encontrou respostas 5xx.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback utilizado: `não observado`.
- Tokens: `não medidos`.
- Latência: `não medida`.
- Custo: `não medido`.
- Fonte da evidência: o runtime não apresentou metadados verificáveis do modelo efetivamente usado.
