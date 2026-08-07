# Plano mestre da campanha Google Ads — TERMO

Atualizado em: 1º de agosto de 2026  
Campanha: `TERMO - Search - BR - PT`

Este documento é o checklist oficial de medição, revisão e otimização da campanha. Alterações relevantes devem ser registradas aqui com a respectiva data.

## Próximo retorno ao Codex

- **03/08/2026:** voltar para uma verificação técnica curta da campanha e do recebimento das novas conversões.
- **07/08/2026:** voltar para a primeira análise de desempenho após as mudanças de 29/07 e 01/08.
- **14/08/2026:** voltar para a análise completa de aproximadamente 14 dias.

Até 03/08, não alterar orçamento, lances, palavras-chave, anúncios, parceiros de pesquisa ou metas de conversão.

## Situação e histórico

| Data | Tarefa | Situação |
|---|---|---|
| 29/07/2026 | Desativar a Rede de Display | Concluída |
| 29/07/2026 | Manter a campanha apenas em Pesquisa | Concluída |
| 29/07/2026 | Manter parceiros de pesquisa temporariamente | Avaliar em 07/08 |
| 29/07/2026 | Passar conversões de visualização de página para secundárias | Concluída |
| 29/07/2026 | Manter a estratégia `Maximizar cliques` | Concluída |
| 29/07/2026 | Revisar palavras-chave e correspondências | Primeira revisão concluída |
| 29/07/2026 | Adicionar palavras-chave negativas | Primeira revisão concluída |
| 29/07/2026 | Manter pesquisas sobre processos endotérmicos e exotérmicos | Concluída por decisão editorial |
| 31/07/2026 | Criar eventos reais de utilização do app | Concluída |
| 31/07/2026 | Testar eventos em tempo real no GA4 | Concluída |
| 01/08/2026 | Marcar eventos principais no GA4 | Concluída |
| 01/08/2026 | Importar conversões no Google Ads | Concluída |
| 01/08/2026 | Configurar ações primárias e secundárias | Concluída para os três eventos do TERMO |
| 01/08/2026 | Passar `YouTube channel subscriptions` para secundária | Concluída |
| 01/08/2026 | Confirmar uso da meta `Engagement` pelas campanhas | Concluída — meta padrão da conta usada por 4 campanhas |
| 01/08/2026 | Confirmar `study_activation` como única ação primária de Engagement | Concluída |
| 01/08/2026 | Confirmar `chapter_start` e `exercise_start` como secundárias | Concluída |
| 01/08/2026 | Confirmar contagem `One` e ausência de valor nos novos eventos | Concluída durante a criação |
| 03/08/2026 | Confirmar processamento e saúde da campanha | Agendada |
| 03/08/2026 | Confirmar recebimento das novas conversões | Concluída — 8 `study_activation`, 9 `chapter_start` e 2 `exercise_start` no período 01–03/08 |
| 03/08/2026 | Retirar a meta antiga `Page view` dos objetivos padrão da conta | Concluída — `0 of 4` campanhas; aviso interno pode permanecer por não haver ação primária |
| 03/08/2026 | Verificar desempenho e redes no período 01–03/08 | Concluída — 2.359 impressões, 57 cliques, CTR 2,42%, CPC €0,22 e custo €12,29 |
| 03/08/2026 | Confirmar exclusão da Rede de Display | Concluída — relatório contém apenas Pesquisa Google e parceiros de pesquisa |
| 03/08/2026 | Avaliar parceiros de pesquisa preliminarmente | Manter até 07/08 — 20 cliques por €1,14, CPC médio €0,06 |
| 05/08/2026 | Leitura intermediária de tráfego | Concluída — 3.176 impressões, 83 cliques, CTR 2,61%, CPC €0,21 e custo €17,78; dia 05 ainda parcial às 08h29 |
| 05/08/2026 | Conferir conversões no Google Ads no acumulado 01–05/08 | Concluída — 11 `study_activation`, 12 `chapter_start`, 2 `exercise_start` |
| 05/08/2026 | Conferir eventos no GA4 no acumulado 01–05/08 | Pendente |
| 03/08/2026 | Verificar aquisição e uso no GA4 | Concluída — 45 usuários ativos, 42 novos, 38 sessões `google / cpc`, 39 usuários com `termo_open_app` |
| 03/08/2026 | Reconciliar eventos novos entre Google Ads e GA4 | Concluída — GA4: 10/16/5 eventos; Ads atribuiu 8/9/2 conversões |
| 07/08/2026 | Primeira análise após as mudanças | Agendada |
| 14/08/2026 | Análise completa de aproximadamente 14 dias | Agendada |
| 31/08/2026 | Revisão mensal e decisão de escala | Agendada |

## 1º de agosto — configuração de medição

### Marcar eventos no GA4

Caminho: `Administrador → Exibição de dados → Eventos → Eventos recentes`.

Marcar como eventos principais:

- `study_activation`
- `chapter_start`
- `exercise_start`

Não marcar:

- `page_view`
- `session_start`
- `first_visit`
- `scroll`
- `click`
- `user_engagement`
- `termo_open_app`
- eventos antigos `ads_conversion_Page_view...`

### Testar os eventos

1. Abrir o app.
2. Abrir um capítulo.
3. Gerar um exercício.
4. Conferir no relatório em tempo real do GA4.

Eventos esperados:

- `termo_open_app`
- `chapter_start`
- `exercise_start`
- `study_activation`

O evento central para avaliação da campanha é `study_activation`.

### Importar para o Google Ads

Caminho: `Metas → Conversões → Resumo → Criar ação de conversão → Importar → Google Analytics 4 → Web`.

Importar:

- `study_activation`
- `chapter_start`
- `exercise_start`

Se ainda não estiverem disponíveis, aguardar até 03/08. Não recriar os eventos com outros nomes.

### Hierarquia das conversões

#### `study_activation`

- Otimização: **primária**
- Contagem: **uma**
- Valor: sem valor por enquanto
- Janela: 30 dias
- Atribuição: orientada por dados, quando disponível

#### `chapter_start`

- Otimização: **secundária**
- Contagem: **uma**
- Uso: observação

#### `exercise_start`

- Otimização: **secundária**
- Contagem: **uma**
- Uso: observação

Permanecem secundárias:

- `termo_open_app`
- visualizações de página
- qualquer conversão antiga baseada em `page_view`

### Não alterar em 01/08

- orçamento;
- estratégia `Maximizar cliques`;
- CPC máximo;
- segmentação geográfica;
- horários;
- palavras-chave;
- negativas;
- parceiros de pesquisa;
- anúncios;
- AI Max;
- inclusões de URL;
- campanha de Máximo Desempenho.

### Anotação de corte

> 01/08/2026 — Eventos reais de ativação configurados: `study_activation` como objetivo principal; `chapter_start` e `exercise_start` como objetivos secundários. Page views permanecem secundárias. Rede de Display já desativada.

## 2 de agosto — somente monitoramento

Não é necessário voltar ao Codex, salvo se aparecer alerta crítico. Não realizar mudanças. Confirmar apenas:

- campanha elegível;
- saldo disponível;
- ausência de anúncios reprovados;
- impressões e cliques continuam chegando;
- ausência de alertas críticos.

## 3 de agosto — revisão curta

**Voltar ao Codex nesta data e enviar capturas da tela de conversões e do resumo da campanha.**

- confirmar que as três conversões aparecem no Google Ads;
- confirmar `study_activation` como primária;
- confirmar `chapter_start` e `exercise_start` como secundárias;
- conferir se o objetivo deixou de aparecer como mal configurado;
- confirmar a estratégia `Maximizar cliques`;
- verificar impressões, cliques, CTR, CPC e custo desde 01/08;
- verificar eventos provenientes de `google / cpc`;
- confirmar que a Rede de Display continua desativada;
- testar a página de destino;
- verificar termos de pesquisa evidentemente inadequados.

### Resultado parcial de 03/08

- `study_activation`: ativa, primária, 8 conversões;
- `chapter_start`: ativa, secundária, 9 conversões;
- `exercise_start`: ativa, secundária, 2 conversões;
- `YouTube channel subscriptions`: secundária;
- meta `Engagement`: ativa e usada pelas 4 campanhas como objetivo padrão;
- meta antiga `Page view`: retirada dos objetivos padrão (`0 of 4` campanhas); continua secundária e pode exibir `Misconfigured` apenas por não possuir ação primária, sem afetar a campanha.
- campanha: 2.359 impressões, 57 cliques, CTR 2,42%, CPC médio €0,22 e custo €12,29;
- Pesquisa Google: 37 cliques, custo €11,15 e CPC médio €0,30;
- parceiros de pesquisa: 20 cliques, custo €1,14 e CPC médio €0,06;
- Rede de Display: ausente, confirmando a desativação;
- dispositivos: 53 dos 57 cliques vieram de celulares; não fazer ajuste de lance com apenas três dias;
- decisão: nenhuma mudança estratégica em 03/08; manter parceiros, palavras-chave, orçamento e `Maximizar cliques` até a revisão de 07/08.
- GA4: 45 usuários ativos, 42 novos usuários, 50 s de engajamento médio e 403 eventos;
- aquisição GA4: 37 usuários cuja primeira origem/mídia foi `google / cpc` e 38 sessões `google / cpc`;
- abertura do app: 84 ocorrências de `termo_open_app` entre 39 usuários;
- eventos no GA4: `study_activation` 10 eventos/10 usuários; `chapter_start` 16 eventos/10 usuários; `exercise_start` 5 eventos/4 usuários;
- atribuição no Google Ads: 8 `study_activation`, 9 `chapter_start` e 2 `exercise_start`; a diferença para o GA4 é esperada porque o Ads contabiliza somente a parcela atribuída à publicidade;
- custo por `study_activation` atribuído preliminar: €12,29 / 8 = **€1,54**;
- taxa preliminar clique → `study_activation` atribuído: 8 / 57 = **14,0%**;
- entre os 39 usuários com `termo_open_app`, 10 chegaram a `study_activation` ou `chapter_start` (25,6%) e 4 iniciaram exercício (10,3%);
- revisão técnica de 03/08 concluída; próxima decisão de otimização em 07/08.

Adicionar negativas somente para pesquisas inequivocamente irrelevantes.

## 7 de agosto — primeira análise pós-mudanças

**Voltar ao Codex nesta data com os relatórios atualizados do período de 01/08 a 07/08.**

### Leitura intermediária de 05/08

- acumulado 01–05/08 às 08h29: 3.176 impressões, 83 cliques, CTR 2,61%, CPC médio €0,21 e custo €17,78;
- 04/08: 530 impressões, 21 cliques, CTR 3,96%, CPC €0,22 e custo €4,53;
- Pesquisa Google: 57 cliques, custo €16,26 e CPC €0,29;
- parceiros de pesquisa: 26 cliques, custo €1,52 e CPC €0,06;
- celulares: 79 de 83 cliques e €17,44 de €17,78 de custo;
- Rede de Display continua ausente;
- consultas majoritariamente coerentes com termodinâmica; observar até 07/08 consultas em inglês e buscas genéricas por PDF/ensino médio antes de decidir negativas;
- não alterar a campanha em 05/08 sem confirmar a evolução de `study_activation`.
- Google Ads 01–05/08: 11 `study_activation`, 12 `chapter_start` e 2 `exercise_start` atribuídos;
- custo por `study_activation` acumulado: €17,78 / 11 = **€1,62**;
- taxa clique → `study_activation` atribuída: 11 / 83 = **13,3%**;
- incremento desde o corte de 03/08: +26 cliques, +€5,49, +3 `study_activation`, +3 `chapter_start` e nenhum novo `exercise_start` atribuído;
- custo incremental por nova ativação: €5,49 / 3 = **€1,83**;
- leitura: ativação central continua crescendo; início de exercícios ficou estável e será investigado com GA4 e mais dados em 07/08.

### Leitura intermediária do GA4 em 06/08

Período observado: 01/08 a 06/08, com 06/08 ainda parcial.

- Usuários totais: 112; eventos totais: 1.019.
- `page_view`: 217 eventos, 110 usuários.
- `termo_open_app`: 208 eventos, 99 usuários.
- `user_engagement`: 128 eventos, 58 usuários.
- `session_start`: 118 eventos, 109 usuários.
- `first_visit`: 107 eventos, 106 usuários.
- `scroll`: 62 eventos, 28 usuários.
- `chapter_start`: 31 eventos, 21 usuários.
- `study_activation`: 22 eventos, 21 usuários.
- `exercise_start`: 8 eventos, 6 usuários.
- `simulator_start`: 1 evento, 1 usuário.
- `click`: 2 eventos, 2 usuários; `file_download`: 2 eventos, 2 usuários.

Funil aproximado usando `termo_open_app` como base:

- abertura do app: 99 de 112 usuários (88,4%);
- ativação de estudo: 21 de 99 (21,2%);
- início de capítulo: 21 de 99 (21,2%);
- início de exercício: 6 de 99 (6,1%);
- início de simulador: 1 de 99 (1,0%).

Comparação com o corte de 01–03/08:

- usuários totais: 45 → 112 (+67);
- `study_activation`: 10 → 22 eventos; 10 → 21 usuários;
- `chapter_start`: 16 → 31 eventos; 10 → 21 usuários;
- `exercise_start`: 5 → 8 eventos; 4 → 6 usuários;
- `simulator_start`: permaneceu em 1 evento e 1 usuário.

Leitura operacional:

- a medição de exercícios e simuladores está funcionando;
- existe uso real de exercícios, mas ainda baixo em relação às aberturas do app;
- o uso de simuladores está praticamente parado e deve ser investigado na experiência do produto;
- esses eventos medem o início do recurso, não a conclusão do exercício nem o tempo/interação dentro do simulador;
- não alterar a campanha antes da revisão completa de 07/08, salvo falha técnica.

### Relatórios do Google Ads

- termos de pesquisa;
- palavras-chave;
- redes;
- dispositivos;
- páginas de destino;
- dia e hora;
- localização;
- anúncios e recursos;
- conversões por ação;
- custo, cliques, impressões, CTR e CPC.

### Relatórios do GA4

- aquisição de tráfego;
- página de destino;
- eventos por origem/mídia;
- `termo_open_app`;
- `chapter_start`;
- `exercise_start`;
- `study_activation`;
- usuários e sessões engajadas;
- tempo médio de engajamento;
- páginas visitadas após a landing page.

### Ajustes possíveis, apenas se sustentados pelos dados

- adicionar negativas;
- pausar palavras-chave com gasto e nenhuma ativação;
- trocar ampla por frase ou exata;
- separar grupos por intenção;
- desativar parceiros de pesquisa;
- ajustar CPC máximo;
- corrigir títulos e descrições;
- adicionar destaques, snippets e sitelinks;
- melhorar a landing page.

## 14 de agosto — análise completa

### Indicadores principais

- custo por `study_activation`;
- proporção de cliques que gera `termo_open_app`;
- proporção de acessos que gera `chapter_start`;
- proporção de acessos que gera `exercise_start`;
- CTR de Pesquisa;
- CPC médio;
- relevância dos termos de pesquisa;
- retenção e profundidade de navegação;
- desempenho por dispositivo;
- desempenho por horário;
- desempenho por localização;
- diferença entre Google Search e parceiros.

### Decisões possíveis

- manter ou retirar parceiros de pesquisa;
- aumentar ou reduzir orçamento;
- criar grupos por intenção;
- criar anúncios específicos;
- criar páginas de destino específicas;
- avaliar uma estratégia baseada em conversões.

Não mudar para `Maximizar conversões` apenas porque o evento foi criado. A mudança depende de volume consistente de `study_activation`.

## 31 de agosto — revisão mensal

- identificar temas que merecem mais orçamento;
- pausar palavras com baixa qualidade;
- comparar anúncios;
- avaliar um segundo anúncio responsivo;
- avaliar campanhas ou grupos separados;
- decidir se o orçamento pode crescer;
- verificar volume suficiente para `Maximizar conversões`;
- avaliar remarketing em campanha separada;
- avaliar novas páginas de destino.

## Regra operacional

Não realizar várias mudanças estratégicas simultaneamente. Registrar cada alteração importante com data, motivo e resultado esperado, para preservar a capacidade de atribuir os efeitos observados.
