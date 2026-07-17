# Change Plan: TERMO Gamificacao Fase 1H

## Objetivo

Adicionar um marcador explicito de estudo por item, sem contar automaticamente
apenas a abertura da pagina.

## Problema Observado

O aluno podia abrir uma pagina, mas isso nao significava que estudou aquele
item. Para a pontuacao ficar justa, o progresso de item precisa depender de uma
acao consciente.

## O Que Entrou

- botao `Marcar estudado (+20)` nas paginas de item identificavel;
- estado `Entrar para marcar (+20)` quando o aluno ainda nao esta logado;
- envio do evento `study_item_complete` somente no clique;
- pontuacao de `+20 pontos` uma vez por item;
- idempotencia por usuario/capitulo/item para evitar pontuacao repetida;
- memoria local apenas para evitar chamadas repetidas no mesmo navegador;
- estado visual `Estudado (+20)` depois de marcar com sucesso;
- estado `Ja marcado (+20)` quando o backend informa que aquele item ja foi
  estudado, deixando claro que a pontuacao nao duplica;
- modo compacto no celular.

## Regra De Produto

Abrir a pagina nao conta como item estudado. O aluno precisa clicar em
`Marcar estudado`.

## Cuidado Com Conta Gratuita

Esta fase evita leituras automaticas extras. A pagina nao consulta o banco para
descobrir se o item ja foi marcado. Ela so chama a API quando o aluno clica no
botao, e depois guarda uma lembranca local para nao repetir chamadas no mesmo
navegador.

## Integracao

- frontend: `assets/termo-auth.js` e `assets/termo-auth.css`;
- backend reaproveitado: `/api/gamification-event`;
- evento reaproveitado: `study_item_complete`;
- tabela reaproveitada: progresso consolidado de itens ja criada na Fase 1C.

## Validacao

- `node --check assets/termo-auth.js`;
- `npm run check`;
- `npm run test:gamification`;
- confirmar em navegador local que o botao aparece em uma pagina de item;
- confirmar que sem login o clique abre o modal;
- confirmar que logado o clique registra `+20 pontos`;
- confirmar que novo clique nao gera pontuacao duplicada.

## Proximo Passo

QA manual logado em uma pagina real de capitulo e, depois, refletir esses itens
marcados com mais clareza na tela `Estudo guiado`.
