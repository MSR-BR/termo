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

- Autorizar ou não commit, push e deploy.
- Após publicação, executar uma jornada autenticada real no domínio canônico.

## Status de publicação

- Commit: não realizado.
- Push: não realizado.
- Deploy: não realizado.
- Estado local: implementado e validado.
