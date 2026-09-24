# Critérios de aceite — Change 049

- [x] Uma falha transitória seguida de sucesso resulta em estado `configured`.
- [x] Falhas esgotadas resultam em estado `unavailable`, nunca em falsa configuração ausente persistente.
- [x] A ação “Tentar novamente” consegue refazer o bootstrap e atualizar a área aberta.
- [x] Uma resposta válida com `authEnabled: false` continua sendo tratada como configuração ausente.
- [x] O fetch usa `cache: "no-store"` e `credentials: "same-origin"`.
- [x] Pontos, desafio do dia e exercícios salvos usam a mesma mensagem e recuperação.
- [x] Retorno por bfcache revalida o estado público.
- [x] `npm run check`, testes específicos, sintaxe e `git diff --check` passam.
- [x] Não há segredo, dado pessoal ou conteúdo bloqueado no diff.
- [x] Commit, push e deploy foram autorizados para o fechamento da Change.
