# Riscos — Change 049

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| Repetições excessivas sobrecarregarem o endpoint | baixa/baixa | três tentativas limitadas e deduplicação da promessa em andamento | teste de contagem de chamadas |
| Falha transitória continuar memorizada | média/alta | não gravar falha em `state.config` e liberar `configPromise` | teste falha total seguido de recuperação |
| Nova tentativa não reiniciar autenticação | média/alta | reiniciar bootstrap somente quando o cliente ainda não existe | teste e inspeção do fluxo |
| Duplicar listener Supabase | baixa/média | preservar `authListenerRegistered` e reutilizar cliente existente | revisão de código |
| Mensagem expor detalhes técnicos ao público | média/média | texto neutro, sem nomes de variáveis ou fornecedores | validação visual |
| Alterar OAuth ou callback inadvertidamente | baixa/alta | não modificar `AUTH_SITE_URL` nem configuração remota | diff restrito |

## Riscos que impedem conclusão

- Regressão observável no login ou nos estados autenticados.
