# Requisitos — Change 028

- Gerar uma entrada para cada seção elegível no registry editorial.
- Registrar capítulo, seção, título, URL, fonte PDF, páginas, temas, revisão e
  elegibilidade.
- Derivar os dados apenas do registry, corpus e índice temático existentes.
- Falhar quando página, referência, fonte PDF, páginas ou tema estiverem ausentes.
- Falhar quando uma fonte estiver marcada para revisão.
- Impedir capítulos bloqueados e seções inelegíveis no manifesto.
- Exigir o manifesto aprovado no servidor antes de chamar o Gemini.
- Usar o HTML canônico do manifesto, sem misturar conteúdo enviado pelo cliente.
- Preservar a memória de correções confirmadas e aprovadas.
- Não alterar autenticação, dados pessoais, Supabase ou credenciais.
- Não executar commit, push ou deploy sem autorização posterior.

## Rota planejada

- Classe da tarefa: governança e segurança de conteúdo IA.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Justificativa: mudança atravessa proveniência, prompt, API e validação fechada.
- Fallback permitido: `gpt-5.6-sol / xhigh`.
- Gatilhos de escalonamento: divergência entre corpus, registry e índice temático.
- Fonte da disponibilidade: roadmap canônico do TERMO.
