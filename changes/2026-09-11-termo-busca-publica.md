# Busca pública de conteúdo do TERMO

## Objetivo

Oferecer uma busca pública, estática e acessível para localizar somente seções revisadas e efetivamente publicadas do TERMO.

## Escopo

- página pública `search.html`, em português;
- filtro no navegador por capítulo, seção, título, descrição e palavras-chave confiáveis;
- índice gerado em `data/termo-published-search-index.json`;
- links discretos na landing e no app;
- integração da página pública ao sitemap.

## Fontes canônicas

- `data/capitulo-*.json` para identificadores, títulos, descrições e URLs;
- `data/book-topic-taxonomy.json` apenas para rótulos temáticos já existentes;
- lista positiva dos capítulos publicados confirmada pela navegação do app e pelo mapa público: 01, 02, 03, 04 e 06.

## Exclusões

- Capítulo 05 e qualquer conteúdo bloqueado ou em preparação;
- rotas pessoais, autenticação, progresso, avaliações e administração;
- Supabase, Gemini, credenciais e dados pessoais;
- simuladores como resultados independentes (as seções públicas que os contextualizam continuam pesquisáveis).

## Arquivos

- novos: `search.html`, `assets/termo-search.css`, índice e scripts de construção/validação;
- integração: `home.html`, `index.html`, `package.json`, sitemap e gerador de SEO;
- governança: este documento.

## Validação

- reconstruir e validar o índice;
- exigir que todas as URLs existam fisicamente;
- falhar se houver Capítulo 05;
- executar `npm run check`, testes de SEO e verificações de sintaxe;
- testar título, número de seção, estado vazio, `?q=`, teclado, desktop e mobile;
- executar `git diff --check`.

## Riscos

O principal risco é expor material ainda não revisado. A mitigação combina uma lista positiva de capítulos publicados, exclusão explícita do Capítulo 05 e validação automática das entradas e dos arquivos de destino. A busca permanece pública, 100% estática e limitada a conteúdo revisado/publicado.
