# Critérios de aceite — Change 034

- [x] POST sem autenticação retorna `401` antes de gravar.
- [x] Duas submissões da mesma conta, com estados locais distintos, produzem o mesmo hash e usam upsert.
- [x] Contas diferentes produzem hashes diferentes.
- [x] O payload persistido não contém `user_id`, nome, e-mail, token de acesso ou identificador local.
- [x] `GET ?scope=status` retorna apenas `rated: true|false` para a conta autenticada.
- [x] A leitura administrativa continua bloqueada para não administradores.
- [x] A avaliação já existente impede a abertura automática em outra origem autenticada.
- [x] Falha de envio impede nova abertura automática durante uma hora.
- [x] A política e o diálogo explicam que nome e e-mail não acompanham a avaliação.
- [x] Testes, checks, revisão visual e `git diff --check` passam.
- [x] CPD ocorreu somente depois dos gates locais.
