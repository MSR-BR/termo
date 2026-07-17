# Change Plan: TERMO Gamificacao Fase 1D

## Objetivo

Integrar o fluxo visual de simulado dentro do `Estudo guiado`, ainda no
worktree offline e sem rollout em producao.

## Escopo Desta Fatia

- abrir simulado por URL interna da jornada;
- carregar quiz publicado do catalogo versionado;
- responder questoes de multipla escolha;
- enviar tentativa autenticada ao backend;
- mostrar resultado, pontuacao, explicacoes e proximo passo.

## O Que Entrou

### Rota de UI

- `index.html?view=journey&section=quiz&chapter=02`
- `index.html?view=journey&section=quiz&chapter=04`

### Comportamento

- o bloco `Simulados disponiveis agora` abre o simulado dentro do proprio
  `Estudo guiado`;
- o formulario exige resposta em todas as questoes antes de enviar;
- o envio usa `POST /api/chapter-quiz` com token da sessao Supabase;
- o resultado mostra acertos, percentual, pontos recebidos e explicacoes;
- o proximo passo vem do backend, baseado no primeiro erro ou na conclusao sem
  pendencias.

### Controle de custo e Supabase

- o quiz e carregado do catalogo versionado local por `GET /api/chapter-quiz`;
- nao ha chamada de IA ao vivo nesta fase;
- o Supabase so e acionado para buscar o profile da jornada e gravar a tentativa
  quando o usuario envia o simulado;
- a chave `service_role` continua apenas no backend.

## O Que Ficou De Fora Desta Fatia

- geracao dinamica de simulado por IA em tempo real;
- tela dedicada para retentativa focada por ultimo erro;
- cache persistente de quizzes gerados por IA;
- simulados para todos os capitulos;
- commit e deploy em producao.

## Proximo Passo

Revisar visualmente o fluxo completo no navegador local:

1. abrir `Estudo guiado`;
2. clicar em um simulado disponivel;
3. responder as 5 questoes;
4. enviar;
5. conferir se pontos, resultado e proximo passo fazem sentido.
