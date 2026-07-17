# Change Plan: TERMO Gamificacao Fase 1K

## Objetivo

Fechar a Fase 1 com uma revisao de consistencia da experiencia integrada antes
de qualquer commit, deploy ou rollout.

## O Que Foi Conferido

- a jornada abre pela view `index.html?view=journey`;
- a entrada `Estudo guiado` aparece como area pessoal;
- o aluno logado ve pontos, nivel, sequencia, dominio e proximo passo;
- as explicacoes dos cards usam clique em `?`, melhor para celular do que hover;
- os simulados publicados aparecem apenas para capitulos com catalogo versionado;
- capitulos sem simulado continuam visiveis como estudo/leitura;
- item marcado como estudado aparece nos totais e no checklist;
- o checklist mostra `Estudado` e `Pendente` item a item;
- o botao de marcar item nao dispara ao abrir a pagina, apenas no clique;
- a navegacao anterior/proximo nas paginas HTML esta disponivel no cabecalho.

## Ajuste Da Fase

Quando o aluno abre o `Estudo guiado` vindo de um capitulo especifico, o
checklist agora prioriza esse capitulo na escolha do bloco em foco. Exemplo:

- `index.html?view=journey&chapter=04` mostra o checklist do Capitulo 04;
- sem capitulo na URL, a jornada continua escolhendo pelo ultimo item estudado,
  proximo passo, estudo iniciado ou primeiro capitulo ativo.

## Cuidado Com Conta Gratuita

Nao houve nova tabela, endpoint, migration ou leitura adicional no Supabase.
O ajuste usa apenas o parametro local `chapter` da URL e os dados ja carregados
na tela.

## Validacao Recomendada Antes De Commit

- `npm run check`;
- `npm run test:gamification`;
- validacao de sintaxe dos scripts inline do `index.html`;
- abrir `index.html?view=journey`;
- abrir `index.html?view=journey&chapter=04`;
- marcar um item em uma pagina de capitulo e confirmar o reflexo na jornada.

## Proximo Passo

Se o QA visual estiver bom, a Fase 1 pode ser considerada pronta para preparar
um commit offline. O deploy ainda deve esperar uma revisao final, porque esta
versao mexe em interface, backend, Supabase e muitas paginas HTML.
