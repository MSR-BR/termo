# Riscos

| Risco | Controle |
|---|---|
| Perder rota/callback OAuth | Preservar path, query e hash; destino fixo canônico; não trocar callback/credenciais |
| Sessão antiga ou código expirado | Novo login pode ser necessário; não prometer reaproveitar código antigo |
| Confundir opt-in com elegibilidade | Não declarar zero opt-ins por lista elegível vazia; distinguir erro |
| Enviar sem autorização | Testar com mocks; jamais acionar test/send em produção |
| Publicar arquivos de outra tarefa | Stage explícito e deploy Git, não diretório sujo |
| Vazamento | Não persistir tokens, URLs OAuth ou lista de e-mails nos artefatos |
