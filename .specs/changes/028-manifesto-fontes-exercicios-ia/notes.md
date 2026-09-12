# Notas e decisões — Change 028

- Rota planejada: `gpt-5.6-sol / high`.
- Fallback permitido: `gpt-5.6-sol / xhigh`.
- Modelo e reasoning efetivamente usados: não expostos pelo ambiente.
- Fallback observado: não exposto.
- Tokens, custo e latência: não medidos.
- Fontes canônicas: registry editorial, corpus do livro e índice temático.
- O nome do PDF é derivado do campo `pdfSource` do corpus; o caminho pessoal
  absoluto não é reproduzido no manifesto.
- O PDF continua com entrega protegida e não foi adicionado ao repositório.
- `reviewStatus: approved` é derivado da ausência de `needsReview` na seção e em
  todas as suas referências do corpus.
- A URL do manifesto substitui caminhos, títulos e conteúdo enviados pelo
  navegador na montagem do contexto aprovado.
- A memória de erros confirmados continua filtrada por `avoid_propagation = true`
  e `review_status = approved`.
- Decisões humanas pendentes: nenhuma para as 43 seções atualmente elegíveis.
- CPD autorizado pelo usuário e concluído em 2026-09-11.
- Implementação publicada a partir do commit `51106a1` no deployment
  `dpl_NV4QUp1cRJWYzsnbmm1LL7MXiMh5`.
