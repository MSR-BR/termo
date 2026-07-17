# Change Plan: TERMO Gamificacao Fase 1I

## Objetivo

Mostrar no `Estudo guiado` quais itens foram marcados como estudados, para que
o aluno entenda de onde vem o numero de itens estudados e consiga retomar o
conteudo certo.

## Problema Observado

A Fase 1H registrava o item estudado e atualizava o total, mas a tela mostrava
apenas o numero. O aluno ainda ficava sem saber qual item tinha sido marcado.

## O Que Entrou

- retorno `recentStudiedItems` no endpoint de perfil da gamificacao;
- resumo de itens estudados por capitulo dentro de `chapterProgress`;
- bloco `Ultimos itens estudados` na lateral do `Estudo guiado`;
- link `Abrir item` para retomar o item marcado;
- texto nos cards de capitulo no formato `x de y itens estudados`;
- mapeamento dos nomes dos itens no frontend, usando o catalogo local dos
  capitulos.

## Regra De Produto

`Itens estudados` mede acoes explicitas de estudo, como `Marcar estudado (+20)`.
Isso e diferente de `Dominio`, que depende de aproveitamento em simulado.

## Cuidado Com Conta Gratuita

A fase adiciona apenas uma leitura pequena no carregamento da jornada:
os ultimos itens estudados, com limite de 50 registros. Nao ha consulta por
pagina aberta e nao ha polling.

## Integracao

- backend: `lib/gamification-profile-handler.mjs`;
- mapper compartilhado: `lib/gamification-shared.mjs`;
- frontend: `index.html`;
- tabela reaproveitada: `gamification_item_progress`;
- sem nova tabela e sem nova migration.

## Validacao

- teste automatizado do perfil cobre `recentStudiedItems`;
- `npm run test:gamification`;
- `npm run check`;
- QA manual: marcar um item e confirmar que ele aparece em `Ultimos itens
  estudados`.

## Proximo Passo

QA visual da jornada com 1, 2 e 3 itens marcados; depois decidir se a proxima
fase deve ser progresso por capitulo em tela dedicada ou checklist por capitulo.
