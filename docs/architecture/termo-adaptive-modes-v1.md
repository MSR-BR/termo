# TERMO — modos adaptativos e recompensas pedagógicas v1.1

## Estado

Implementado e validado na T52. A migração foi aplicada e registrada no projeto
Supabase TERMO em 25/09/2026, antes da ativação do runtime. O `cpd` foi autorizado
para publicar o código com o ledger v1 habilitado somente em produção.

## Fontes canônicas

- `data/termo-editorial-registry.json`: disponibilidade pública e bloqueios;
- `data/ai-exercise-source-manifest.json`: seções revisadas e fontes aprovadas;
- `data/book-topic-taxonomy.json`: conceitos e relações temáticas existentes;
- `data/termo-concept-graph-v1.json`: grafo gerado e versionado;
- `data/termo-simulator-capabilities-v1.json`: capacidades verificadas dos simuladores.

O capítulo 05 falha fechado. Nenhum pré-requisito foi inventado: as listas estão
vazias e `prerequisiteEdgesActive` permanece `false` até revisão editorial humana.

## Evidências

O servidor distingue:

- `incorrect`;
- `correct_low_confidence`;
- `correct_with_help`;
- `solution_revealed`;
- `independent_retrieval`.

Somente a recuperação independente pode compor domínio. Um capítulo requer duas
recuperações com nota mínima de 80%, em dias diferentes e em formas de quiz
diferentes. Pontos, abertura de página e abertura de simulador não provam
aprendizagem.

## Modos

- `full_quiz`: avaliação completa;
- `guided_review`: retomada explicitamente assistida;
- `focused_retry`: transferência próxima;
- `daily_challenge`: prática diária curta, separada da revisão guiada.

O Desafio do dia prioriza fraqueza, tempo desde a última prática e intercalação.
Ele vale 10 pontos somente quando correto e no máximo uma vez por dia UTC. A
ausência não remove pontos nem altera a sequência.

## Recompensas e explicabilidade

- seção estudada validada: 20 pontos, uma vez por seção;
- primeira avaliação completa do capítulo: 30 pontos;
- revisão guiada ou retry verificado: 10 pontos por atividade idempotente;
- Desafio do dia correto: 10 pontos, uma vez ao dia;
- repetição do simulado: zero ponto adicional;
- domínio: badge sem prêmio numérico adicional.

Cada próxima ação informa motivo, fonte, duração estimada e alternativa. A missão
gerada é opcional e declara `absencePenalty: false`.

## Simuladores

A auditoria encontrou somente registro de abertura. Por isso todas as capacidades
de previsão, interação significativa, reflexão e objetivo permanecem desativadas.
Abertura vale zero ponto e zero domínio. O simulador S07 permanece sem vínculo
editorial elegível e falha fechado para evidência pedagógica.

## Segurança e rollout

- o navegador não escreve diretamente nas tabelas;
- o RPC autoritativo continua restrito a `service_role`;
- RLS e grants explícitos permanecem ativos;
- a migração cria unicidade por usuário/dia para o Desafio do dia;
- a classificação de evidência é derivada no servidor a partir do feedback
  estruturado;
- nenhuma credencial ou dado pessoal integra o grafo.

Ordem segura aplicada no rollout:

1. diff revisado e grafo aprovado sem pré-requisitos ativos;
2. `20260925162106_termo_adaptive_modes_v1.sql` aplicada e registrada;
3. função, grants, índice diário, UTC e reconciliação agregada validados;
4. `TERMO_GAMIFICATION_LEDGER_V1=true` ativada somente em produção;
5. runtime publicado pelo `cpd` de 25/09/2026;
6. smoke autenticado de interface e leitor de tela permanecem como verificação
   manual pós-publicação, sem ampliar o escopo pedagógico.
