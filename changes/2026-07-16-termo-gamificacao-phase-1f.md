# Change Plan: TERMO Gamificacao Fase 1F

## Objetivo

Fechar o ciclo pedagogico do erro: simulado, erro, retomada curta, checagem e
nova tentativa.

## Decisao De Produto

- errar no simulado nao deve virar apenas uma mensagem generica;
- a jornada deve apontar um ponto especifico de retomada;
- a retomada deve ser curta, com uma checagem simples;
- acertar a retomada pode dar um pequeno reforco de pontos;
- a retomada nao domina o capitulo inteiro;
- dominio continua exigindo `80%+` no simulado completo.

## O Que Entrou

### Backend

- `guided_review` agora pode corrigir uma checagem curta baseada em
  `reviewCheck`;
- respostas do tipo `cap02-q1:review` sao aceitas quando a questao possui
  retomada cadastrada;
- a correcao de retomada avalia apenas a pergunta focada, nao o quiz inteiro;
- `guided_review` correto vale XP pequeno;
- ao concluir a retomada, o proximo passo volta para o simulado completo;
- retomar um item nao marca o capitulo como dominado.

### UI

- apos um simulado completo com erro, a tela mostra `Retomada rapida`;
- a retomada usa o primeiro erro relevante;
- a tela mostra uma pergunta curta com duas alternativas quando disponivel;
- o aluno pode abrir o trecho recomendado do capitulo;
- ao conferir a retomada, a tentativa e salva como `guided_review`.

### Controle De Custo

- nao ha IA ao vivo;
- nao ha nova tabela;
- nao ha nova migration;
- a retomada usa dados versionados ja existentes no catalogo de quizzes;
- o Supabase so recebe uma tentativa curta quando o aluno envia a retomada.

## O Que Ficou De Fora

- gerar nova pergunta por IA ao errar;
- retentativa automatica apenas das questoes erradas;
- fila de multiplos erros;
- revisao adaptativa com historico longo;
- deploy em producao.

## Proximo Passo

Revisar o fluxo no navegador local:

1. fazer um simulado com pelo menos um erro;
2. conferir se aparece `Retomada rapida`;
3. responder a checagem curta;
4. verificar se o resultado manda tentar o simulado completo novamente.
