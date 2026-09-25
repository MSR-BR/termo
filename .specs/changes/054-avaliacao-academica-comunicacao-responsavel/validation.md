# Validação — Change 054

## Gates planejados

- [x] qualidade e completude dos dados
- [x] validade de métricas e cálculos
- [x] privacidade, consentimento e unsubscribe
- [x] testes de elegibilidade/exposição/ação/opt-out
- [x] `npm run check`
- [x] testes de analytics e e-mail aplicáveis
- [x] `git diff --check`

## Evidência

- Estado: implementação e validação concluídas; migração remota aplicada e
  validada no projeto TERMO antes do deploy do cliente.
- `npm run check`: aprovado, inclusive contrato de avaliação/comunicação com
  6 mecânicas e 5 camadas de resultado.
- `npm run test:evaluation`: 19/19 testes aprovados.
- `npm run test:analytics`: 8/8 testes aprovados.
- Testes de contrato de gamificação: 5/5 aprovados.
- Testes do ledger: 9/9 aprovados.
- Testes adaptativos: 7/7 aprovados.
- Suíte integral após consolidação das funções Vercel:
  `node --test tests/*.test.mjs`: 122/122 aprovados.
- `git diff --check`: aprovado.
- Verificação visual local da página de descadastro:
  - sem erros ou avisos no console;
  - `noindex`, `nofollow`, `noarchive` e `no-referrer` presentes;
  - navegação por teclado com foco visível;
  - viewport de 375 × 812 sem rolagem horizontal;
  - botão e título visíveis.
- Rota administrativa solicitada sem sessão não revelou o painel nem dados e
  não produziu erros no console.
- Supabase pós-migração: 10/10 verificações aprovadas para schema, default,
  RLS, grants, índice único, integridade dos tokens e registro da migração.
- Security Advisor pós-migração: 0 erros. Dois avisos preexistentes, fora do
  escopo da T54, permanecem registrados (função legada de simulador e proteção
  contra senhas vazadas desabilitada).
- Gate de hospedagem: as duas novas rotas compartilham funções existentes e o
  projeto permanece dentro do limite de 12 funções do plano Vercel Hobby.
- Modelo real: `não exposto`.
