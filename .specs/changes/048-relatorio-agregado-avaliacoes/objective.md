# Objetivo — Change 048

Incluir na análise periódica do TERMO um resumo privado de avaliações do app,
com total, média, distribuição e quantidade de comentários, sem revelar
identidade, comentários individuais ou dados de uso granulares.

## Resultado observável

- o administrador autorizado recebe somente agregados seguros;
- a consulta preserva o isolamento atual das avaliações no Supabase;
- o relatório distingue avaliação de satisfação de métrica de aprendizagem; e
- nenhuma nova coleta, publicação pública ou mudança de RLS é necessária.

## Limites

- Não exibe lista de avaliações, feedback textual ou identificadores.
- Não altera Supabase, RLS, API, autenticação ou o prompt de avaliação.
