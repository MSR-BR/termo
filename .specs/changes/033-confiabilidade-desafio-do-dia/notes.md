# Notas e decisões — Change 033

## Premissas

- O registro editorial e `data/capitulo-*.json` continuam sendo as fontes canônicas para capítulos e itens publicados.
- A contingência é uma proteção rara; a geração Gemini continua sendo a experiência principal.
- O desafio deve continuar valendo uma única resposta e usar o fluxo de submissão e pontos existente.

## Decisões

- Não foi criado novo acesso ao Supabase nem nova persistência remota.
- O fallback é assinado pelo mesmo mecanismo dos quizzes IA, permitindo correção normal no servidor sem confiar no navegador.
- A contingência usa descrição somente quando ela passa no contrato matemático; caso contrário, usa o título publicado.
- O log não inclui prompt, pergunta, alternativas, explicação, token, usuário ou credenciais.
- A falha total recebe intervalo de 60 segundos no navegador para evitar repetição imediata; o estudo continua acessível.
- A origem da pergunta é preservada no estado do desafio para que o aviso ao estudante seja verdadeiro.

## Decisões humanas pendentes

- Repetir oportunamente a jornada visual completa com uma sessão autenticada real no domínio canônico; o contrato funcional da geração já foi validado em produção.

## Status de publicação

- Commit funcional: `d88ed9a` (`fix: make daily challenge resilient`).
- Push: enviado a `origin/main` em 2026-09-13.
- Deploy: produção `dpl_BdKtJR2KMb7SPAt4hMXKLfS8TpMy`, estado `Ready`, aliases `termo.app.br` e `termo-theta.vercel.app`.
- Validação pós-deploy: `GET /api/chapter-quiz?chapterId=01&stage=daily-challenge` respondeu `200`, com uma pergunta, token assinado e fonte `ai_generated_on_demand`; nenhuma resposta 5xx foi encontrada nos logs da janela de publicação.
- Estado local: implementado e validado.
