# Requisitos — Change 042

## Funcionais

- [x] Consultar GA4 para aquisição, páginas, eventos e funil no mesmo período.
- [x] Consultar Google Ads para campanha TERMO, investimento, cliques,
  impressões, conversões e diagnósticos.
- [x] Consultar Search Console para desempenho orgânico, sitemap, indexação e
  Core Web Vitals.
- [x] Separar fatos observados, limitações de medição e recomendações.
- [x] Não executar nenhuma alteração nas plataformas externas.

## Segurança, privacidade e conteúdo

- [x] Preservar autenticação, autorização server-side e RLS aplicáveis.
- [x] Não expor segredos, dados pessoais, comentários de avaliação ou conteúdo privado.
- [x] Não tornar conteúdo bloqueado elegível para busca, SEO ou IA.

## Rota planejada

- Classe da tarefa: análise integrada de produto, aquisição e SEO, somente leitura.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Justificativa: exige reconciliação cuidadosa de métricas de fontes distintas,
  sem confundir clique pago, sessão, conversão técnica e aprendizagem.
- Fallback permitido: `gpt-5.6-terra / high`.
- Gatilhos de escalonamento: divergência material entre fontes, ausência de
  escopo temporal comparável ou necessidade de editar configurações externas.
- Fonte da disponibilidade: catálogo do ambiente Codex em 2026-09-20.
