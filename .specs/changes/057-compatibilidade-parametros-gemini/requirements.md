# Requisitos

- Inspecionar `generateContent` real e camelCase/snake_case de `temperature`, `topP`, `topK`, `thinkingBudget` e `thinkingLevel`.
- Para modelos `gemini-2.5-*`, preservar `temperature`: exercícios 0,7 (formatação e revisão 0,2), simulado 0,72, desafio 0,35 e reparo matemático 0,1.
- Para outros modelos e aliases móveis, omitir amostragem; preservar `responseMimeType: application/json`. Não impor `thinkingLevel`; Gemini 2.5 não o suporta e o padrão de Gemini 3 evita um valor inválido como `minimal` no 3.8 Flash.
- Manter modelos, chaves, ambiente, endpoint `generateContent`, fallback e política editorial existentes.
- Não fazer chamada paga, deploy, commit, push ou alteração remota nesta etapa.

## Rota planejada

- Classe: correção de compatibilidade de API com testes de contrato.
- Modelo recomendado: `gpt-6.1-sol / high`.
- Justificativa: dois fluxos de geração e preservação do comportamento 2.5.
- Fallback: `gpt-6.1-sol / xhigh` se os testes revelarem ambiguidade de modelo/contrato.
- Execução real: modelo e raciocínio não expostos pelo runtime; não inferidos.
