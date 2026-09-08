# TERMO — C8: qualidade dos termos e estrutura do Google Ads

## Resumo executivo

Análise realizada em 4 de setembro de 2026 para o período de 5 de agosto a 3
de setembro de 2026. Nenhuma palavra negativa, palavra-chave, campanha, lance,
orçamento ou anúncio foi alterado.

A campanha está concentrada em uma única campanha de Pesquisa e um único grupo
de anúncios. Ela gera ativações a custo baixo, mas mistura intenções muito
diferentes. A ação recomendada é aplicar apenas negativas específicas e
seguras, após aprovação, mantendo termos amplos que já produziram conversões e
preservando os parceiros de pesquisa.

## Escala e eficiência

- 987 cliques em 52.572 impressões;
- CTR de 1,88%;
- custo de €99,13;
- 141 conversões, com custo médio de €0,70;
- 652 cliques e 84 conversões aparecem em termos identificáveis;
- 334 cliques e 57 conversões estão agrupados em “outros termos de pesquisa”,
  o que limita a classificação termo a termo.

## Termos com evidência suficiente para serem preservados

| Termo | Cliques | Impressões | Custo | Conversões | Custo/conversão |
|---|---:|---:|---:|---:|---:|
| `termodinâmica` | 43 | 2.954 | €3,53 | 11 | €0,32 |
| `física` | 30 | 3.233 | €2,53 | 3 | €0,84 |
| `fisica` | 13 | 3.495 | €0,58 | 2 | €0,29 |
| `termodinamica` — variante exata | 21 | 3.094 | €1,25 | 2 | €0,63 |
| `termodinamica` — ampla | 15 | 2.195 | €0,72 | 2 | €0,36 |
| `leis da termodinamica` | 12 | 839 | €0,99 | 1 | €0,99 |

Embora “física” seja genérico e tenha CTR baixo, suas duas grafias produziram
cinco conversões por €3,11. Negativar `física` de forma ampla eliminaria tráfego
com resultado comprovado.

## Termos próximos que não devem ser negativados agora

- `phet`, `phet colorado`, `phet simulador` e variações: o termo
  `phet colorado` gastou €1,48 sem conversão na amostra visível, mas simuladores
  fazem parte do produto e o conjunto deve ser analisado antes de qualquer
  bloqueio amplo;
- termoquímica, termometria, calorimetria, termologia, transferência de calor,
  dilatação térmica e máquinas térmicas: são temas próximos do conteúdo e podem
  corresponder a capítulos ou simuladores;
- física, aprender física, livro de física e estudo de física: intenção ampla,
  mas as grafias simples já geraram conversões;
- `termodinâmica quântica`: intenção especializada e possivelmente desalinhada,
  porém não deve gerar uma negativa ampla para “quântica” sem dados de custo e
  ativação do termo específico.

## Lista de negativas preparada para aprovação

Aplicar, se aprovada, como correspondência exata ou de frase restrita. Não usar
os substantivos isolados como negativa ampla.

| Candidato | Correspondência proposta | Justificativa |
|---|---|---|
| `exercicios associação de resistores` | exata | eletricidade, fora de termodinâmica |
| `questões de resistores` | exata | eletricidade, fora de termodinâmica |
| `questões de ondulatoria` | exata | ondulatória, fora de termodinâmica |
| `exercícios de potência mecânica` | exata | mecânica, fora do escopo anunciado |
| `onee 2026` | exata | busca por evento/competição, não pelo livro |
| `ptiet` | exata | termo sem relação identificável com o TERMO |
| `física mecânica pdf` | exata | procura material de mecânica |
| `fisica quantica como estudar` | exata | procura física quântica, não termodinâmica |

Não incluir como negativas amplas: `resistores`, `ondulatória`, `mecânica`,
`quântica` ou `phet`. A forma exata protege contra bloqueios acidentais de
consultas compostas que possam ser relevantes.

## Google Pesquisa versus parceiros de pesquisa

No período de 30 dias, a leitura por rede mostrou aproximadamente:

| Rede | Participação nas conversões | Participação no custo | CPC médio | Custo por conversão estimado |
|---|---:|---:|---:|---:|
| Google Pesquisa | 58,2% | 75,7% | €0,17 | €0,91 |
| Parceiros de pesquisa | 41,8% | 24,3% | €0,04 | €0,41 |

Os custos por conversão foram estimados a partir das participações arredondadas
exibidas pelo Google Ads e dos totais de €99,13 e 141 conversões. Parceiros de
pesquisa aparentam ser cerca de duas vezes mais eficientes; não há evidência
para desativá-los agora.

## Estrutura recomendada para uma etapa posterior

A campanha tem apenas um grupo ativo (`Ad group 1`). Quando houver volume
suficiente, a estrutura deve ser testada em três grupos, sem mudar orçamento e
criativo no mesmo dia:

1. conceitos, leis e entropia;
2. exercícios, listas e questões;
3. simuladores e laboratório virtual.

Essa separação permitiria anúncios e páginas de destino mais coerentes com a
intenção. Ela não foi aplicada nesta change porque seria uma alteração de
campanha, não uma análise de qualidade dos termos.

## Decisão recomendada

1. Aprovar ou rejeitar individualmente as oito negativas exatas propostas.
2. Não bloquear `física`, `phet`, termoquímica ou temas térmicos próximos.
3. Manter parceiros de pesquisa e acompanhar custo por ativação por rede.
4. Levar a separação em três grupos para a C9, preservando um período anterior
   para comparação.

## Limitações

- o Google Ads oculta parte das consultas em “outros termos de pesquisa”;
- conversão no Ads corresponde à ação primária configurada, não necessariamente
  a aprendizado profundo;
- as participações por rede são arredondadas e, portanto, os custos por
  conversão de rede são aproximações;
- nenhuma negativa foi aplicada, logo não existe impacto em entrega nesta C8.
