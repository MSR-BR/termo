# Objetivo — Change 049

Impedir que uma falha transitória ao carregar `/api/public-config` seja apresentada
como ausência permanente de configuração do login e permitir recuperação segura,
sem recarregar a página nem alterar credenciais ou infraestrutura.

## Classificação do projeto

`INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP`

## Limites

- Fora do escopo: mudar variáveis Vercel, Supabase, OAuth, RLS, banco ou domínio de callback.
- Dependências: `/api/public-config`, `assets/termo-auth.js` e as áreas autenticadas de `index.html`.
- Decisões humanas necessárias: commit, push e deploy continuam dependentes de autorização explícita.
