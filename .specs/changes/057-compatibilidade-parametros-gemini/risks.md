# Riscos e reversão

- Se um alias móvel ainda resolver para Gemini 2.5, sua temperatura deixará de ser forçada; o ID real do alias em produção não foi revelado. Revisar qualidade e latência antes de publicar.
- Um modelo futuro pode ter regras adicionais não cobertas pelo aviso; testes locais asseguram somente o corpo enviado e tratamento do 400 simulado.
- Reversão: restaurar apenas a construção anterior de `generationConfig` nas duas chamadas, após verificar o modelo em uso. Não reverter alterações alheias no working tree.
- Nenhuma alteração de chave, projeto Google ou configuração Vercel foi feita.
