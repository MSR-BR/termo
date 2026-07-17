# Change Plan: TERMO Gamificacao Fase 1G

## Objetivo

Melhorar a clareza visual da jornada antes de adicionar novas funcionalidades.

## Problema Observado

Os cards de resumo mostravam numeros reais do usuario logado, mas a tela nao
explicava de onde eles vinham nem como eram calculados. Isso fazia valores como
`108 pontos`, `nivel 2`, `sequencia 1` e `2 capitulos dominados` parecerem
exemplos ou dados soltos.

## O Que Entrou

- explicacao clicavel em cada card de metrica, melhor para celular;
- explicacao da origem dos pontos;
- quantificacao correta dos pontos por acao;
- explicacao da regra de nivel a cada 100 pontos;
- explicacao da sequencia de dias com atividade registrada;
- troca do card `Itens estudados` para `Dominio`;
- texto deixando claro que capitulo dominado vem de `80%+` no simulado
  completo;
- texto deixando claro que abrir pagina nao conta como dominio;
- texto deixando claro que item estudado exige acao explicita de concluir ou
  marcar uma secao;
- aviso de que, nesta fase, um usuario pode ter capitulos dominados mesmo com
  itens estudados zerados se fez simulados diretamente.

## Controle De Produto

Os numeros exibidos nao sao mock nem exemplo quando o usuario esta logado. Eles
vêm das atividades registradas na jornada do TERMO.

## Proximo Passo

Continuar QA visual do fluxo completo:

1. aluno novo;
2. simulado com erro;
3. retomada rapida;
4. dominio com `80%+`;
5. excelencia com `100%`;
6. revisao mobile.
