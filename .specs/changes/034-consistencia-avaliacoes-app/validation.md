# Validação — Change 034

## Gates planejados

- [x] `node --check` nos arquivos JavaScript alterados.
- [x] `npm run test:ratings`.
- [x] `npm run test:analytics`.
- [x] `npm run test:gamification`.
- [x] `npm run check`.
- [x] confirmar que nenhuma migração foi criada ou alterada.
- [x] revisar ausência de dados pessoais e segredos no diff.
- [x] testar visualmente estados autenticado, não autenticado, já avaliado e falha controlada quando disponíveis.
- [x] testar teclado, foco, desktop e mobile.
- [x] `git diff --check`.
- [x] pós-deploy: endpoint anônimo negado, assets atualizados e ausência de 5xx.

## Evidência de execução

- Data: 2026-09-13.
- Estado inicial: `main...origin/main`, sem alterações locais após o fechamento da T33.
- Changelog Supabase revisado antes da edição; a change não depende das alterações recentes de Data API nem exige DDL.
- Documentação atual confirma que a sessão do cliente serve para encaminhar o access token, mas a identidade deve ser validada no servidor com `getUser`/endpoint Auth.
- Testes específicos: 12/12 aprovados, cobrindo autenticação, hash estável por conta, separação entre contas, minimização do payload, consulta individual, administração, schema e textos.
- Regressões: Analytics 7/7, gamificação 13/13, editorial 6/6, manifesto de fontes IA 12/12, SEO 7/7 e simuladores 6/6 aprovados.
- Conteúdo: `npm run check` validou 6 capítulos, 61 seções públicas e 43 seções elegíveis para IA.
- Banco: nenhum arquivo em `supabase/migrations` foi criado ou alterado; RLS, revogações públicas e índice único atuais foram cobertos por teste.
- Segurança: o payload persistido contém somente o hash HMAC e os campos da avaliação; identificadores brutos, nome, e-mail e token não são gravados. As únicas strings semelhantes a credenciais no diff são valores fictícios em testes.
- Navegador: app local carregou sem overlay, aviso ou erro de console. Um harness temporário, removido após a validação, confirmou diálogo em desktop e 390 px sem overflow, foco e envio por teclado, supressão para conta já avaliada, intervalo após falha e ausência de repetição após sucesso.
- Publicação: commit funcional `161eb7b` enviado a `origin/main`; deploy Vercel `dpl_FbeVb4GcF5grcsgNjXM21kL9gd6w` concluído como `Ready` e associado aos dois aliases públicos.
- Produção: `GET /api/app-rating?scope=status` sem sessão e POST anônimo retornaram `401`; `index.html`, `assets/termo-rating.js?v=0913.1` e a política com vigência em 13/09/2026 responderam `200` e contêm os novos contratos. Nenhuma resposta 5xx apareceu nos logs da janela de publicação.
- Limitação honesta: uma submissão autenticada real não foi feita para evitar criar ou alterar uma avaliação em nome do administrador; o caminho autenticado foi coberto por testes de contrato e pelo navegador com serviço controlado.

## Modelo realmente observado

- Modelo: `não exposto`.
- Reasoning: `não exposto`.
- Fallback utilizado: `não observado`.
- Tokens, latência e custo: `não medidos`.
