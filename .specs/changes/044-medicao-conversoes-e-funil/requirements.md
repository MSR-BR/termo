# Requisitos — Change 044

## Funcionais

- [x] Inventariar eventos do cliente, GA4 e Google Ads, incluindo os quatro
  status de conversão ativos e os links incompletos observados.
- [x] Definir eventos estáveis, sem PII, para as etapas pedagógicas relevantes.
- [x] Substituir a interpretação do funil rígido por jornadas abertas e paralelas documentadas.
- [x] Declarar quais eventos são informativos, eventos-chave e conversões de Ads.
- [x] Validar por testes os contratos anônimo e autenticado; administração usa o mesmo contrato GA4.

## Rota planejada

- Classe da tarefa: instrumentação, conversão publicitária e funil de produto.
- Modelo: `gpt-5.6-sol / high`.
- Justificativa: envolve integridade de dados, privacidade e configuração
  externa potencialmente irreversível.
- Fallback: `gpt-5.6-terra / high`.
- Dependência: T43 concluída para que URLs de origem não fragmentem métricas.
