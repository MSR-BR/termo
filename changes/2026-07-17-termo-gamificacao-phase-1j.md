# Change Plan: TERMO Gamificacao Fase 1J

## Objetivo

Mostrar um checklist pratico do capitulo dentro do `Estudo guiado`, para que o
aluno veja quais itens ja foram marcados como estudados e quais ainda estao
pendentes.

## Problema Observado

A Fase 1I passou a mostrar os ultimos itens estudados, mas ainda faltava uma
visao completa por capitulo. O aluno conseguia ver que havia `1/11 itens
estudados`, mas nao conseguia identificar rapidamente onde estavam os demais
itens do capitulo.

## O Que Entrou

- bloco `Checklist do capitulo` na lateral do `Estudo guiado`;
- escolha automatica do capitulo em foco:
  - primeiro o capitulo do ultimo item estudado;
  - depois o capitulo indicado pelo proximo passo;
  - depois o primeiro capitulo com estudo iniciado;
  - por fim, o primeiro capitulo ativo;
- lista item a item com status `Estudado` ou `Pendente`;
- link direto para abrir cada item;
- resumo compacto no formato `x/y itens estudados`.

## Regra De Produto

O checklist nao marca leitura automaticamente. Um item so aparece como
`Estudado` quando o aluno executa uma acao explicita, como clicar em
`Marcar estudado (+20)` na pagina do item.

## Cuidado Com Conta Gratuita

A fase nao adiciona tabela, migration, endpoint ou consulta nova. A tela usa:

- `chapterProgress`, ja carregado no perfil da jornada;
- `recentStudiedItems`, ja carregado na Fase 1I;
- `embeddedChapterData`, catalogo local ja existente no frontend.

## Integracao

- frontend: `index.html`;
- sem alteracao de backend;
- sem nova migration Supabase.

## Validacao

- abrir `index.html?view=journey`;
- confirmar que o bloco `Checklist do capitulo` aparece na lateral;
- confirmar que o item ja marcado aparece como `Estudado`;
- confirmar que os demais aparecem como `Pendente`;
- abrir um item pelo checklist e marcar como estudado;
- voltar ao `Estudo guiado` e confirmar aumento no resumo `x/y`.

## Proximo Passo

QA visual da jornada em desktop e celular. Depois disso, fechar a Fase 1 com
uma revisao de consistencia antes de decidir commit/deploy.
