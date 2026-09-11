# Requisitos — Change 025

- Referenciar o repositório e a revisão exata do Pó Mágico.
- Registrar a classificação composta do TERMO.
- Padronizar novas Changes em `.specs/changes/` com três dígitos.
- Preservar todos os documentos existentes em `changes/`.
- Criar um modelo que cubra objetivo, requisitos, tarefas, arquivos, aceite,
  validação, riscos, decisões, evidências e publicação.
- Registrar rota planejada, rota real, reasoning, fallback e gates sem inventar
  telemetria.
- Documentar as fronteiras de Supabase, Vercel, Gemini, GA4 e Resend.
- Não alterar HTML, JavaScript, CSS, APIs, banco, conteúdo ou comportamento do app.

## Rota planejada

- Classe: planejamento, especificação e edição de governança.
- Modelo: `gpt-5.6-terra`.
- Reasoning: `medium`.
- Justificativa: rota recomendada pelo Pó Mágico para planejamento e edição
  ordinária, com validação determinística de arquivos.
- Fallback: `gpt-5.6-sol / medium`.
- Escalonar se: houver contradição entre fontes, perda do histórico, falha
  repetida nos gates ou necessidade de síntese arquitetural não resolvida.
- Disponibilidade: metadados de modelos expostos pelo runtime Codex em 2026-09-11.

## Execução observada

O host não expôs de forma verificável o ID nem o reasoning do modelo ativo desta
tarefa. Portanto, a rota real permanece `não exposta`; não houve fallback
observável.
