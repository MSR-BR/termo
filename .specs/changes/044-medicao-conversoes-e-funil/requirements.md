# Requisitos — Change 044

## Funcionais

- [ ] Inventariar eventos do cliente, GA4 e Google Ads, incluindo os quatro
  status de conversão ativos e os links incompletos observados.
- [ ] Definir eventos estáveis, sem PII, para as etapas pedagógicas relevantes.
- [ ] Corrigir ou substituir o funil rígido somente com uma definição aprovada.
- [ ] Declarar quais eventos são informativos, eventos-chave e conversões de Ads.
- [ ] Validar disparos em visita anônima, autenticada e administrativa.

## Rota planejada

- Classe da tarefa: instrumentação, conversão publicitária e funil de produto.
- Modelo: `gpt-5.6-sol / high`.
- Justificativa: envolve integridade de dados, privacidade e configuração
  externa potencialmente irreversível.
- Fallback: `gpt-5.6-terra / high`.
- Dependência: T43 concluída para que URLs de origem não fragmentem métricas.
