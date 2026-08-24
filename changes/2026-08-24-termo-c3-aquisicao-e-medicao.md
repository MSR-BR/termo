# Change Plan: TERMO C3 — Aquisição eficiente e medição de estudo

## Objetivo

Reduzir o custo mensal de aquisição sem otimizar apenas cliques. A campanha deve
passar a favorecer a entrada que leva a estudo real: abrir o Capítulo 1,
iniciar um capítulo e gerar um exercício. Simulados continuam sendo uma etapa
posterior, desbloqueada pelo progresso; não serão a conversão principal.

## Evidência de partida

Período observado: Google Ads de 1 a 24 de agosto de 2026 e GA4 de 27 de julho
a 23 de agosto de 2026.

- Ads: €92,63, 735 cliques, CTR de 2,00% e CPC médio de aproximadamente €0,13.
- 85,6% dos cliques e 89,8% do custo vieram de celulares.
- A Pesquisa Google trouxe 398 cliques por €76,13; parceiros de pesquisa,
 337 cliques por €16,50. Ainda não há conversão confiável por rede.
- GA4: 750 usuários ativos, 743 novos, 41 recorrentes e engajamento médio de
  38 s. A retenção por coorte é baixa.
- A home concentra 719 de 847 sessões de entrada, mas tem 31 s de engajamento
  médio. O Capítulo 1 recebe muito menos visitas, com melhor sinal de interesse.
- Os relatórios de termos mostram 0 conversões. O evento atual de Ads não pode
  ser usado para decidir lances até que sua definição seja auditada.

## C3-A — Controle de custo no Google Ads

Alterações na conta, em ordem:

1. Reduzir o orçamento diário de €4,00 para **€2,50/dia** (teto aproximado de
   €75/mês). Não aumentar orçamento enquanto a qualidade de ativação não estiver
   comprovada.
2. Adicionar `phet` como palavra-chave negativa de frase. O termo gastou cerca
   de €4,35 em 27 cliques e não representa o fluxo principal do TERMO.
3. Manter celular ativo. Não fazer ajuste de lance por dispositivo neste estágio.
4. Conferir localização como **Presença: pessoas que estão ou costumam estar no
   Brasil**. Corrigir somente se a configuração atual for diferente.
5. Manter os parceiros de pesquisa temporariamente. Comparar conversões de
   estudo por rede antes de desligá-los, pois eles têm CPC bem menor mas ainda
   não têm qualidade medida.
6. Depois de duas semanas com conversões válidas, separar palavras-chave em três
   grupos: exercícios resolvidos; estudo/leis; simulados. Converter termos
   genéricos restantes para correspondência de frase ou exata quando houver
   evidência de baixa ativação.

## C3-B — Conversão no GA4 e no Google Ads

1. Auditar a definição da conversão Google Ads hoje rotulada como
   `study_activation` / `ads_conversion_*`; ela não deve contar meramente uma
   página aberta ou clique de anúncio.
2. Criar/validar no GA4 os eventos de funil sem PII:
   `home_study_cta_click`, `chapter_start`, `exercise_generate_success`,
   `login_success` e `simulator_start`.
3. Marcar **study_activation** como evento-chave apenas se for emitido após
   `chapter_start` ou `exercise_generate_success`, com uma janela de deduplicação
   curta. Ele será a conversão primária inicial da campanha.
4. Importar essa conversão para Google Ads e só então testar a troca de
   "Maximizar cliques" para "Maximizar conversões". Não trocar a estratégia antes
   de haver volume suficiente de ativações válidas.
5. Não usar `simulator_start` como conversão primária: os simulados dependem de
   progresso e não devem ser exigidos de um aluno novo.

## O que pode ser automatizado no repositório

- Conferir e preservar a taxonomia de eventos do funil.
- Ajustar a home para explicar o caminho capítulo → exercícios IA → simulados
  desbloqueados, sem redesenhar a página.
- Criar verificações para impedir que eventos de analytics levem e-mail, nome ou
  outro dado pessoal.

## Dependências externas

- Acesso à conta Google Ads para orçamento, negativas, localização, conversões
  e estratégia de lances.
- Acesso ao GA4 para marcar evento-chave, vincular/importar conversão e criar a
  exploração do funil.

## Validação

- O orçamento exibido no Ads é €2,50/dia.
- A negativa `phet` aparece na lista da campanha.
- Um clique no CTA da home, entrada no Capítulo 1 e geração bem-sucedida de
  exercício aparecem no DebugView/GA4 sem PII.
- Após 14 dias, há relatório por rede, palavra-chave e termo com a conversão de
  estudo; só então se decide sobre parceiros e lances.

## Riscos a evitar

- reduzir investimento por CTR, CPC ou geração de simulados isoladamente;
- trocar a estratégia de lances antes de a conversão ser confiável;
- negativar temas próximos sem relatório de ativação;
- exportar ou enviar PII para GA4/Ads.
