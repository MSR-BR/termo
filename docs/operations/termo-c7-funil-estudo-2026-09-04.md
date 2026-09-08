# TERMO — C7: funil de estudo

## Resultado executivo

Análise criada no GA4 em 4 de setembro de 2026, usando o período de 7 de
agosto a 3 de setembro de 2026. O relatório usa 100% dos dados disponíveis e
permanece salvo como `TERMO — Funil de estudo (C7)`.

O maior gargalo inicial é a passagem da home para o clique em “Começar a
estudar”: somente 67 de 774 usuários avançaram (8,66%). Depois do clique, a
progressão até a ativação do estudo é forte. O segundo gargalo é a geração de
um exercício: somente 3 de 50 usuários ativados chegaram a
`exercise_generate_success` (6%).

## Funil reconciliado

| Etapa | Usuários | % da etapa 1 | Conversão para a próxima etapa | Abandono |
|---|---:|---:|---:|---:|
| Visita à home | 774 | 100,0% | 8,66% | 707 (91,34%) |
| Clique em começar a estudar | 67 | 8,7% | 77,61% | 15 (22,39%) |
| Início de capítulo | 52 | 6,7% | 96,15% | 2 (3,85%) |
| Ativação do estudo | 50 | 6,5% | 6,00% | 47 (94,00%) |
| Exercício gerado com sucesso | 3 | 0,4% | 0,00% | 3 (100,00%) |
| Login concluído após as etapas anteriores | 0 | 0,0% | — | — |

As contagens e os percentuais acima foram conferidos diretamente na tabela da
exploração do GA4.

## Leitura por canal

- Pesquisa paga trouxe 740 das 774 entradas na home (95,6%) e 64 dos 67
  cliques no CTA.
- Cross-network trouxe 13 entradas e 1 clique.
- Direto trouxe 15 entradas e nenhum clique registrado no CTA dentro da
  sequência fechada.
- Referência trouxe 4 entradas e 1 clique.
- Não houve linha de busca orgânica entre os cinco canais exibidos neste
  funil; portanto, o volume orgânico é insuficiente para comparação confiável
  neste período.
- As 3 gerações bem-sucedidas de exercício vieram de Pesquisa paga.

## Leitura por dispositivo

- Mobile: 613 entradas, 60 cliques no CTA (9,79%), 48 inícios de capítulo, 46
  ativações e 3 exercícios gerados.
- Desktop: 148 entradas, 2 cliques no CTA (1,35%), 1 início de capítulo, 1
  ativação e nenhum exercício gerado.
- Tablet: 13 entradas e 5 cliques no CTA (38,46%), mas a amostra é pequena
  demais para orientar decisão.

## Limitações e cuidados de interpretação

1. O código registra `chapter_start` imediatamente antes de
   `study_activation`; por isso o relatório respeita essa ordem real, embora a
   proposta inicial os listasse ao contrário.
2. `login_success` pode ocorrer antes do estudo. O valor zero na última etapa
   não significa ausência de logins; significa apenas que nenhum login ocorreu
   depois de todas as etapas anteriores, na ordem exigida pelo funil fechado.
3. Retorno em 7 e 30 dias exige uma análise de retenção/coorte separada. Ele
   não deve ser misturado ao funil sequencial até existir uma definição estável
   de “retorno ao estudo”.
4. Avaliação do app só poderá entrar no relatório depois que o recurso gerar
   dados suficientes.
5. Não foram usadas dimensões com nome, e-mail ou outro identificador pessoal.

## Decisões sugeridas para as próximas changes

1. Investigar por que 91,34% dos visitantes da home não acionam o CTA.
2. Verificar se `exercise_generate_success` representa apenas um tipo
   específico de exercício ou se há perda real entre estudo e prática.
3. Tratar login como análise paralela, não como última etapa obrigatória.
4. Criar uma definição explícita de retorno ao estudo para medir retenção em 7
   e 30 dias.
5. Reduzir a dependência de Pesquisa paga antes de aumentar orçamento.
