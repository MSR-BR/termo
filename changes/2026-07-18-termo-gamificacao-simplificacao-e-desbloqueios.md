# Change Plan: TERMO Gamificacao - Simplificacao e Desbloqueios

## Objetivo

Simplificar a primeira experiencia de gamificacao do TERMO: tirar o conceito de
`Estudo guiado` da navegacao principal por enquanto, preservar a ideia para uma
fase futura e transformar o que ja funciona em uma area mais simples de
`Pontos e simulados` dentro de `Extras`.

O foco da proxima implementacao deve ser:

- reduzir complexidade visual;
- manter o app atual estavel;
- evitar aumento desnecessario de leituras no Supabase gratuito;
- transformar pontos em desbloqueios claros;
- liberar simulados por capitulos em ordem, com progressao facil de entender.

## Diagnostico

O `Estudo guiado` atual ficou bom como experimento, mas esta adiantado demais
para a primeira versao publica. Ele mistura muitas ideias em uma tela:

- escolha de metodologia de estudo;
- plano resumido;
- passo anterior, sugerido e proximo;
- metricas;
- simulados;
- desafio do dia.

Para o aluno, isso ainda nao parece uma acao simples. Para o TERMO, tambem cria
mais superficie de manutencao antes de termos dados reais suficientes para guiar
com inteligencia.

## Decisao De Produto

Adiar o `Estudo guiado` como conceito principal.

Na primeira versao publica, usar uma linguagem mais direta:

- `Pontos`;
- `Simulados`;
- `Desbloqueios`;
- `Desafio do dia`.

O estudo guiado volta depois, quando houver historico suficiente para justificar
rotas adaptativas.

## Change 2A - Remover Estudo Guiado Da Navegacao Principal

Status: implementado localmente em 2026-07-18.

### O Que Muda

- Remover o botao `Estudo guiado` do cabecalho.
- Remover `Estudo guiado` da `Area Pessoal`.
- Remover o card `Estudo guiado` da tela inicial/menu de descoberta.
- Manter login, favoritos e exercicios salvos como estao.

### Recomendacao Tecnica

Nao apagar a rota interna imediatamente. Em vez disso:

- esconder os atalhos publicos para `view=journey`;
- preservar a rota por uma fase para evitar quebra de links antigos;
- depois renomear/reaproveitar a rota para `Pontos e simulados`, se isso reduzir
  risco de regressao.

### Arquivos Provaveis

- `index.html`
- `assets/termo-auth.js`

### Validacao

- Cabecalho nao mostra `Estudo guiado`.
- Popup/area pessoal nao mostra `Estudo guiado`.
- Menu principal continua com `Meus exercicios` e `Itens favoritos`.
- Nao ha link publico evidente para `view=journey`.

## Change 2B - Transformar A Tela Atual Em Pontos E Simulados

Status: implementado localmente em 2026-07-18.

Observacao: a rota tecnica `view=journey` foi preservada para nao quebrar o
fluxo de simulados, mas a area visivel foi renomeada para `Pontos e simulados`
e movida para `Extras`.

### O Que Sai

Remover da tela o que aparece nos anexos:

- card `Escolha do guia`;
- opcoes `Sequencial`, `Dominio por capitulo`, `Revisao por erros`;
- texto explicativo da metodologia;
- `Plano resumido`;
- `Passo anterior`;
- `Passo sugerido`;
- `Proximo passo`.

### O Que Fica

Aproveitar apenas o que ajuda agora:

- pontos de estudo;
- nivel;
- sequencia;
- dominio;
- simulados por capitulo;

Observacao: `Desafio do dia` sai desta pagina na implementacao da 2B e passa a
ser tratado como item proprio em `Extras` na Change 2F.

### Novo Nome Da Area

Recomendado:

`Pontos e simulados`

Alternativas possiveis:

- `Progresso e simulados`;
- `Desbloqueios`;
- `Minha pontuacao`.

Minha recomendacao e `Pontos e simulados`, porque e mais concreto para o aluno.

### Onde Aparece

Mover esta area para `Extras`, junto de:

- `Simuladores`;
- `Livro em PDF`;
- `Pontos e simulados`.

### Recomendacao Tecnica

Usar uma rota simples:

- curto prazo: manter internamente `index.html?view=journey`, mas mostrar o nome
  `Pontos e simulados`;
- medio prazo: criar alias `index.html?view=progress` ou
  `index.html?view=points`;
- nao quebrar `section=quiz&chapter=XX`, porque os simulados ja usam essa rota.

## Change 2C - Botao De Pontos No Cabecalho

Status: implementado localmente em 2026-07-18.

Observacao: o botao usa a rota atual `view=journey`, mas mostra o destino como
`Pontos e simulados`. A pontuacao fica em cache no frontend e e atualizada por
evento local quando um item de estudo e validado.

### O Que Muda

No lugar do botao `Estudo guiado`, colocar um botao com a pontuacao do aluno.

Exemplos de texto:

- se logado: `75 pontos`;
- se nao logado: `Pontuar`;
- durante carregamento: `Pontos`;
- se erro de leitura: `Pontos`.

Ao clicar, abrir:

`Pontos e simulados`

### Comportamento Esperado

- Nao deve bloquear leitura para aluno nao logado.
- Se nao logado, pode abrir modal de login ou levar para a area de pontos com
  convite para login.
- Se logado, mostra a pontuacao atual e detalhes de desbloqueio.
- Ao marcar item como estudado, o botao atualiza sem recarregar a pagina quando
  possivel.

### Cuidado Com Supabase Gratuito

Nao buscar perfil de gamificacao em toda renderizacao.

Recomendacao:

- carregar pontos apenas depois de login;
- cachear o profile em memoria no frontend;
- atualizar por evento local quando `study_item_complete` for registrado;
- revalidar no Supabase apenas em entrada na area `Pontos e simulados`, login ou
  envio de simulado.

## Change 2D - Regras De Pontuacao

Status: implementado localmente em 2026-07-18.

Observacao: implementacao minima, sem card informativo novo. As regras ficam
nos botoes `?` dos cards de metricas, e o texto abaixo de `Simulados por
capitulo` foi simplificado.

### Regra Atual Que Deve Ser Comunicada

- marcar item como estudado: `+20 pontos`;
- primeira tentativa de simulado completo: `+30 pontos`;
- bonus por simulado completo com `80%` ou mais: `+15 pontos`;
- refazer simulado ja feito: ate `+5 pontos`;
- retomada/desafio curto correto: `+10 pontos`.

### Ajuste De Texto

Trocar explicacoes tecnicas por linguagem de aluno:

- `Voce ganha pontos ao concluir secoes, fazer simulados e resolver revisoes curtas.`
- `Os pontos liberam novos simulados e recursos.`
- `A leitura so conta quando voce valida o estudo no fim da secao.`

## Change 2E - Desbloqueio De Simulados Por Capitulos

Status: implementado localmente em 2026-07-18.

Observacao: os cards existentes foram mantidos. A regra agora considera a
ordem dos capitulos: a partir do Capitulo 2, o simulado so abre se o capitulo
anterior ja estiver dominado. A pontuacao acumulada pode ajudar a atingir o
patamar do percurso, mas nao permite pular o dominio do capitulo anterior.
Os cards passam a mostrar a metrica de pontos do percurso em vez de `0/x itens
estudados`.

### Regra Pedagogica Recomendada

Os simulados devem ser liberados em ordem de capitulos.

Para cada capitulo:

- o aluno precisa marcar estudo em pelo menos `80%` dos itens do capitulo; ou
- atingir uma pontuacao minima equivalente ao progresso esperado daquele capitulo.

Isso permite que o `Desafio do dia` ajude a acelerar a liberacao, porque ele
tambem gera pontos.

### Regra Operacional Proposta

Para o Capitulo 1:

- liberar o simulado quando o aluno atingir o patamar de pontos equivalente a
  `80%` do capitulo.

Exemplo usando a regra atual:

- Capitulo 1 tem `19` itens;
- cada item vale `20 pontos`;
- `80%` de `19` itens = `16` itens;
- `16 x 20 = 320 pontos`;
- portanto o simulado do Capitulo 1 libera ao chegar a `320 pontos` no
  percurso. Validar secoes estudadas continua sendo uma forma importante de
  ganhar pontos, mas a metrica exibida no card e pontuacao.

Para os proximos capitulos, repetir o mesmo raciocinio:

- Capitulo 2 libera depois que o Capitulo 1 estiver dominado e houver progresso
  suficiente no Capitulo 2;
- Capitulo 3 libera depois do Capitulo 2;
- e assim por diante.

### Dominio

Depois que o simulado for liberado:

- `80%` ou mais no simulado = capitulo dominado;
- `100%` = conquista de excelencia.

### Decisao Em Aberto

O termo `Simuladores` hoje tambem significa laboratorios interativos, como Van
der Waals, Carnot etc. Para evitar confusao, separar:

- `Simulados IA`: provas/questoes por capitulo;
- `Simuladores interativos`: laboratorios/visualizacoes.

Se a regra de bloqueio tambem valer para simuladores interativos, criar uma
tabela separada de desbloqueio por recurso. Se valer apenas para simulados IA,
manter os simuladores interativos livres ou com bloqueio independente.

Minha recomendacao para a proxima fase: bloquear apenas `Simulados IA` agora e
deixar `Simuladores interativos` para uma decisao posterior, porque o aluno pode
confundir os dois nomes.

## Change 2F - Desafio Do Dia Como Acelerador

Status: implementado localmente.

### Objetivo

Transformar `Desafio do dia` em um item separado dentro de `Extras`, nao como
bloco dentro da pagina `Pontos e simulados`.

Manter o desafio simples: uma revisao curta que da pontos e ajuda a desbloquear
o proximo simulado.

### Regra Recomendada

- desafio correto: `+10 pontos`;
- desafio incorreto: nao pontua, mas sugere retomada;
- desafio nasce de um item ja marcado como estudado ou de um capitulo em que
  o simulado ja foi feito;
- antes de haver historico, nao gerar desafio e orientar o aluno a marcar o
  primeiro item estudado ou concluir um simulado.

### Implementacao Da Primeira Versao

- `Extras` passa a listar `Desafio do dia` como item proprio.
- O desafio usa uma pergunta de multipla escolha gerada/reaproveitada pela
  infraestrutura de simulado IA do capitulo.
- A aba explica que o desafio vem apenas de itens ja estudados ou capitulos
  com simulado ja realizado.
- Usuario novo ve uma mensagem dizendo que ainda nao ha itens estudados para
  gerar desafio.
- A pergunta do dia fica salva no navegador por usuario e por data, evitando
  regerar pergunta a cada recarregamento.
- A correcao usa `guided_review`, portanto acerto vale reforco pequeno de
  pontos sem contar como simulado completo.
- Nao foram criadas novas tabelas nem novas leituras recorrentes no Supabase.

### Cuidado

Nao implementar email agora. Email deve ficar para uma fase posterior, porque
envolve cron, provedor de email, unsubscribe e maior risco operacional.

## Change 2G - Integracao Com Extras

Status: implementado localmente.

### Nova Estrutura Do Menu Extras

Ordem recomendada:

1. `Pontos e simulados`
2. `Desafio do dia`
3. `Simuladores`
4. `Livro em PDF`

### Por Que Esta Ordem

- pontos e simulados viram a camada de engajamento;
- desafio do dia vira o acelerador curto da rotina de estudo;
- simuladores continuam como recurso complementar;
- PDF continua como material de apoio.

### Ajustes Feitos

- Menu `Extras` inicial do HTML e menu gerado por JavaScript ficam na mesma
  ordem.
- Textos dos itens foram ajustados para diferenciar `Pontos e simulados`,
  `Desafio do dia`, `Simuladores` e `Livro em PDF`.
- O rótulo antigo `Estudo guiado` não aparece mais como área navegável atual.

## Change 2H - Estudo Guiado Futuro

Status: implementado como decisao de arquitetura/documentacao.

### Decisao

O `Estudo guiado` inteligente nao entra como produto visivel nesta versao.

A ideia continua boa, mas fica adiada porque a primeira versao precisa ser
simples, previsivel e barata de operar. O caminho atual para o aluno passa por:

1. estudar capitulos e marcar itens como estudados;
2. acumular pontos;
3. liberar simulados em ordem;
4. usar o `Desafio do dia` como revisao curta baseada no que ja estudou.

### O Que Nao Fazer Agora

- Nao mostrar botao `Estudo guiado` no cabecalho.
- Nao mostrar `Estudo guiado` na area pessoal.
- Nao criar tela de escolha de metodologia de estudo.
- Nao gerar plano de estudos adaptativo com texto pre-pronto.
- Nao enviar notificacoes por email nesta fase.
- Nao criar novas tabelas/processos recorrentes so para alimentar o guia.

### O Que Fica Para Depois

O estudo guiado inteligente deve voltar quando tivermos:

- historico real de itens estudados;
- erros de simulados suficientes;
- dados de retomada;
- estabilidade das regras de pontuacao;
- clareza sobre o fluxo pedagogico preferido.

### Criterios Para Reativar

Reativar somente quando for possivel sugerir proximos passos com base em dados
reais, por exemplo:

- ultimo item estudado;
- capitulo atual;
- simulado concluido e respectiva nota;
- primeiro erro relevante do simulado;
- desafio do dia respondido;
- itens favoritos ou exercicios salvos, se forem pedagogicamente uteis.

Se esses dados ainda forem escassos, a interface deve continuar simples:
`Pontos e simulados`, `Desafio do dia`, `Simuladores` e `Livro em PDF`.

### Futura Versao Do Estudo Guiado

Quando voltar, pode ter:

- rota sequencial;
- rota por dominio de capitulo;
- rota por revisao de erros;
- sugestao adaptativa;
- notificacao por email opcional.

Mas isso nao deve ser a primeira tela de gamificacao agora.

### Limite Operacional

Como o projeto ainda usa Supabase gratuito, a futura versao do guia deve:

- reaproveitar o profile de gamificacao ja carregado;
- evitar polling;
- evitar cron/email enquanto nao houver necessidade clara;
- preferir cache local para escolhas de UI;
- buscar dados pessoais apenas apos login e em momentos de acao do aluno.

## Ordem De Implementacao Recomendada

### Etapa 1 - Simplificacao De UI

- Remover `Estudo guiado` do cabecalho, area pessoal e descoberta.
- Criar item `Pontos e simulados` em `Extras`.
- Remover os blocos complexos da tela atual.
- Renomear textos de `Estudo guiado` para `Pontos e simulados`.

### Etapa 2 - Header De Pontos

- Criar botao de pontos no cabecalho.
- Ligar o botao ao profile de gamificacao com cache leve.
- Atualizar pontos apos eventos locais.

### Etapa 3 - Desbloqueios

- Implementar regra clara de desbloqueio por capitulo.
- Mostrar progresso de desbloqueio em cada card.
- Bloquear simulados fora de ordem.

### Etapa 4 - Desafio Do Dia

- Criar `Desafio do dia` como item proprio em `Extras`.
- Fazer o desafio pontuar e acelerar desbloqueios.
- Adiar email.

### Etapa 5 - Revisao E Deploy

- Validar login real.
- Validar Supabase real.
- Validar usuario zerado.
- Validar usuario com pontos.
- Validar usuario com simulado desbloqueado.
- Validar responsividade mobile.

## Validacoes Necessarias

- `npm run check`;
- `npm run test:gamification`;
- teste local em `index.html`;
- teste em producao apos deploy;
- teste com usuario zerado;
- teste com usuario que marca itens do Capitulo 1;
- teste de desbloqueio do simulado do Capitulo 1;
- teste de tentativa de abrir simulado bloqueado.

## Riscos

- Confusao entre `simulados` e `simuladores`.
- Aumento de chamadas ao Supabase se o botao de pontos buscar profile demais.
- Usuario achar que perdeu o `Estudo guiado`; por isso a nova area deve deixar
  claro que pontos e simulados sao o caminho atual.
- Links antigos para `view=journey` podem existir; manter alias evita quebra.

## Fora De Escopo Agora

- email do desafio do dia;
- ranking;
- turma;
- notificacao push;
- trilhas adaptativas completas;
- apagar tabelas ou migrar banco;
- mudar regras de Auth;
- bloquear/desbloquear simuladores interativos sem decisao explicita.
