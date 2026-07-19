# Change Plan: TERMO Exercicios IA Com Referencia No Livro

## Objetivo

Corrigir e elevar a qualidade dos exercicios e simulados gerados por IA no TERMO,
fazendo com que eles usem o PDF do livro como fonte canonica de definicoes,
equacoes, convencoes e contexto conceitual.

Esta fase nasce de dois problemas observados:

- erros conceituais e de definicao em exercicios gerados por IA;
- erros de apresentacao matematica, com LaTeX aparecendo quebrado ou exposto
  como codigo para o aluno.

## Decisao De Arquitetura

O PDF inteiro pode continuar como fonte-mae do livro.

Porem, a IA nao deve consultar nem baixar o PDF inteiro a cada geracao. Para
proteger a conta gratuita do Supabase e reduzir custo/latencia, o fluxo correto e:

1. usar o PDF unico do livro como origem;
2. gerar offline um corpus tecnico por capitulo/secao;
3. usar esse corpus no backend para exercicios e simulados;
4. manter PDFs derivados apenas como material de revisao humana, nao como fonte
   principal da IA em runtime.

## Estado Atual Local

Status: AI-01 concluida localmente em 2026-07-19, sem commit/push/deploy.

O que ja existe localmente, ainda sem commit/push/deploy:

- `scripts/extract-book-sections.mjs`;
- `lib/book-section-corpus.mjs`;
- `data/book-section-corpus.json`;
- `scripts/build-book-reference-pdfs.mjs`;
- PDFs derivados em `output/pdf/book-reference/`.

Piloto validado:

- 61 itens mapeados entre app e PDF;
- Capitulo 01: 19 itens;
- Capitulo 02: 9 itens;
- Capitulo 03: 11 itens;
- Capitulo 04: 11 itens;
- Capitulo 06: 11 itens.

Resultado da revisao do piloto:

- a correlacao automatica inicial errou o fim da secao `2.3`;
- a secao `2.3` deve usar paginas PDF `26-28`;
- o corpus textual corta corretamente antes de `3.3.3 Entalpia`;
- o PDF derivado visual mostra a pagina inteira, portanto pode conter inicio da
  proxima secao, mas isso nao deve ser usado como entrada direta da IA.
- o item `4.1` estava apontando para `5.1.4 Energia livre`, mas foi corrigido
  para o inicio de `5.1 Gas de Van der Waals`, pagina PDF `63`;
- o Cap. 04 do app foi corrigido para o Cap. 5 do PDF, paginas `63-84`;
- o Cap. 06 do app foi corrigido para o Cap. 7 do PDF, paginas `95-126`;
- `pdftotext` retorna algumas paginas vazias; o extrator agora usa
  `pdfplumber` como extracao complementar e registra `extractionSources`.

## Change AI-01 - Corpus Canonico Do Livro E Mapa Por Pagina Do App

Status: concluido localmente.

### O Que Muda

Criar uma base tecnica, gerada a partir do PDF do livro, com:

- trechos canonicos extraidos do livro;
- uma entrada por item/pagina do app;
- um mapa `pageReferences[]` capaz de apontar uma pagina do app para uma ou
  varias referencias do PDF.

Formato esperado:

```json
{
  "chapterId": "02",
  "itemId": "2.3",
  "topicTitle": "Energia Livre de Helmholtz",
  "pagePath": "slides/capitulo-02/page_3.html",
  "pdfChapterNumber": "3",
  "pdfChapterTitle": "Potenciais Termodinamicos e Aplicacoes",
  "pageStart": 26,
  "pageEnd": 28,
  "mappingReason": "Helmholtz starts in PDF section 3.3.2 and continues through Example 3.1.",
  "referenceCount": 1,
  "references": [
    {
      "id": "02:2.3:1",
      "label": "Energia Livre de Helmholtz",
      "pageStart": 26,
      "pageEnd": 28,
      "startMarker": "3.3.2 Energia Livre de Helmholtz",
      "endMarker": "3.3.3 Entalpia"
    }
  ],
  "content": "...",
  "excerpt": "..."
}
```

Para paginas que usam mais de uma parte do PDF:

```json
{
  "pagePath": "slides/capitulo-02/page_8.html",
  "chapterId": "02",
  "itemId": "2.8",
  "topicTitle": "Relações de Maxwell e Retângulo Termodinâmico",
  "referenceCount": 2,
  "references": [
    {
      "label": "Relacoes de Maxwell",
      "pageStart": 32,
      "pageEnd": 34
    },
    {
      "label": "Retangulo termodinamico",
      "pageStart": 34,
      "pageEnd": 35
    }
  ]
}
```

### Regras De Correlacao

A correlacao deve combinar:

- `chapterId` do app;
- `itemId` do app;
- titulo da pagina HTML;
- titulo da secao no PDF;
- pagina inicial/final no PDF;
- marcadores textuais de inicio e fim, como `3.3.2 Energia Livre de Helmholtz`
  e `3.3.3 Entalpia`.

### Regra Importante

Quando uma pagina PDF contem fim de uma secao e inicio da proxima, o corpus deve
cortar por marcador textual. O PDF derivado pode continuar recortando pagina
inteira, mas a IA deve usar o corpus textual, nao o PDF derivado.

Tambem nao se deve assumir que:

- uma pagina do app equivale a exatamente uma secao do PDF;
- uma secao do PDF equivale a exatamente uma pagina do app.

O mapa deve aceitar:

- uma pagina do app usando uma referencia do PDF;
- uma pagina do app usando varias referencias do PDF;
- varias paginas do app usando a mesma referencia do PDF;
- pagina do app usando trecho do PDF + contexto proprio do HTML.

### Arquivos Provaveis

- `scripts/extract-book-sections.mjs`;
- `lib/book-section-corpus.mjs`;
- `data/book-section-corpus.json`;
- `data/capitulo-XX.json`.
- `scripts/validate-book-corpus.mjs`.

### Validacao

- `Cap. 02 / Secao 2.3` comeca em `3.3.2 Energia Livre de Helmholtz`.
- `Cap. 02 / Secao 2.3` inclui a conclusao do Exemplo 3.1.
- `Cap. 02 / Secao 2.3` nao inclui `3.3.3 Entalpia`.
- `Cap. 02 / Secao 2.8` tem duas referencias: Maxwell e Retangulo Termodinamico.
- Cada secao com exercicio IA tem `content` suficiente para gerar exercicio.
- Secoes ambiguas ficam marcadas com `needsReview` ou `mappingReason`.
- `node scripts/validate-book-corpus.mjs` termina com `Estrutura do corpus valida`.

### Estado Atual Da AI-01

Implementado localmente:

- geracao de `sections`;
- geracao de `pageReferences`;
- suporte a multiplas referencias por pagina;
- overrides auditaveis para Caps. 01, 02, 03, 04 e 06;
- validador estrutural do corpus;
- helper `getBookSectionContext` retornando `references[]`;
- registro de `mappingReason` e `extractionSources`;
- pagina local de revisao com amostras e links para PDFs derivados.

Resultado da validacao local:

- `node scripts/validate-book-corpus.mjs` termina com `Estrutura do corpus valida`;
- nenhum item fica marcado como `needsReview`;
- nenhum item fica com `content` vazio;
- Cap. 02 tem `2.8` com multiplas referencias;
- alguns itens usam `pdfplumber-fallback`, o que indica extracao textual menos
  limpa, mas com endereco principal correto no PDF.

Ainda pendente fora da AI-01:

- decidir se o corpus completo sera versionado em `data/` ou movido para area
  server-only antes do deploy;
- conectar o corpus ao gerador real de exercicios na AI-03;
- avaliar OCR ou recorte manual para paginas em que o texto extraido pelo PDF
  ficou ruidoso.

## Ferramenta De Apoio AI-01A - PDFs Derivados Para Revisao Humana

Status: implementado localmente.

### O Que Muda

Gerar PDFs auxiliares por capitulo e secao para revisao humana da correlacao.

Exemplos:

- `output/pdf/book-reference/termo-capitulo-02-potenciais-termodinamicos-e-aplicacoes.pdf`;
- `output/pdf/book-reference/termo-capitulo-02-secao-2-3-energia-livre-de-helmholtz.pdf`.

### Uso Correto

Esses PDFs sao para revisao do professor/desenvolvimento.

Eles nao devem ser usados diretamente pelo backend como fonte de geracao em
runtime, porque:

- recortam paginas inteiras;
- podem conter restos de secoes anteriores ou seguintes;
- aumentariam complexidade sem melhorar a confiabilidade da IA.

### Arquivos Provaveis

- `scripts/build-book-reference-pdfs.mjs`;
- `output/pdf/book-reference/`.

### Validacao

- PDF do capitulo abre com as paginas esperadas.
- PDF da secao tem as paginas que cobrem aquela secao.
- Quando houver pagina compartilhada, registrar que o corpus textual e a fonte
  correta para a IA.

## Change AI-02 - Indice Tematico Completo E Multi-Fragmento

Status: iniciada localmente, com ponto zero e primeiro indice gerado.

### Decisao Atual

A AI-02 nao deve mapear apenas alguns topicos especiais, como Helmholtz, Gibbs
ou Maxwell.

Todas as secoes do app precisam virar entradas de um indice tematico. Alem disso,
alguns temas sao transversais e devem apontar para varias secoes quando o mesmo
conceito reaparece em outro contexto.

Exemplos:

- `calor` aparece em Cap. 01, potenciais/entalpia e ciclos;
- `trabalho` aparece em fundamentos, transformacoes de Legendre e ciclos;
- `helmholtz` aparece em potenciais, estatistica e transicoes de fase;
- `gibbs` aparece em potenciais e coexistencia de fases;
- `paradoxo de Gibbs` nao entra no tema `gibbs`, porque e outro conceito e nao
  deve contaminar geracoes sobre energia livre de Gibbs;
- `maxwell-relacoes` aparece nas relacoes formais e na construcao de Maxwell;
- `gas-ideal` aparece em fundamentos, estatistica, limite de gas real e ciclos;
- `entropia` aparece em fundamentos, estatistica e producao de entropia em ciclos.

Revisao humana em 2026-07-19:

- temas amplos como `entropia`, `calor`, `trabalho` e `gas-ideal` ficam como
  `advanced-support`;
- exercicios basicos devem usar o assunto central da pagina e subtemas
  especificos;
- temas amplos so entram quando a geracao for explicitamente avancada ou quando
  o prompt pedir apoio transversal;
- exemplo: item `1.18 Entropia e Desigualdade de Clausius` nao deve gerar
  pergunta de entropia microscopica; esse vinculo pode aparecer apenas como
  aprofundamento;
- exemplo: item `4.1 Gas Real e Limites do Modelo Ideal` pode usar gas ideal
  como comparacao/apoio, mas nao deve virar exercicio de gas ideal.

### Ponto Zero Da AI-02 - Taxonomia Tematica

Status: implementado localmente.

Criado um primeiro arquivo versionavel:

- `data/book-topic-taxonomy.json`.

Esse arquivo contem:

- 61 secoes do app indexadas;
- 44 temas transversais;
- uma entrada por secao, com `primaryTopic` e `topicTags`;
- grupos transversais apontando para varias secoes do app.

Temas transversais iniciais:

- `temperatura-termometria`;
- `estado-termodinamico`;
- `equilibrio`;
- `calor` como apoio avancado;
- `calor-fundamentos`;
- `calor-entalpia`;
- `calor-em-ciclos`;
- `trabalho` como apoio avancado;
- `trabalho-fundamentos`;
- `trabalho-em-ciclos`;
- `primeira-lei`;
- `entropia` como apoio avancado;
- `entropia-termodinamica`;
- `entropia-estatistica`;
- `energia-interna`;
- `capacidade-calorifica`;
- `gas-ideal` como apoio avancado;
- `gas-ideal-fundamentos`;
- `gas-ideal-estatistico`;
- `gas-ideal-ciclos`;
- `variaveis-conjugadas`;
- `potenciais-termodinamicos`;
- `helmholtz`;
- `gibbs`;
- `entalpia`;
- `maxwell-relacoes`;
- `construcao-maxwell`;
- `estatistica-ensembles`;
- `boltzmann`;
- `funcao-particao`;
- `indistinguibilidade`;
- `paramagnetismo`;
- `terceira-lei`;
- `transicoes-de-fase`;
- `van-der-waals`;
- `ponto-critico`;
- `estabilidade-mecanica`;
- `coexistencia-fases`;
- `ciclos-termodinamicos`;
- `carnot`;
- `stirling`;
- `maquinas-termicas`;
- `refrigeradores`;
- `eficiencia-cop`.

### Por Que Nao Substitui A AI-01

A AI-01 define a referencia principal de cada pagina do app no PDF.

A AI-02 adiciona o eixo conceitual. Ela permite que a IA escolha contexto
complementar sem perder a ancora principal da pagina.

Uso esperado:

- facil: referencia principal da pagina pelo mapa AI-01;
- medio: referencia principal + topicos proximos do mesmo capitulo;
- dificil: referencia principal + fragmentos transversais em capitulos diferentes.

### Como A IA Deve Usar

Para exercicio de secao:

1. buscar a pagina do app na AI-01;
2. buscar a entrada da secao na taxonomia AI-02;
3. carregar ate poucos fragmentos relacionados pelos `topicTags`;
4. montar prompt com prioridade: PDF canonico, HTML pedagogico, topicos
   transversais de apoio.

Para simulado de capitulo:

1. usar as secoes do capitulo como grade principal;
2. incluir topicos transversais somente quando ajudam a variar dificuldade;
3. preservar referencias por questao para auditoria.

### Arquivos Implementados Localmente

- `data/book-topic-taxonomy.json`;
- `lib/book-topic-taxonomy.mjs`;
- `scripts/validate-book-topic-taxonomy.mjs`;
- script `validate:book-topics` em `package.json`.

### Validacao Atual

Executado localmente:

```text
node scripts/validate-book-topic-taxonomy.mjs
```

Resultado:

```text
Book topic taxonomy valid.
- 61 app sections indexed.
- 44 transversal topics indexed.
```

### Indice Multi-Fragmento Da AI-02

Status: implementado localmente em primeira versao.

Criados:

- `data/book-topic-index.json`;
- `scripts/build-book-topic-index.mjs`;
- `scripts/validate-book-topic-index.mjs`;
- `lib/book-topic-index.mjs`;
- scripts `build:book-topic-index` e `validate:book-topic-index` em
  `package.json`.

Esse indice transforma a taxonomia em pacotes de contexto prontos para a IA,
combinando:

- secao principal do app;
- referencias canonicas do PDF;
- secoes relacionadas por tema transversal;
- motivo de inclusao de cada fragmento.

O indice nao duplica o corpus completo do livro. Ele guarda trechos curtos,
metadados, paginas e referencias; o texto completo continua em
`data/book-section-corpus.json`.

Regra de prioridade:

- se o `primaryTopic` da secao tambem for um tema transversal, ele vem antes dos
  temas mais amplos;
- exemplo: `2.3 Energia Livre de Helmholtz` busca primeiro outros fragmentos de
  `helmholtz` e so depois fragmentos amplos de `potenciais-termodinamicos`.
- `transversalTopics` sao contexto padrao;
- `advancedSupportTopics` sao contexto de apoio avancado e nao devem ser usados
  em exercicios simples.

Validacao executada:

```text
node scripts/validate-book-topic-index.mjs
```

Resultado:

```text
Book topic index valid.
- 61 app sections indexed.
- 44 transversal topics indexed.
```

Amostra validada:

- `2.3` usa referencia canonica nas paginas PDF `26-28`;
- relacionados prioritarios: `3.4`, `3.7` e `4.6`, todos pelo topico
  `helmholtz`;
- depois entram relacionados amplos de `potenciais-termodinamicos`.

Ajuste por revisao humana:

- removido `3.1 Entropia, Gibbs e a Visao por Ensembles` do tema transversal
  `gibbs`;
- removido `3.5 Particulas Distinguiveis, Indistinguiveis e Paradoxo de Gibbs`
  do tema transversal `gibbs`;
- motivo: nesses itens, Gibbs e referencia historica/estatistica ou paradoxo de
  indistinguibilidade, nao energia livre de Gibbs.
- separado `maxwell-relacoes` de `construcao-maxwell`, porque relacoes formais
  de Maxwell e construcao de Maxwell sao assuntos diferentes;
- separado `entropia-termodinamica` de `entropia-estatistica`;
- separado `calor-fundamentos`, `calor-entalpia` e `calor-em-ciclos`;
- separado `trabalho-fundamentos` e `trabalho-em-ciclos`;
- separado `gas-ideal-fundamentos`, `gas-ideal-estatistico` e
  `gas-ideal-ciclos`;
- mantidos `entropia`, `calor`, `trabalho` e `gas-ideal` como apoio avancado.

### Fechamento Local Da AI-02

Status: concluida localmente.

A AI-02 ficou pronta como indice tematico de referencia, ainda sem conectar ao
gerador real. O indice cobre todas as 61 secoes do app e organiza 44 topicos
transversais. Cada secao pode ter:

1. referencia canonica direta do PDF;
2. topicos transversais centrais, seguros para exercicios faceis e medios;
3. topicos de apoio avancado, usados apenas quando a questao pedir conexoes mais
   amplas.

Tambem foi criado um HTML tecnico versionado para revisao futura:

```text
docs/exercicios-ia-indice-referencias.html
```

Esse indice aparece no menu Extras apenas para o admin
`marioreis@id.uff.br`. Como e um arquivo estatico, a URL direta nao deve ser
tratada como segredo forte; ela serve como referencia tecnica interna, nao como
area protegida.

Validacoes executadas no fechamento:

```text
npm run check
node scripts/validate-book-corpus.mjs
node scripts/validate-book-topic-taxonomy.mjs
node scripts/validate-book-topic-index.mjs
node --check scripts/build-ai-exercise-index-page.mjs
```

Proximo passo: a AI-03 pode usar esse indice para montar o `contextPackage` dos
exercicios de secao.

## Change AI-03 - Exercicios De Secao Com Pacote De Contexto

Status: implementado localmente em primeira versao.

### O Que Muda

O endpoint de exercicios IA deve montar um pacote de contexto por secao, usando
mais de uma fonte de forma hierarquica.

A hierarquia correta e:

1. `book_pdf`: fonte canonica para definicoes, equacoes, sinais e convencoes;
2. `app_html`: fonte pedagogica, mais introdutoria e alinhada ao texto que o
   aluno acabou de estudar;
3. `client_page_context`: fallback enviado pela pagina, usado como apoio quando
   o PDF extraido estiver ruidoso ou quando o app tiver um resumo didatico mais
   claro.

Regra central: a IA nao deve tratar as tres fontes como equivalentes. O PDF
manda nas definicoes e equacoes; o HTML ajuda a escolher nivel e linguagem; a
referencia fallback ajuda a completar contexto, mas nao substitui o livro.

Fluxo esperado:

1. frontend envia `chapterId`, `itemId`, `pagePath`, `pageTitle` e contexto da
   pagina;
2. backend chama `getBookSectionContext`;
3. backend extrai o conteudo limpo da pagina HTML correspondente;
4. backend carrega o contexto fallback enviado pela pagina quando ele existir;
5. backend monta um `contextPackage` ordenado por prioridade;
6. resposta inclui metadados de origem.

Formato esperado do pacote:

```json
{
  "contextPackage": {
    "primarySource": {
      "type": "book_pdf",
      "chapterId": "04",
      "itemId": "4.1",
      "pageStart": 63,
      "pageEnd": 63,
      "content": "Trecho canonico do PDF..."
    },
    "teachingSource": {
      "type": "app_html",
      "path": "slides/capitulo-04/page_1.html",
      "content": "Texto introdutorio da pagina..."
    },
    "fallbackSource": {
      "type": "client_page_context",
      "content": "Contexto enviado pela pagina usado como apoio..."
    }
  }
}
```

### Prompt Esperado

O prompt deve deixar claro:

- use a referencia do livro como fonte principal;
- use o texto HTML para calibrar tom, dificuldade e foco pedagogico;
- use o contexto fallback apenas como apoio rastreavel;
- nao invente definicoes;
- preserve convencoes e sinais do livro;
- use apenas equacoes presentes ou diretamente derivadas do trecho;
- se a referencia for insuficiente, gere exercicio conceitual simples e seguro.

### Resposta Esperada

Adicionar metadados ao exercicio:

```json
{
  "sourceReference": {
    "type": "book-section-corpus",
    "chapterId": "02",
    "itemId": "2.3",
    "pageStart": 26,
    "pageEnd": 28
  }
}
```

Quando mais de uma fonte for usada, registrar todas:

```json
{
  "sourceReferences": [
    { "type": "book_pdf", "chapterId": "04", "itemId": "4.1", "pageStart": 63, "pageEnd": 63 },
    { "type": "app_html", "path": "slides/capitulo-04/page_1.html" },
    { "type": "client_page_context", "available": true }
  ]
}
```

### Arquivos Provaveis

- `lib/exercicio-handler.mjs`;
- `lib/book-section-corpus.mjs`;
- `lib/book-topic-index.mjs`;
- `lib/ai-context-package.mjs`;
- `api/exercicio.js`;
- `scripts/smoke-ai-context-package.mjs`.

### Implementacao Local

Foi criado `lib/ai-context-package.mjs`, responsavel por montar o pacote de
contexto por secao. O pacote inclui:

- `primarySource`: trecho canonico do PDF vindo da AI-01;
- `teachingSource`: texto limpo do HTML local da pagina, ou contexto enviado pelo
  frontend quando o arquivo local nao existe;
- `fallbackSource`: contexto enviado pelo frontend quando ele complementa o HTML
  local;
- `topicIndex`: topico principal, topicos transversais e apoios avancados da
  AI-02;
- `relatedFragments`: fragmentos transversais centrais;
- `advancedSupportFragments`: apenas para dificuldade `dificil`;
- `sourceReferences`: metadados de origem devolvidos na resposta da API.

O `lib/exercicio-handler.mjs` agora monta o `contextPackage` antes de chamar a
Gemini, injeta esse pacote no prompt e devolve:

```json
{
  "sourceReferences": [],
  "contextPackageMeta": {}
}
```

Foi adicionado o smoke test:

```text
npm run smoke:ai-context
```

Amostras verificadas:

- `2.3`: PDF p.26-28, topico `helmholtz`, sem fragmento avancado;
- `2.4`: PDF p.28-30, topico `entalpia`, apoio avancado de `calor` apenas em
  dificuldade dificil;
- `3.1`: PDF p.37-38, topicos `estatistica-ensembles`,
  `entropia-estatistica` e `equilibrio`, sem misturar energia livre de Gibbs;
- `4.1`: PDF p.63 e HTML da pagina; quando a extracao PDF e ruidosa, o prompt
  avisa a IA para usar o PDF como ancora e o HTML para linguagem/foco
  pedagogico.

### Validacao

- Exercicio da secao `2.3` menciona corretamente `F = U - TS`.
- Exercicio da secao `2.3` nao usa conceito de Gibbs por engano.
- Exercicio da secao `2.4` usa Entalpia, nao Helmholtz.
- Quando o corpus falta, o backend usa fallback explicito e rastreavel.
- Item `4.1` usa o PDF como base canonica e o HTML para manter carater
  introdutorio.
- Se a extracao do PDF vier marcada como `pdfplumber-fallback`, o prompt inclui
  HTML e referencia anterior com peso pedagogico maior, mas sem sobrescrever as
  definicoes canonicas do livro.

## Change AI-04 - Contrato Forte De Matematica E LaTeX

Status: implementado localmente em primeira versao.

### Problema

Hoje existe normalizacao matematica no backend e tambem no frontend. Isso aumenta
o risco de:

- duplicar barras;
- quebrar delimitadores;
- transformar texto em LaTeX indevido;
- exibir codigo LaTeX cru para o aluno.

### O Que Muda

Definir contrato unico:

- inline math sempre em `\( ... \)`;
- display math sempre em `\[ ... \]`;
- proibido `$...$`;
- proibido `$$...$$`;
- proibido LaTeX solto fora dos delimitadores;
- backend valida antes de responder;
- frontend renderiza com MathJax, sem tentar reescrever profundamente a equacao.

### Opção Mais Segura Para Versao Futura

Separar texto e matematica em blocos estruturados:

```json
{
  "blocks": [
    { "type": "paragraph", "text": "A energia livre de Helmholtz e definida por:" },
    { "type": "math", "display": true, "latex": "F = U - TS" }
  ]
}
```

Essa opcao e mais robusta, mas exige mais mudanca no frontend. Para a primeira
correcao, pode-se manter texto com delimitadores e adicionar validadores.

### Arquivos Provaveis

- `lib/exercicio-handler.mjs`;
- `lib/math-format-validator.mjs`;
- `scripts/smoke-math-contract.mjs`.

### Implementacao Local

Foi criado `lib/math-format-validator.mjs`, um validador deterministico para
checar o contrato de matematica antes de devolver o exercicio ao frontend.

O validador:

- mascara trechos ja delimitados por `\( ... \)` e `\[ ... \]`;
- rejeita `$...$` e `$$...$$`;
- rejeita comandos LaTeX soltos fora de delimitadores, como `\frac` e
  `\partial`;
- rejeita equacoes/atribuicoes ASCII fora de delimitadores, como
  `F = U - TS`;
- rejeita delimitadores desbalanceados;
- aponta avisos para tokens matematicos suspeitos fora de delimitadores.

O `lib/exercicio-handler.mjs` agora:

1. gera o exercicio;
2. aplica a normalizacao local existente;
3. valida o contrato matematico;
4. se houver erro, aciona a revisao matematica remota ja existente;
5. normaliza e valida novamente;
6. devolve metadados:

```json
{
  "mathContractOk": true,
  "mathContract": {
    "ok": true,
    "errorCount": 0,
    "warningCount": 0
  },
  "mathRefinementApplied": false
}
```

Foi adicionado o smoke test:

```text
npm run smoke:math-contract
```

Casos cobertos pelo smoke:

- inline/display math validos passam;
- `$...$` falha;
- comando LaTeX cru falha;
- atribuicao ASCII solta falha;
- delimitador desbalanceado falha.

### Validacao

- Nenhuma resposta contem `$`.
- Nenhuma resposta contem `\frac`, `\partial`, `\Delta`, `\mu`, `\Omega` fora de
  `\( ... \)` ou `\[ ... \]`.
- Delimitadores `\(`, `\)`, `\[`, `\]` estao balanceados.
- MathJax renderiza sem mostrar codigo cru.

## Change AI-05 - Verificacao E Reporte De Erro Da IA Pelo Aluno

Status: implementado localmente em primeira versao.

### O Que Muda

Revisar a etapa em que o aluno sinaliza que um exercicio ou simulado gerado por
IA esta errado. Essa change nao corrige a geracao em si; ela melhora o canal de
feedback para o professor identificar, revisar e corrigir problemas reais.

### Fluxo Esperado

1. aluno ve um exercicio/simulado gerado por IA;
2. aluno clica em `Reportar erro`, `Sinalizar problema` ou texto equivalente;
3. interface pede uma classificacao simples do problema;
4. sistema grava o relato na fila de revisao do professor;
5. registro inclui dados suficientes para reproduzir o erro.

### Tipos De Erro Sugeridos

- erro conceitual;
- equacao ou LaTeX quebrado;
- alternativa correta errada;
- explicacao confusa;
- pergunta fora do conteudo estudado;
- outro problema.

### Dados Minimos Do Reporte

- capitulo e secao;
- titulo da pagina;
- tipo de atividade: exercicio de secao, desafio do dia ou simulado;
- enunciado gerado;
- alternativas;
- alternativa marcada como correta pela IA;
- explicacao gerada;
- referencias usadas pelo gerador, quando existirem;
- comentario opcional do aluno;
- email do aluno, se estiver logado;
- data/hora.

### Cuidado Com Supabase Gratuito

Primeira versao deve evitar volume excessivo:

- nao salvar screenshots automaticamente;
- nao armazenar historico pesado sem necessidade;
- limitar campos longos;
- enviar/salvar apenas quando o aluno clicar explicitamente;
- reutilizar a tabela atual `exercise_validation_reports`, sem criar tabela nova;
- manter apenas textos curtos e metadados essenciais.

### Protocolo De Memoria

- `pending`: relato novo, ainda nao influencia a IA;
- `approved`: professor confirmou; entra como memoria nas proximas geracoes;
- `disabled`: historico preservado, mas removido do contexto da IA;
- `rejected`: relato revisado e descartado para memoria.

Somente registros com `review_status = approved`, `ai_review_state =
confirmed_error` e `avoid_propagation = true` entram no contexto dos proximos
exercicios. Para "apagar um erro da memoria", o professor muda o relato para
`disabled`, sem deletar o historico.

### Arquivos Provaveis

- `assets/ai-exercises.js`;
- `assets/ai-exercises.css`;
- `lib/exercicio-handler.mjs`;
- `index.html`;
- `supabase/migrations/20260719_allow_disabled_validation_reports.sql`;
- documentacao em `CODEX_CONTEXT.md`.

### Validacao

- aluno consegue reportar erro sem sair da tela;
- professor recebe informacao suficiente para reproduzir;
- reporte nao exige conhecimento tecnico do aluno;
- nao envia dados sensiveis desnecessarios;
- professor consegue aprovar, rejeitar ou desativar uma memoria;
- memórias desativadas nao entram no contexto de geracao.

## Change AI-06 - Simulados Por Capitulo Usando O Corpus Do Livro

Status: implementado localmente em primeira versao.

### O Que Muda

O simulado IA por capitulo deve usar o corpus do livro do capitulo inteiro, e nao
apenas o resumo de `data/capitulo-XX.json`.

### Fluxo Esperado

1. aluno solicita simulado do capitulo;
2. backend carrega os topicos do capitulo;
3. backend monta um contexto canonico com trechos do livro por secao;
4. IA gera perguntas usando definicoes e equacoes do livro;
5. backend valida o contrato matematico das perguntas, alternativas, explicacoes
   e retomadas;
6. se o contrato matematico falhar, uma chamada curta tenta reparar apenas a
   formatacao;
7. resultado guarda referencias das secoes usadas no token do simulado.

### Cuidado Com Tamanho Do Prompt

Para nao estourar contexto nem custo:

- limitar caracteres por secao;
- enviar todos os topicos ativos do capitulo, com excertos limitados por item;
- usar resumo/excerpt do corpus quando o conteudo completo for longo;
- nao enviar o livro inteiro em uma unica chamada;
- usar `smoke:ai-quiz-context` para conferir tamanho e cobertura.

### Arquivos Provaveis

- `lib/gamification-ai-quiz.mjs`;
- `lib/book-section-corpus.mjs`;
- `lib/book-topic-index.mjs`;
- `lib/math-format-validator.mjs`;
- `index.html`;
- `scripts/smoke-ai-chapter-quiz-context.mjs`;
- `data/book-section-corpus.json`;
- `data/book-topic-index.json`.

### Validacao

- Simulado do Cap. 02 usa temas de Helmholtz, Entalpia, Gibbs, Grand Potential e
  Maxwell conforme o corpus.
- Perguntas nao misturam criterio de espontaneidade de Gibbs com trabalho
  isotermico de Helmholtz.
- Cada quiz guarda `sourceReferences` e `contextPackageMeta`.
- `npm run smoke:ai-quiz-context` passa para capitulos ativos.
- MathJax renderiza o simulado e a correcao no frontend.

## Change AI-07 - Validacao Conceitual Antes De Exibir

Status: planejado.

### O Que Muda

Adicionar uma etapa leve de validacao antes de exibir exercicios/simulados.

Validacoes minimas:

- JSON valido;
- enunciado existe;
- alternativas existem quando for multipla escolha;
- alternativa correta existe;
- explicacao existe;
- LaTeX passa no validador;
- referencia canonica existe para a secao/capitulo quando esperado.

Validacoes conceituais iniciais:

- termos principais do exercicio aparecem no trecho canonico ou no titulo da
  secao;
- item `2.3` nao deve gerar pergunta centrada em Gibbs;
- item `2.4` nao deve gerar pergunta centrada em Helmholtz como conceito central;
- resposta nao deve atribuir definicao de um potencial a outro.

### Cuidado Com Custo

Nao fazer segunda chamada de IA sempre.

Primeira versao:

- validadores deterministicos;
- segunda chamada de IA somente se o exercicio for marcado como suspeito.

### Arquivos Provaveis

- `lib/exercicio-handler.mjs`;
- `lib/gamification-ai-quiz.mjs`;
- novo `lib/ai-exercise-quality.mjs`;
- testes em `tests/`.

### Validacao

- exercicio invalido nao e exibido como se fosse correto;
- usuario recebe erro amigavel se a geracao falhar;
- logs preservam motivo tecnico para depuracao.

## Change AI-08 - Memoria De Revisao Do Professor

Status: planejado.

### O Que Muda

Aproveitar os feedbacks de validacao de exercicios para melhorar futuras
geracoes.

Exemplo:

- professor marca exercicio como conceitualmente incorreto;
- registro fica salvo com capitulo/secao;
- proximas geracoes daquele item recebem observacao do que evitar.

### Cuidado Com Supabase Gratuito

Manter baixo volume:

- carregar memoria apenas da secao atual;
- cache curto em memoria no backend;
- nao consultar toda tabela de validacoes em toda geracao.

### Arquivos Provaveis

- `lib/exercicio-handler.mjs`;
- tabela atual `exercise_validation_reports`;
- possivel nova view/RPC no Supabase somente se necessario.

### Validacao

- feedback aprovado/rejeitado influencia apenas item relacionado;
- nao vaza dados de usuario;
- nao aumenta leituras globais no Supabase.

## Change AI-09 - Integracao E Rollout Seguro

Status: planejado.

### Ordem Recomendada

1. usar `AI-01` concluida como mapa principal app -> PDF;
2. construir `AI-02` para indice tematico multi-fragmento;
3. conectar `AI-03` primeiro para exercicios do Cap. 02;
4. testar secoes `2.3`, `2.4`, `2.5` e `2.8`;
5. aplicar `AI-04` no pipeline de exercicios de secao;
6. revisar o fluxo de reporte da `AI-05`;
7. conectar `AI-06` ao simulado do Cap. 02;
8. expandir a ativacao para Caps. 01, 03, 04 e 06 por feature flag.

### Feature Flag Recomendada

Usar variavel de ambiente:

```text
TERMO_AI_USE_BOOK_CORPUS=true
```

Comportamento:

- `false`: usa fluxo atual;
- `true`: usa corpus quando disponivel e fallback quando ausente.

### Validacao Pre-Deploy

- `node --check scripts/extract-book-sections.mjs`;
- `node --check scripts/build-book-reference-pdfs.mjs`;
- `python3 -m json.tool data/book-section-corpus.json`;
- teste local de exercicio `2.3`;
- teste local de exercicio `2.4`;
- teste local de simulado Cap. 02;
- revisao visual de uma equacao no navegador;
- confirmar que nao ha chamada ao Supabase para baixar PDF em runtime.

## Riscos

### Risco 1 - Correlacao Errada

Mitigacao:

- usar overrides auditaveis por capitulo/secao;
- registrar `mappingReason`;
- revisar por amostragem antes de ativar em producao.

### Risco 2 - Texto Extraido Do PDF Com Ruido

Mitigacao:

- preferir `pdftotext -layout` quando possivel;
- limpar caracteres problemáticos;
- usar trecho extraido como referencia conceitual, nao como texto final exibido.

### Risco 3 - LaTeX Quebrado

Mitigacao:

- contrato unico de delimitadores;
- validador antes de exibir;
- reduzir reescrita matematica no frontend.

### Risco 4 - Supabase Gratuito

Mitigacao:

- nao baixar PDF em runtime;
- nao ler corpus inteiro do Supabase por geracao;
- empacotar corpus no backend ou usar cache forte;
- carregar apenas trecho necessario.

### Risco 5 - Copyright/Exposicao Do Livro

Mitigacao:

- nao servir corpus completo publicamente no frontend;
- manter corpus como artefato de backend quando possivel;
- PDFs derivados ficam para revisao local, nao necessariamente deployados.

## Definicao De Pronto Da Fase

A fase so deve ser considerada pronta quando:

- exercicio da secao `2.3` usa corretamente Helmholtz;
- exercicio da secao `2.4` usa corretamente Entalpia;
- simulado do Cap. 02 usa referencias do livro;
- LaTeX renderiza sem codigo cru em pelo menos 10 geracoes de teste;
- nao ha download do PDF do Supabase em runtime;
- fallback antigo continua funcionando se o corpus estiver ausente;
- documentacao tecnica explica como regenerar corpus e PDFs derivados.
