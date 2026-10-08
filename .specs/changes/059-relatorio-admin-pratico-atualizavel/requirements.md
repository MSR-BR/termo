# Requisitos

- Atualizar somente a consulta autenticada GET existente, janela de 28 dias.
- Fonte Supabase explícita; preferências de comunicação são situação atual.
- Horário da consulta, estado ocupado, retry, timeout e preservação de dados anteriores em erro.
- Linguagem simples, sugestões determinísticas e limitações junto dos números.
- Manter privacidade, autorização no servidor e fonte inválida distinta de zero.
- Registrar blueprint no Pó Mágico sem alterar a referência histórica adotada pelo TERMO.

## Rota planejada

Modelo gpt-6.1-sol / high; fallback gpt-6.1-sol / xhigh se gates falharem repetidamente. Disponibilidade: catálogo do ambiente. Modelo e reasoning realmente executados: não expostos. Tokens, custo e latência: não medidos.
