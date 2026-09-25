# Arquivos — Change 054

## Previstos

- plano de avaliação, dicionário de métricas e relatório;
- instrumentação de fidelidade estritamente necessária;
- preferências e templates de comunicação, se autorizados;
- painel administrativo agregado e testes de consentimento.

## Executados

- `data/termo-evaluation-communication-policy-v1.json`
- `docs/architecture/termo-evaluation-communication-v1.md`
- `scripts/validate-termo-evaluation-policy.mjs`
- `lib/learning-evaluation-report-handler.mjs`
- rota `/api/learning-evaluation-report`, consolidada em
  `api/gamification-profile.js` por limite de funções do plano Hobby;
- `lib/legal-preferences-handler.mjs`
- `lib/email-campaign-handler.mjs`
- `lib/email-unsubscribe-handler.mjs`
- rota `/api/email-unsubscribe`, consolidada em `api/legal-preferences.js` por
  limite de funções do plano Hobby;
- `unsubscribe.html`
- `assets/termo-auth.js`
- `index.html`
- `privacidade.html`
- `robots.txt`
- `vercel.json`
- `supabase/migrations/20260925181046_termo_evaluation_communication_v1.sql`
- testes de política, relatório, consentimento, pausa, descadastro e campanha.

## Não modificar

- orçamento e campanhas de Ads sem autorização;
- regras pedagógicas de T52 durante a análise;
- dados individuais expostos publicamente.
