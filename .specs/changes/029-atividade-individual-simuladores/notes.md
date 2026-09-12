# Notas e decisões — Change 029

- Rota planejada: `gpt-5.6-sol / medium`.
- Fallback permitido: `gpt-5.6-sol / high`.
- Modelo e reasoning efetivamente usados: não expostos pelo ambiente.
- Fallback observado: não exposto.
- Tokens, custo e latência: não medidos.
- A tabela usa uma linha por usuário e simulador para evitar histórico detalhado
  excessivo e minimizar dados pessoais.
- A função de incremento não recebe `user_id`; deriva a identidade de `auth.uid()`.
- O cliente autenticado lê diretamente com RLS, mas não recebe grants diretos de
  inserção, atualização ou exclusão.
- O registro ocorre no clique do catálogo/jornada e nunca impede a abertura da
  nova aba quando Supabase, sessão ou rede falham.
- O GA4 continua independente e não foi modificado.
- Status de publicação: implementação local; sem commit, push, deploy ou mutation
  remota do Supabase.
- Decisão humana pendente: autorizar aplicação da migration e validação no projeto
  Supabase TERMO antes do CPD.
