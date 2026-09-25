# Arquivos — Change 046

## Possíveis modificações

- `sitemap.xml`, `robots.txt`, geradores de SEO e páginas públicas de hub;
- Search Console, apenas para envio de sitemap ou solicitação de indexação;
- registro de URLs prioritárias e evidências.

## Alterados nesta execução

- `scripts/build-seo-artifacts.mjs` e os nove HTMLs de simuladores autônomos;
- `simulators/index.html` (`noindex`) e artefatos gerados de sitemap;
- `search.html` e `assets/termo-search.css` (links internos discretos);
- `tests/seo-artifacts.test.mjs` (checagem de todas as URLs do sitemap);
- documentos de governança desta Change e roadmap.

`robots.txt` já continha a exclusão de descadastro; o gerador foi corrigido
para não apagá-la em uma regeneração futura. Não foi necessário mudar canônicos
de capítulos nem suas páginas.

## Não modificar

- Área pessoal, rotas administrativas, dados de avaliação, capítulo 5 e conteúdo privado.
