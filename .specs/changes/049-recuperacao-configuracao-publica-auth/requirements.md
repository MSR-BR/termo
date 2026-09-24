# Requisitos — Change 049

## Funcionais

- [x] Buscar a configuração pública sem reutilizar resposta HTTP obsoleta.
- [x] Repetir automaticamente a consulta após falhas transitórias.
- [x] Não memorizar uma falha de rede como `authEnabled: false` durante toda a sessão.
- [x] Distinguir configuração ausente de indisponibilidade temporária.
- [x] Oferecer ação “Tentar novamente” nos estados temporariamente indisponíveis.
- [x] Recuperar a sessão e atualizar a interface após uma nova tentativa bem-sucedida.
- [x] Revalidar a configuração quando a página voltar do cache de navegação.
- [x] Preservar o fluxo OAuth, as APIs, o conteúdo público e os dados existentes.

## Segurança, privacidade e conteúdo

- [x] Preservar autenticação, autorização server-side e RLS aplicáveis.
- [x] Não expor segredos, dados pessoais ou conteúdo privado.
- [x] Não tornar conteúdo bloqueado elegível para busca, SEO ou IA.
- [x] Não alterar `AUTH_SITE_URL` até existir evidência da allow-list correspondente no Supabase.

## Rota planejada

- Classe da tarefa: correção de confiabilidade em autenticação e estado público.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Justificativa: mudança transversal em bootstrap, cache, recuperação e interface autenticada.
- Fallback permitido: `gpt-5.6-terra / high`.
- Gatilhos de escalonamento: regressão de OAuth, sessão persistente, pontos, favoritos ou desafio do dia.
- Fonte da disponibilidade: catálogo exposto pelo host; execução real não exposta.
