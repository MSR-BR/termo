# Riscos — Change 033

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| Gemini repetir matemática inválida | média/médio | uma correção limitada e fallback determinístico | teste com duas respostas inválidas retorna contingência |
| Contingência inventar conteúdo | baixa/alto | usar somente `id`, `title`, `note` e `url` publicados | revisão do objeto assinado e URL física |
| Capítulo 5 entrar no fluxo | baixa/alto | lista ativa deriva do registry editorial | teste negativo explícito para capítulo 05 |
| Fallback não poder ser corrigido pelo servidor | baixa/alto | manter quiz completo dentro do token assinado | abertura do token validada nos testes |
| Log expor resposta do Gemini | baixa/alto | registrar apenas capítulo, modalidade, modelo e códigos | teste confirma ausência da fórmula defeituosa no log |
| Repetição gerar custo em sequência | média/médio | contingência imediata e intervalo local de 60 segundos para falha total | inspeção da chave e do botão desabilitado |
| Alterar simulados completos | baixa/alto | contagem variável somente para `daily-challenge` | smoke continua produzindo cinco questões |

## Riscos que impedem conclusão

- Nenhum risco bloqueia a implementação local.
- Publicação e teste autenticado em produção permanecem dependentes de autorização explícita.
