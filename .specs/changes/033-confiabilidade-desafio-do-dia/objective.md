# Objetivo — Change 033

Tornar o desafio do dia resiliente a respostas matemáticas inválidas ou a indisponibilidade temporária do Gemini, sem bloquear o estudo nem expor mensagens técnicas ao estudante.

## Classificação

`INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP`

## Resultado observável

- O gerador pede uma única pergunta para o desafio do dia.
- Uma falha de geração ou de correção matemática aciona uma pergunta de contingência baseada exclusivamente em metadados editoriais publicados.
- Uma falha completa mostra texto amigável, intervalo curto e ação de nova tentativa.
- O capítulo 5 permanece bloqueado.

## Limites

- Fora do escopo funcional: avaliação do app, Supabase, pontos, autenticação, capítulos, SEO, landing e simuladores. O deploy foi executado depois, como etapa de liberação autorizada.
- Dependências: registro editorial, dados estruturados dos capítulos, corpus, índice temático e API Gemini já existentes.
- Decisões humanas necessárias: nenhuma pendente; a publicação posterior foi autorizada explicitamente.
