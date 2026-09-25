# Requisitos — Change 052

## Funcionais

- [x] Criar grafo versionado de conceitos e representações; pré-requisitos permanecem vazios e inativos até revisão editorial.
- [x] Distinguir erro, baixa confiança, ajuda, solução e recuperação autônoma.
- [x] Implementar revisão guiada e near transfer.
- [x] Selecionar Desafio do dia por fraqueza, vencimento e intercalação.
- [x] Declarar capacidades pedagógicas por simulador.
- [x] Explicar próxima ação com motivo, fonte, duração e alternativa.
- [x] Aplicar o adapter v1.1 sem confundir pontos com aprendizagem.

## Segurança, IA e acessibilidade

- [x] IA usa somente fontes aprovadas e fallback determinístico.
- [x] Abrir simulador não rende pontos nem domínio.
- [x] Ausência diária não pune.
- [ ] Desktop, 320 px, zoom, teclado, leitor de tela e reduced motion passam (desktop, 320 px e teclado validados; leitor de tela com sessão autenticada permanece como verificação manual pós-publicação).

## Rota planejada

- Classe: lógica adaptativa e experiência educacional transversal.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Fallback: `gpt-5.6-sol / xhigh` após duas falhas transversais sem melhora.
