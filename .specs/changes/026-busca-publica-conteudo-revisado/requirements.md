# Requisitos — Change 026

- Interface em português com busca instantânea e `?q=`.
- Busca por seção, título, capítulo, descrição e temas existentes.
- Índice gerado exclusivamente de fontes canônicas e URLs físicas.
- Exclusão explícita do capítulo 5 e de material bloqueado.
- Operação estática, sem Supabase, Gemini, credenciais ou dados pessoais.
- Metadata, canonical, Open Graph, Twitter, SearchAction e sitemap.
- Navegação por teclado e layout responsivo.

## Rota

- Planejada: `gpt-5.6-terra / medium`.
- Justificativa: implementação ordinária com validações determinísticas.
- Fallback: `gpt-5.6-sol / medium` diante de falha repetida ou conflito amplo.
- Execução observada: modelo e reasoning ativos não expostos pelo host; nenhum
  fallback observável.
