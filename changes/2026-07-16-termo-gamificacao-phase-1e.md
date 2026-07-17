# Change Plan: TERMO Gamificacao Fase 1E

## Objetivo

Transformar a logica pedagogica de dominio e progressao em regra explicita do
produto.

## Decisao De Produto

- `80%` no simulado significa capitulo dominado.
- `100%` gera conquista de excelencia, mas nao e requisito para avancar.
- repetir o mesmo simulado nao deve dar premio cheio.
- erro no simulado continua gerando retomada pelo primeiro erro relevante.
- o proximo simulado so deve ser sugerido/liberado depois do capitulo anterior
  chegar a `80%`.

## O Que Entrou

### Backend

- constantes `CHAPTER_MASTERY_SCORE = 80` e `CHAPTER_EXCELLENCE_SCORE = 100`;
- resultado de quiz agora grava:
  - `isMastered`;
  - `isExcellent`;
  - `masteryThreshold`;
  - `progressionStatus`;
- primeira tentativa com `80%+` recebe XP cheio + bonus;
- repeticao de simulado recebe premio reduzido;
- `100%` pode liberar badge de excelencia;
- dominio de capitulo pode liberar badge `capitulo_X_domado`;
- o proximo passo passa a sugerir o proximo simulado publicado quando o aluno
  atinge `80%+`.

### Profile/Jornada

- o endpoint `/api/gamification-profile` agora faz leitura limitada das
  tentativas recentes de quiz;
- a jornada recebe `chapterProgress` real por capitulo;
- o resumo de capitulos dominados considera tentativas com `80%+`;
- feature flags expõem `masteryScore` e `excellenceScore`.

### UI

- o card do simulado mostra `Dominado`, `Excelencia`, `Simulado disponivel` ou
  `Libera apos 80%`;
- simulados posteriores ficam aguardando dominio do anterior;
- a tela de resultado explica se o aluno dominou, precisa revisar ou obteve
  excelencia.

## Controle De Supabase

- nao houve alteracao de schema;
- nao houve nova tabela;
- o profile adiciona apenas uma leitura limitada em `chapter_quiz_attempts`;
- a gravacao continua concentrada no envio de tentativa de simulado.

## O Que Ficou De Fora

- geracao de novas questoes por IA ao refazer;
- retentativa focada apenas nas questoes erradas;
- ranking, leaderboard ou mecanicas sociais;
- deploy em producao.

## Proximo Passo

Revisar no navegador local:

1. fazer Capitulo 02 com menos de `80%` e verificar se Capitulo 04 fica
   aguardando;
2. refazer Capitulo 02 com `80%+` e verificar se Capitulo 04 passa a ser o
   proximo passo;
3. fazer `100%` e conferir se a mensagem trata isso como excelencia, nao como
   requisito.
