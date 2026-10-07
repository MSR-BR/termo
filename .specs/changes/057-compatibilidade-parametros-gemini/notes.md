# Notas e decisões

- Avaliação: há código que envia parâmetro depreciado para modelos futuros/aliases, mas não há prova de que este TERMO gerou as chamadas citadas no e-mail. Classificação do vínculo: **não confirmado**.
- Para Gemini 2.5, remover temperatura alteraria a diversidade e a precisão pretendidas de exercícios, simulados e reparo; por isso, foi preservada.
- Para Gemini 3.8 Flash, o valor `minimal` gera erro; a T57 omite `thinkingConfig` e deixa o modelo usar seu padrão. Nenhuma migração para Interactions.
- O diff e os testes foram revisados; o proprietário autorizou o CPD em 07/10/2026. O valor de `GEMINI_MODEL` não foi exposto pelos metadados, então permanece desconhecido se a produção usa versão fixa 2.5 ou alias/modelo 3.x. Considerar QA manual de qualidade das questões caso use alias/modelo 3.x.
- Atribuição do aviso ao TERMO depende de confirmação segura do projeto da chave; não é condição para a correção preventiva do corpo da requisição.
