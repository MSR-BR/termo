# Requisitos — Change 032

- Preservar as versões anteriores do Pó Mágico.
- Confirmar arquivo, revisão, remoto e sincronização da versão sucessora.
- Atualizar somente as referências duráveis e a governança da Change.
- Não alterar HTML, JavaScript, CSS, APIs, banco, analytics ou campanhas.
- Não inferir modelo, reasoning, tokens, custo ou latência não expostos.

## Rota planejada

- Classe: reconciliação documental e governança versionada.
- Modelo: `gpt-5.6-terra`.
- Reasoning: `medium`.
- Justificativa: edição documental pequena, com validação determinística por
  arquivo e hash.
- Fallback: `gpt-5.6-sol / medium`.
- Escalonar se: a revisão externa não existir, o README não apontar para a
  sucessora, houver divergência de conteúdo ou falha repetida nos gates.

## Execução observada

O host não expôs de forma verificável o ID nem o reasoning do modelo ativo.
Rota real: `não exposta`; fallback: `não observado`.
