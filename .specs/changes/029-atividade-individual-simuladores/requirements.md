# Requisitos — Change 029

## Funcionais

- [x] Registrar simulador, caminho, primeira abertura, última abertura e contagem.
- [x] Incrementar repetidas aberturas de modo atômico.
- [x] Não registrar visitante anônimo.
- [x] Manter a abertura do simulador em nova aba sem depender da persistência.
- [x] Exibir o histórico somente na jornada autenticada.
- [x] Não conceder pontos automaticamente.
- [x] Preservar a telemetria agregada existente.

## Segurança, privacidade e conteúdo

- [x] Habilitar RLS na tabela pública exposta à Data API.
- [x] Remover todos os privilégios de `anon`.
- [x] Conceder ao cliente autenticado somente leitura direta.
- [x] Restringir leitura ao `auth.uid()` proprietário.
- [x] Restringir a função de escrita ao papel `authenticated`.
- [x] Usar `SECURITY DEFINER` com `search_path` vazio, validação explícita de
  identidade e parâmetros, sem aceitar `user_id` do cliente.
- [x] Não expor segredos, dados pessoais ou conteúdo privado.
- [x] Não alterar elegibilidade editorial, SEO ou IA.

## Rota planejada

- Classe da tarefa: integração privada de produto, banco e interface.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `medium`.
- Justificativa: mudança delimitada, mas com contrato de dados, RLS e integração
  visual que exigem validação coordenada.
- Fallback permitido: `gpt-5.6-sol / high`.
- Gatilhos de escalonamento: falha de isolamento RLS, divergência de schema,
  regressão no fluxo anônimo ou no analytics.
- Fonte da disponibilidade: roadmap canônico do TERMO; execução real não exposta.
