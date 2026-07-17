# Change Plan: Navegacao Entre Paginas Dos Capitulos

## Objetivo

Reduzir atrito durante o estudo sequencial dos capitulos, evitando que o aluno
precise voltar ao menu para abrir a proxima pagina HTML.

## O Que Entrou

- botoes de seta com icones `chevron` ao redor do selo de capitulo/item;
- composicao visual: seta anterior, selo `Capitulo x · Item x.y`, seta
  proxima;
- link anterior para a pagina HTML anterior do mesmo capitulo;
- link proximo para a pagina HTML seguinte do mesmo capitulo;
- estado desativado quando a pagina e a primeira ou a ultima do capitulo;
- estilos responsivos para desktop e celular;
- aplicacao em 87 HTMLs reais de aula em `slides/capitulo-*`.

## Fora Do Escopo

- arquivos de origem/backups dentro de pastas `source`;
- landing, indice, simuladores e paginas que nao sao paginas sequenciais de
  capitulo;
- marcador de estudo ou pontuacao automatica por abrir pagina.

## Validacao

- validacao automatica confirmou um controle de navegacao em cada uma das 87
  paginas de aula;
- validacao automatica confirmou que todos os links apontam para arquivos
  existentes;
- `npm run check` passou;
- `npm run test:gamification` passou;
- rota local de exemplo respondeu `200 OK`.

## Proximo Passo

Continuar QA visual em navegador local depois que os controles de login,
favoritos e marcador de estudo forem montados no cabecalho.
