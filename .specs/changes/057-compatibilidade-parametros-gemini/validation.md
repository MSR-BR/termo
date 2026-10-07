# Validação

## Evidência inicial

- Em 07/10/2026, `main` local em `0a9c355`; último deployment Vercel production READY do TERMO usa o mesmo SHA. As três alterações locais em scripts de injeção e o arquivo `SUPABASE-EXPLICIT-GRANTS-2026-10-30.md` antecedem esta Change e permanecem fora dela.
- Projeto Vercel TERMO `prj_fGSmfeq3VApRydE1WSIKNcEHS3KF`, time `team_jQuUBnU7RDJh0O3XASyu1WeS`. CLI listou somente metadados: `GEMINI_MODEL`, `GEMINI_FALLBACK_MODELS` e `GEMINI_API_KEY` existem em Production, todos com valor `Hidden`. Preview não mostra essas variáveis. Valores não lidos.
- O projeto Google da chave Gemini usada pelo TERMO não é demonstrado pelos metadados disponíveis. A conta Google OAuth previamente identificada não prova a origem da chave Gemini. Vínculo com o aviso enviado a `marioreis@id.uff.br`: **não confirmado**.

## Chamadas

- `lib/exercicio-handler.mjs`: REST v1beta `models/{model}:generateContent`, padrão `gemini-2.5-flash`; fallback inclui `gemini-2.5-flash`, `gemini-2.5-flash-lite` e aliases `gemini-flash-lite-latest`, `gemini-flash-latest`, além de variável opcional. Antes: `generationConfig.temperature` 0,7/0,2, `responseMimeType` JSON.
- `lib/gamification-ai-quiz.mjs`: mesmo endpoint, padrão ou variável `GEMINI_MODEL`; antes: temperatura 0,72/0,35/0,1 e `responseMimeType` JSON.
- Não há envio de `thinkingBudget`, `thinking_budget`, `thinkingLevel`, `thinking_level`, `topP`, `top_p`, `topK` ou `top_k` nessas chamadas. `temperature` é camelCase e igual em snake_case.
- Correção: módulo compartilhado inclui temperatura somente quando o ID começa com `gemini-2.5-`. Alias móvel/ID diferente não recebe amostragem. Não há `thinkingConfig` enviado.

## Fontes técnicas

- Google: https://ai.google.dev/gemini-api/docs/generate-content/thinking — Gemini 2.5 não suporta `thinkingLevel` e usa `thinkingBudget` opcional; Gemini 3.8 Flash não aceita `minimal`.
- Google: https://ai.google.dev/gemini-api/docs/generate-content/whats-new-gemini-3.6 — novos modelos depreciam `temperature`, `top_p`, `top_k`.
- Google: https://ai.google.dev/gemini-api/docs/models — modelos 2.5 existentes não estão declarados descontinuados.

## Gates

- Teste novo `node --test tests/gemini-generation-config.test.mjs`: 5/5 aprovado em 07/10/2026 (payloads de exercícios e simulados para 2.5/3.8, erro 400 simulado).
- `npm run check`: aprovado (estrutura, registro editorial, fontes, grafo, ajuda e política de avaliação).
- Testes combinados de manifesto de exercícios, gamificação e geração Gemini: 32/32 aprovados.
- `npm run smoke:ai-quiz-context` e `npm run smoke:math-contract`: aprovados, somente mocks e validação local.
- `node --check` nos três módulos modificados e no teste novo: aprovado. `git diff --check`: aprovado. Diff revisado; as três edições preexistentes em scripts de injeção e o documento Supabase continuam intocados.
- Nenhuma chamada à API Gemini realizada.

## Modelo efetivo

- Modelo: `não exposto`; raciocínio: `não exposto`; fallback: `não observado`; tokens/latência: `não medidos`.
