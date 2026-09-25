# Riscos — Change 050

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| Contrato divergir do runtime silenciosamente | média/alta | gaps explícitos e testes de cobertura | inventário e teste |
| Analytics ser confundido com aprendizagem | média/alta | efeito global sempre falso | teste do adapter |
| Conteúdo bloqueado entrar no adapter | baixa/alta | registry e fail-closed | teste do capítulo 5 |
| Documentação antiga parecer canônica | média/média | versão e referências explícitas | revisão do diff |
| T50 alterar produção por acidente | baixa/alta | diff limitado a contrato, docs e testes | lista de arquivos |

## Riscos que impedem conclusão

- Evento legado sem classificação.
- Gate local com falha.
- Qualquer alteração funcional ou remota não autorizada.
