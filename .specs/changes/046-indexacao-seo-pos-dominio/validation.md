# Validação — Change 046

- [x] URLs de sitemap existem, são públicas e usam o domínio canônico (104 URLs locais).
- [x] `robots.txt`, meta robots e canônicos não conflitam no candidato local.
- [x] Nenhuma rota pessoal/administrativa/bloqueada aparece no sitemap.
- [x] Search Console recebe sitemap com sucesso: status `Success`, última leitura em 25/09/2026 e 104 páginas descobertas.
- [x] Propriedade `https://termo.app.br/` verificada por arquivo HTML na conta correta.
- [x] Envio do sitemap confirmado pela interface; o erro inicial `Couldn't fetch` foi substituído por `Success` após leitura em 25/09/2026.
- [x] Sitemap público responde HTTP 200/XML e o teste ao vivo do Google informa fetch bem-sucedido.
- [x] Testes ao vivo de `/`, `home.html`, `conteudo.html` e `search.html`: fetch bem-sucedido, indexação permitida e canonical autorreferente.
- [x] Relatório de ações manuais da nova propriedade: nenhum problema detectado.
- [x] Após confirmação do usuário, solicitação de indexação de `/`, `home.html`, `conteudo.html` e `search.html` aceita individualmente pelo Search Console; indexação efetiva ainda não confirmada.
- [x] `npm run check`, validação de SEO e `git diff --check` passam.
