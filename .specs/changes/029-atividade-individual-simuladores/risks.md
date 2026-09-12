# Riscos — Change 029

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| Um usuário ler atividade de outro | baixa/alta | RLS por `auth.uid()`, privilégio mínimo e pgTAP | teste cruzado entre dois usuários |
| Visitante gerar dado identificável | baixa/alta | sem grant para `anon` e guarda de sessão no cliente/função | teste anônimo sem RPC |
| Contagem perder incrementos concorrentes | baixa/média | `insert ... on conflict do update` atômico | teste de incremento e inspeção SQL |
| Escrita privilegiada ficar pública | baixa/alta | revoke de `PUBLIC` e `anon`, grant explícito | teste de privilégios da função |
| Falha do banco bloquear simulador | baixa/alta | listener não cancela clique nem aguarda RPC | teste estrutural de nova aba |
| Abertura virar ponto sem regra pedagógica | baixa/média | fluxo separado da gamificação | teste de ausência de chamadas de pontos |
| Deploy antes da migration | média/média | CPD bloqueado até aplicação e teste remoto | checklist e validação pendentes |

## Riscos que impedem conclusão remota

- A migration ainda não foi aplicada ao Supabase TERMO.
- O teste pgTAP depende de uma pilha local Supabase ou da autorização para testar
  o projeto correto.
