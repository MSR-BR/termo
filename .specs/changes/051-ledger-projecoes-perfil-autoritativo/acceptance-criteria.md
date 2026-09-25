# Critérios de aceite — Change 051

- [x] Retry, refresh e clique duplo não criam pontos extras nos testes locais.
- [x] Profile reconcilia exatamente com o ledger na stack local isolada.
- [x] Usuário não lê nem altera dados de outro usuário nos testes RLS locais.
- [x] Histórico remoto tem contagens verificáveis, baseline de 45 XP preservado
  e migration aplicada sem apagar linhas históricas.
- [x] Segredos, e-mails, respostas e tokens não aparecem nos artefatos ou logs gerados.
- [x] Advisors e gates locais passam; Advisors remotos foram inventariados sem mutação.
- [x] Mutação remota, ativação e deploy só ocorreram após autorizações `cpd`.
