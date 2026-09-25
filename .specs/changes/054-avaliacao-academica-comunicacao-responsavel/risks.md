# Riscos — Change 054

| Risco | Probabilidade/impacto | Controle | Evidência |
|---|---|---|---|
| Alegação causal indevida | média/alta | baseline, comparação e incerteza | política bloqueia conclusão causal sem baseline, retenção e transferência |
| Misturar uso e aprendizagem | média/alta | dicionário por camada | cinco camadas separadas no contrato e no painel |
| Comunicação coercitiva | baixa/alta | opt-in, limites e stop rules | testes rejeitam linguagem coercitiva, excesso e horário silencioso |
| Expor dado individual | baixa/crítica | agregação e autorização | endpoint administrativo agregado, com células abaixo de 5 suprimidas |
| Dados ausentes enviesarem conclusão | alta/média | registrar missingness e exposição | painel informa fontes incompletas e lacunas históricas |

## Limitações preservadas

- A fidelidade histórica de T51–T52 não pode ser inferida retroativamente onde
  faltam eventos de elegibilidade, exposição ou supressão de duplicidade.
- A T54 não autoriza envio: qualquer comunicação real continua condicionada a
  consentimento afirmativo, finalidade aprovada e revisão humana.
- A migração permanece somente local até autorização explícita de publicação.
