# Riscos

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| Código OAuth em URL enviada ao GA4 | Observado / alto | Lista positiva de parâmetros e remoção do fragmento | Teste do `page_location` e do `page_referrer` |
| Perda de atribuição de Ads | Médio / médio | Preservar parâmetros `utm_*`, `gclid`, `gbraid`, `wbraid` e correlatos | Teste de campanha e clique |
| URL do login limpa antes da troca de código | Baixo / alto | Alterar apenas o payload do GA4, não `window.location` | Teste confirma URL intacta e testes de autenticação passam |
| Outra medição automática enviar URL bruta | Desconhecido / alto | Conferência no GA4 depois de publicação autorizada | DebugView e relatório de páginas sem códigos temporários |

## Riscos que impedem conclusão

- A validação de dados reais no GA4 depende de publicação futura; não é possível comprovar remotamente nesta etapa.
