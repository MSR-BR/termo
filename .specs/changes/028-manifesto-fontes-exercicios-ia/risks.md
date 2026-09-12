# Riscos — Change 028

- Alterar corpus, registry ou índice sem regenerar o manifesto pode interromper
  exercícios; a falha fechada é intencional e o `npm run check` detecta o caso.
- Uma referência marcada para revisão torna a seção indisponível para geração
  até que o corpus seja corrigido e o manifesto regenerado.
- O PDF é protegido e não existe no repositório; a auditoria verifica sua
  identidade e proveniência no corpus, sem expor o arquivo.
- Remover o fallback de texto do cliente pode revelar páginas cujo HTML local
  esteja ausente; a auditoria física previne a publicação desse estado.
- Edição manual do manifesto pode introduzir divergências; ele deve sempre ser
  reconstruído pelo script.
