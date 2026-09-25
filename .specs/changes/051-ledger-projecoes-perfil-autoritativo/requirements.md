# Requisitos — Change 051

## Funcionais

- [x] Auditar schema, dados, funções, grants, RLS, índices e Data API reais no remoto.
- [x] Criar ledger versionado e projeções reconciliáveis.
- [x] Garantir idempotência e transação única para evento e profile.
- [x] Entregar snapshot de profile único, versionado e consistente.
- [x] Entregar reconciliação em dry run e relatório de contagem; execução remota pendente.

## Segurança

- [x] Confirmar organização, projeto e ref exatos antes de qualquer mutação.
- [x] Derivar usuário da sessão; não aceitar identidade autoritativa do cliente.
- [x] Não expor `service_role` nem usar `user_metadata` para autorização.
- [x] Testar grants separadamente de RLS para anônimo, próprio, outro e serviço em stack local; inventariar grants e policies no remoto.

## Rota planejada

- Classe: banco, segurança e migração transversal.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `xhigh`.
- Fallback: `gpt-5.6-sol / high`; `gpt-5.5 / xhigh` somente se disponível e necessário.
- Gatilho: inconsistência de histórico, autorização ou atomicidade.
