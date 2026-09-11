# TERMO — Change Program: Paridade Operacional e Governança

## Referência obrigatória

Usar o Pó Mágico atual:

```text
git@github.com:MSR-BR/po-magico.git
```

Arquivo de entrada obrigatório:

```text
po_magico_v20260910.003.md
```

Classificação do projeto:

```text
INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP
```

O TERMO é um livro interativo de Termodinâmica em português. Todo texto novo visível no app deve permanecer em português brasileiro.

---

## Regra de execução

Antes de qualquer implementação:

1. Ler integralmente:
   - `CODEX_CONTEXT.md`
   - `.specs/README.md`
   - `changes/README.md`
   - `README.md`
   - `index.html`
   - `home.html`
   - `conteudo.html`
   - `data/capitulo-*.json`
   - scripts, APIs, assets e migrations relevantes para cada Change.
2. Executar `git status --short --branch`.
3. Não apagar, reescrever ou simplificar fluxos existentes sem uma justificativa explícita.
4. Preservar:
   - autenticação Google;
   - Supabase;
   - exercícios IA;
   - simuladores;
   - PDF protegido;
   - SEO atual;
   - mapa público `conteudo.html`;
   - bridge GitHub Pages;
   - gamificação atual;
   - histórico de Changes.
5. Não fazer commit, push ou deploy sem solicitação explícita posterior.
6. Não expor credenciais, conteúdo privado, PDF do livro ou dados pessoais.

---

# T25 — Pó Mágico governance baseline

## Objetivo

Atualizar a governança do TERMO para ficar compatível com o Pó Mágico atual, preservando o histórico operacional já existente.

## Escopo

- Registrar no projeto a referência para `po_magico_v20260910.003.md`.
- Atualizar `CODEX_CONTEXT.md` com:
  - classificação do projeto;
  - fontes canônicas;
  - regras de Changes;
  - gates de validação;
  - regras de segurança;
  - dependências de Supabase, Vercel, Gemini, GA4 e Resend.
- Padronizar novas iniciativas em `.specs/changes/`.
- Preservar os 24 documentos existentes em `changes/`; não migrá-los destrutivamente.
- Criar um modelo reutilizável de Change com:
  - objetivo;
  - requisitos;
  - tarefas;
  - critérios de aceite;
  - riscos;
  - evidência de validação;
  - status de deploy;
  - decisões humanas pendentes.
- Registrar por Change:
  - modelo/agent utilizado;
  - reasoning adotado;
  - fallback;
  - testes e gates executados;
  - falhas e decisão de correção.
- Não alegar troca de modelo, reasoning ou fallback sem evidência real.

## Critérios de aceite

- A referência ao Pó Mágico atual está versionada no TERMO.
- A estrutura futura de Changes está clara e reproduzível.
- O histórico anterior permanece íntegro.
- Nenhuma funcionalidade do app é alterada nesta Change.

---

# T26 — Busca pública de conteúdo revisado

## Objetivo

Adicionar ao TERMO uma busca pública estática por conteúdo revisado, usando como referência funcional a busca do QUANTUM, mas preservando a identidade visual, idioma e arquitetura do TERMO.

## Referência funcional

Consultar, somente como referência:

```text
../qm/search.html
../qm/assets/qm-search.css
../qm/data/qm-published-search-index.json
../qm/scripts/build-qm-published-search-index.mjs
```

Não copiar identidade visual, textos em inglês, URLs, dados, nomes de arquivo ou conteúdo do QUANTUM.

## Requisitos

- Criar `search.html`.
- Interface integralmente em português.
- Pesquisar por:
  - número da seção;
  - título;
  - capítulo;
  - resumo;
  - palavras-chave existentes e confiáveis.
- Atualizar a URL com `?q=` sem recarregar a página.
- Exibir:
  - estado inicial;
  - resultado encontrado;
  - estado vazio;
  - links diretos para a página da seção.
- Criar índice estático gerado, por exemplo:

```text
data/termo-published-search-index.json
```

- Criar script gerador, por exemplo:

```text
scripts/build-termo-published-search-index.mjs
```

- Usar somente fontes canônicas existentes:
  - `data/capitulo-*.json`;
  - corpus/indexação de tópicos;
  - URLs reais das páginas HTML.
- Incluir somente conteúdo publicado e revisado.
- Excluir integralmente o capítulo 5 bloqueado.
- Não usar Supabase, Gemini, cookies de identificação ou dados pessoais.
- Adicionar link público discreto para a busca em local apropriado.
- Integrar metadata, canonical, Open Graph, Twitter e `SearchAction` JSON-LD.
- Manter `home.html` como landing principal.
- Atualizar sitemap apenas se a página de busca pública passar na validação de canonical e SEO.

## Critérios de aceite

- Toda URL do índice existe fisicamente.
- Nenhuma seção bloqueada aparece no índice.
- Busca funciona por título, seção e tema.
- URL com `?q=` reabre a mesma busca.
- Funciona por teclado e em viewport mobile.
- Não altera login, exercícios IA, PDF protegido, simuladores ou rotas pessoais.

---

# T27 — Registry editorial explícito

## Objetivo

Criar uma fonte canônica explícita para determinar se capítulos e seções estão publicados, planejados, bloqueados e elegíveis para busca, SEO e exercícios IA.

## Requisitos

- Criar registry editorial, preferencialmente em `data/`.
- Para cada capítulo/seção, registrar ao menos:
  - estado editorial;
  - disponibilidade pública;
  - elegibilidade para busca;
  - elegibilidade para SEO;
  - elegibilidade para exercício IA;
  - motivo de bloqueio, quando aplicável.
- Não duplicar manualmente informação que já exista em fontes canônicas sem uma regra de sincronização.
- Adaptar progressivamente:
  - menu de capítulos;
  - busca;
  - sitemap;
  - catálogo de exercícios IA;
  - páginas de referência.
- O capítulo 5 deve continuar bloqueado de forma consistente.

## Critérios de aceite

- Não há divergência entre menu, busca, sitemap e elegibilidade de exercícios.
- Uma seção não publicada não pode ser descoberta por busca pública nem enviada como conteúdo elegível para IA.
- Há script de validação que detecta inconsistências.

---

# T28 — Manifesto de fontes dos exercícios IA

## Objetivo

Aumentar a rastreabilidade editorial dos exercícios IA, usando a ideia do manifesto por seção do QUANTUM, sem perder o corpus e a indexação temática já maduros do TERMO.

## Requisitos

- Criar manifesto por seção elegível para exercícios.
- Cada entrada deve conter:
  - capítulo;
  - seção;
  - título;
  - URL da página;
  - arquivo-fonte do livro;
  - página ou intervalo de páginas;
  - referência temática;
  - estado de revisão;
  - elegibilidade.
- Criar auditoria automática que falha quando:
  - uma seção elegível não possui página HTML;
  - a URL não existe;
  - não há referência ao livro;
  - não há fonte PDF;
  - a seção está marcada para revisão;
  - a seção bloqueada aparece como elegível.
- Preservar a atual memória de correções aprovadas de exercícios IA.
- Não inventar fontes, páginas, títulos ou excertos.

## Critérios de aceite

- 100% das seções elegíveis possuem proveniência verificável.
- O script de auditoria falha fechado diante de metadados incompletos.
- A geração IA continua recebendo apenas conteúdo revisado.

---

# T29 — Atividade individual de simuladores

## Objetivo

Adicionar persistência privada de atividade individual em simuladores, complementando — e não substituindo — a telemetria agregada existente.

## Requisitos

- Registrar por usuário autenticado:
  - simulador;
  - caminho;
  - primeira abertura;
  - última abertura;
  - número de aberturas.
- Não registrar atividade identificável para visitantes anônimos.
- Proteger dados com RLS.
- Não quebrar o comportamento atual de abrir simuladores em nova aba.
- Exibir a informação somente na área pessoal/jornada, em linguagem simples.
- Não premiar pontos automaticamente sem regra pedagógica explícita e proteção contra duplicação.

## Critérios de aceite

- Dados de um usuário não são visíveis para outro.
- Visitante não autenticado continua usando simuladores sem bloqueio.
- O histórico é atualizado apenas para o próprio usuário autenticado.
- Não há regressão em analytics agregados existentes.

---

# T30 — Auditoria final de paridade TERMO ↔ QUANTUM

## Objetivo

Após T25–T29, atualizar a auditoria comparativa entre os dois livros interativos.

## Requisitos

- Distinguir explicitamente:
  - funcionalidade operacional;
  - funcionalidade parcialmente configurada;
  - funcionalidade planejada;
  - diferença deliberada de produto.
- Comparar:
  - SEO;
  - busca;
  - analytics;
  - gamificação;
  - avaliações;
  - e-mails;
  - exercícios IA;
  - quizzes;
  - indexação;
  - simuladores;
  - Supabase/RLS;
  - testes;
  - governança de Changes;
  - governança de modelos.
- Não tratar como pendência o PDF protegido do TERMO nem exigir PDF no QUANTUM.
- Não tratar como regressão o fato de TERMO ser em português e QUANTUM em inglês.

## Critérios de aceite

- Relatório rastreável com evidências de arquivo, rota, teste ou migration.
- Backlog remanescente priorizado.
- Nenhuma conclusão baseada apenas no nome de arquivos; validar fluxos reais e código correspondente.

---

# Gates obrigatórios antes de qualquer CPD futuro

Para cada Change, executar apenas os gates aplicáveis:

```bash
npm run check
npm run test:analytics
npm run test:ratings
npm run test:gamification
npm run test:seo
npm run extract:book-sections
npm run build:book-topic-index
npm run validate:book-corpus
npm run validate:book-topic-index
npm run smoke:ai-context
npm run smoke:ai-quiz-context
npm run smoke:math-contract
git diff --check
```

Além dos testes automatizados:

1. validar URLs e assets;
2. testar desktop e mobile;
3. testar teclado e foco;
4. testar visitante anônimo e usuário autenticado;
5. testar o responsável administrativo quando o fluxo for administrativo;
6. revisar visualmente telas modificadas;
7. confirmar RLS, autorização server-side e ausência de segredos no diff;
8. registrar modelo, reasoning, fallback e resultados dos gates na Change.

Nenhum CPD pode ocorrer enquanto houver falhas de gate, conteúdo bloqueado indexado, URL inválida, segredo no diff ou decisão editorial pendente.
