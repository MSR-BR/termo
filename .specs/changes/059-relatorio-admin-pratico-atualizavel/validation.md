# Validação

08/10/2026: npm run check aprovado; 142 testes aprovados (138 anteriores + 4 de apresentação). O teste antigo de política dependia de texto inline; adaptado ao módulo que agora renderiza o painel, mantendo a exigência de privacidade e limite causal.

Browser local Chromium com APIs interceptadas: 320/390/1280px, tabelas por teclado, texto 200%, refresh, primeiro erro/retry, erro após sucesso preservando HTML/horário e prevenção de concorrência. Nenhum envio de e-mail, chamada paga ou alteração remota durante testes.

Validações finais de diff, HTML/JS e produção serão registradas antes do fechamento.

Modelo real/reasoning: não expostos. Fallback: não observado. Tokens/latência: não medidos.
