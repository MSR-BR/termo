# Spec: TERMO Gamificacao Foundation

## Objetivo

Adicionar uma camada de gamificacao ao TERMO para aumentar retorno, constancia
e progressao percebida sem transformar o produto em um sistema de pontos vazio.

O resultado esperado para o usuario autenticado e:

- perceber progresso com clareza;
- receber metas curtas e concretas;
- voltar ao app com mais frequencia;
- sentir que estudo, revisao e contribuicao geram reconhecimento.

## Conceito De Produto

Direcao escolhida: `jornada de dominio + consistencia`.

O TERMO passa a oferecer:

- streak diaria de estudo;
- XP e niveis;
- marcacao de itens estudados;
- dominio por capitulo;
- simulados por capitulo;
- revisao guiada por erro;
- nova tentativa orientada;
- missoes diarias;
- badges por marcos reais;
- painel pessoal `Minha jornada`.

## Base Conceitual

### Teoria dos jogos

Usar incentivos para tornar racional o comportamento que o produto deseja:

- voltar ao app;
- concluir itens;
- revisar;
- usar simuladores;
- salvar e organizar exercicios.

### Economia da dadiva

Nao entra inteira na fase 1, mas orienta a fase social futura:

- reconhecer contribuicoes;
- valorizar ajuda entre usuarios;
- criar prestigio por utilidade, nao so por volume.

### Escolha publica

Serve como guardrail de produto:

- evitar farm de XP;
- evitar ranking toxico;
- evitar metricas que parecem boas mas pioram o estudo real.

## Escopo Da Fase 1

Incluido:

- perfil de gamificacao por usuario autenticado;
- streak diaria;
- XP e niveis;
- eventos elegiveis para recompensa com idempotencia;
- dominio por item e por capitulo;
- simulados de multipla escolha por capitulo;
- missoes diarias simples baseadas em regras;
- badges iniciais;
- painel `Minha jornada`;
- desafio do dia opcional por email;
- instrumentacao analitica da gamificacao;
- arquitetura pronta para expansao social futura.

## Slice Minimo Da Fase 1A

Para caber melhor na conta gratuita do Supabase, a primeira integracao real
deve nascer com um slice menor que a visao completa da fase 1.

Entram primeiro:

- view `journey` dentro da `Area Pessoal`;
- teaser para visitante sem leitura no backend;
- payload unico de jornada para usuario logado;
- quatro tabelas minimas;
- loop principal de estudo, simulado, revisao e retomada.

Ficam adiados nesta subfase:

- gamificacao de favoritos e exercicios salvos;
- simulador como fonte oficial de XP;
- email diario persistido no banco;
- missoes e badges totalmente normalizadas em tabelas separadas.

Fora de escopo nesta fase:

- ranking publico global;
- ligas competitivas;
- chat entre usuarios;
- recompensas monetarias;
- tempo real;
- recursos dependentes de professor/turma.

## Personas E Necessidades

### Aluno recorrente

Quer sentir progresso rapido, voltar sem friccao e saber qual e o proximo passo.

### Aluno intermitente

Precisa de reentrada simples, meta curta do dia e incentivo para retomar apos
quebrar o ritmo.

### Admin do produto

Precisa de regras auditaveis, metricas confiaveis e protecao contra abuso.

## Requisitos Funcionais

### RF1. Elegibilidade

- recursos de progresso persistente exigem login;
- usuario deslogado pode ver teaser da jornada, mas nao acumula estado oficial;
- analytics anonimo continua existindo, mas sem premio gamificado.

### RF2. Painel Minha Jornada

O painel deve mostrar:

- streak atual;
- maior streak;
- XP total;
- nivel atual;
- percentual para o proximo nivel;
- ultimo desempenho em simulado;
- missoes de hoje;
- badges recentes;
- progresso por capitulo;
- sugestao de proxima acao.

Decisao da fase 1A:

- a entrada inicial desta view sera `index.html?view=journey`;
- ela mora dentro da `Area Pessoal` ja existente;
- visitante pode abrir teaser;
- usuario logado recebe payload consolidado.

### RF3. Eventos Autoritativos

XP e progresso oficial so podem nascer de eventos autoritativos, gravados no
backend e processados com idempotencia.

Eventos iniciais:

- `study_item_complete`
- `chapter_quiz_completed`
- `chapter_quiz_review_completed`
- `chapter_quiz_retry_completed`
- `daily_return`
- `chapter_mastery_completed`

Eventos adiados na fase 1A:

- `exercise_saved`
- `exercise_favorited`
- `exercise_validation_submitted`
- `simulator_open_unique_day`

Observacao:

- `page_open` e `session_start` podem informar analytics, mas nao devem gerar XP
  oficial sozinhos.

### RF4. Marcacao De Estudo

Cada pagina de conteudo precisa poder marcar o item atual como estudado.

Regras:

- cada item rende XP uma unica vez;
- o usuario pode desmarcar um item para organizacao pessoal;
- desmarcar nao remove XP historico ja concedido;
- um capitulo e considerado dominado quando todos os itens obrigatorios do
  capitulo forem marcados como estudados.

### RF4A. Simulados Por Capitulo

Cada capitulo pode oferecer um simulado objetivo com 5 questoes de multipla
escolha ou mais.

Regras:

- o simulado deve ser associado ao capitulo atual;
- o usuario deve ver pontuacao final, percentual de acerto e tempo gasto quando
  relevante;
- o sistema pode permitir novas tentativas, mas o premio principal de XP deve
  respeitar guardrails;
- o banco deve guardar historico de tentativas para evolucao do aluno.

### RF4B. Revisao Guiada E Nova Tentativa

Depois do simulado, o aluno deve ter uma trilha curta de recuperacao:

- ver quais pontos erraram;
- receber sugestoes diretas de revisao por item do capitulo;
- fazer uma revisao curta com poucas perguntas focadas nos erros;
- refazer apenas os pontos fracos, sem repetir o quiz inteiro.

Objetivo:

- transformar erro em orientacao de estudo;
- reduzir repeticao cega;
- reforcar memoria conceitual antes da proxima tentativa completa.

### RF5. Streak

Regras da streak:

- contar um dia quando existir ao menos um evento autoritativo no dia local do
  usuario;
- manter a streak com intervalo maximo de 1 dia entre dias ativos;
- registrar maior streak historica;
- mostrar perda de streak de forma leve, sem punicao excessiva.

### RF6. XP E Niveis

Regras:

- XP deve premiar consistencia e marcos reais;
- niveis devem seguir progressao clara e previsivel;
- o usuario deve ver de onde veio o ganho recente.

Tabela inicial sugerida:

- `study_item_complete`: 20 XP
- `exercise_saved`: 15 XP
- `exercise_favorited`: 5 XP
- `exercise_validation_submitted`: 10 XP
- `simulator_open_unique_day`: 12 XP
- `chapter_quiz_completed`: 30 XP base
- `chapter_mastery_completed`: 80 XP
- `daily_return`: 8 XP

Bonus sugeridos para simulado:

- `>= 80%` de acerto: +15 XP
- `100%` de acerto na primeira tentativa: badge ou bonus adicional

### RF7. Missoes Diarias

Cada usuario autenticado recebe ate 3 missoes simples por dia.

Missoes iniciais:

- estudar 1 item novo;
- salvar 1 exercicio;
- abrir 1 simulador;
- concluir 2 itens;
- completar 1 simulado de capitulo;
- revisar 1 item favorito.

Regras:

- missoes devem ser compativeis com o estado do usuario;
- uma missao concluida rende bonus de XP;
- o usuario ve progresso parcial quando aplicavel.

### RF8. Badges

Badges iniciais:

- `primeiro_item`
- `sequencia_3_dias`
- `sequencia_7_dias`
- `primeiro_simulador`
- `primeiro_exercicio_salvo`
- `primeiro_simulado`
- `capitulo_01_domado`

Badges precisam ter:

- nome;
- descricao curta;
- icone;
- condicao deterministica;
- data de conquista.

### RF9. Guardrails Contra Abuso

O sistema deve:

- rejeitar duplicacao por refresh;
- limitar premios que podem ocorrer por dia por tipo quando fizer sentido;
- usar `idempotency_key` por evento;
- diferenciar telemetry de recompensa oficial;
- limitar XP de repeticao de simulado quando a mesma bateria for refeita varias
  vezes;
- evitar ranking por volume bruto na fase 1.

### RF9A. Desafio Do Dia Por Email

Usuarios autenticados podem optar por receber um email com um desafio curto do
dia.

O email pode conter:

- um CTA para voltar ao app;
- um simulado curto ou pergunta destaque;
- uma sugestao de capitulo ou item pendente;
- contexto de streak ou missao do dia.

Diretriz validada no prototipo:

- o desafio do dia deve nascer, quando possivel, do ultimo erro ou da ultima
  retomada do aluno, em vez de ser uma sugestao generica.

Regras:

- envio apenas para usuarios opt-in;
- frequencia maxima inicial de 1 email por dia;
- deve existir controle simples de descadastro;
- o email deve puxar dados reais da jornada, nao texto generico.

### RF10. Analytics De Produto

Devem existir eventos de analytics para medir:

- abertura do painel jornada;
- taxa de conclusao de missoes;
- taxa de inicio e conclusao de simulados;
- distribuicao de streaks;
- evolucao de XP por coorte;
- abertura e clique de desafio diario por email;
- impacto da gamificacao em retorno e uso de exercicios.

## Requisitos De UX

- o painel deve caber no padrao visual do TERMO;
- a linguagem deve ser academica e motivadora, nao infantilizada;
- progresso deve ser legivel em desktop e mobile;
- feedback de ganho deve ser curto e discreto;
- ranking deve ser opcional e ficar fora da fase 1.

## Requisitos Tecnicos

- o estado oficial nao deve morar em `user_metadata`;
- o cliente nao pode conceder XP diretamente;
- o backend deve registrar log de eventos e atualizar agregados;
- a arquitetura deve permitir reprocessamento de regras;
- as regras de pontuacao devem ser configuraveis sem reescrever toda a UI.
- a fase inicial deve respeitar os limites do plano gratuito do Supabase, com
  baixo volume de leitura e escrita.

### RF11. Restricao De Infra Na Fase Inicial

Para preservar o uso no plano gratuito do Supabase:

- evitar polling frequente no cliente;
- evitar gravar um evento a cada interacao de baixo valor;
- preferir agregados compactos para leitura da jornada;
- limitar notificacoes e jobs diarios;
- priorizar uma primeira versao com poucas tabelas quentes e consultas simples.

## Criterios De Aceitacao

1. Usuario autenticado consegue marcar um item como estudado e ve o progresso
atualizado na jornada.
2. O mesmo item nao gera XP duplicado mesmo com refresh ou cliques repetidos.
3. A streak sobe quando ha atividade autoritativa em dias consecutivos.
4. Um capitulo completo rende o badge e o bonus previstos uma unica vez.
5. O usuario consegue resolver um simulado de capitulo e recebe resultado
registrado com regra de pontuacao consistente.
6. O usuario recebe revisao guiada por erro e consegue fazer uma nova tentativa
orientada focada apenas nos pontos fracos.
7. Missoes diarias aparecem com progresso e podem ser concluidas no mesmo dia.
8. Eventos de analytics medem a adocao da jornada sem quebrar o GA4 atual.
9. Usuario opt-in pode receber desafio do dia por email com link valido de
retorno ao app.
10. Usuario deslogado ve CTA para entrar, sem erro de interface.

## Medidas De Sucesso

- aumento de usuarios que retornam em 7 dias;
- aumento de exercicios salvos por usuario autenticado;
- aumento de simulados concluidos por usuario autenticado;
- aumento de aberturas recorrentes de simuladores;
- aumento de navegacao para capitulos adicionais;
- aumento de retorno vindo de email de desafio diario;
- crescimento da taxa de login em usuarios recorrentes.

## Medidas De Sucesso

- aumento de usuarios que retornam em 7 dias;
- aumento de exercicios salvos por usuario autenticado;
- aumento de aberturas recorrentes de simuladores;
- aumento de navegacao para capitulos adicionais;
- crescimento da taxa de login em usuarios recorrentes.
