# Riscos

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| Teste alterar pontos reais | baixa/média | registrar baseline e usar repetição idempotente | total antes/depois e resposta da API |
| Confundir UI correta com integridade de dados | média/alta | confrontar resposta, ledger e projeção | contagens agregadas e teste idempotente |
| Expor sessão ou dados pessoais | baixa/alta | não registrar tokens, e-mails ou IDs | evidência redigida e diff sem segredos |
| Marcar leitor de tela como validado sem ferramenta real | média/média | separar inspeção semântica de teste assistivo real | limitação explícita |
| Reescrever histórico em vez de reconciliá-lo | baixa/média | preservar fatos datados e adicionar fechamento | diff documental auditável |

## Riscos que impedem conclusão

- Divergência não explicada entre ledger e perfil.
- Recompensa duplicada por repetição.
- Falha de autorização ou exposição de dados de outro usuário.
