# Requisitos — Change 045

## Funcionais

- [ ] Exportar e classificar termos de pesquisa por relevância editorial.
- [ ] Propor negativas e mudanças de correspondência como lista revisável.
- [ ] Revisar anúncio, extensões e URL final depois da T43.
- [ ] Não alterar orçamento de €2/dia, saldo ou lances sem consentimento no ato.
- [ ] Comparar 28 dias antes/depois, evitando decisão por poucos dias.

## Rota planejada

- Classe da tarefa: otimização de aquisição paga baseada em dados.
- Modelo: `gpt-5.6-terra / high`.
- Justificativa: requer análise de termos e redação precisa, com mudança
  financeira somente sob confirmação humana.
- Fallback: `gpt-5.6-sol / high`.
