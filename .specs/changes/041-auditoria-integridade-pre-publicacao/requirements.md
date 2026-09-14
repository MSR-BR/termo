# Requisitos — Change 041

## Funcionais

- [x] Executar os validadores e testes automatizados existentes.
- [x] Verificar sintaxe dos arquivos JavaScript e módulos do repositório.
- [x] Auditar referências locais nas superfícies públicas.
- [x] Solicitar por HTTP local todas as rotas editoriais e de SEO relevantes.
- [x] Verificar visualmente os principais fluxos públicos no navegador.
- [x] Corrigir somente defeitos comprovados.
- [x] Preservar o artefato de divulgação produzido antes da auditoria.

## Segurança, privacidade e conteúdo

- [x] Preservar autenticação, autorização server-side e RLS aplicáveis.
- [x] Não consultar nem registrar segredos ou dados pessoais.
- [x] Não acionar geração IA real nem realizar gravações no banco.
- [x] Não tornar conteúdo bloqueado elegível para busca, SEO ou IA.
- [x] Manter o capítulo 5 ausente das superfícies públicas.

## Rota planejada

- Classe da tarefa: auditoria técnica ampla, validação ponta a ponta e publicação.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Justificativa: a inspeção cruza páginas estáticas, roteamento do app, APIs,
  artefatos editoriais, SEO, IA e deploy Vercel.
- Fallback permitido: `gpt-5.6-terra / high`.
- Gatilhos de escalonamento: quebra de autenticação, divergência editorial,
  falha de API, conteúdo bloqueado exposto ou regressão pós-deploy.
- Fonte da disponibilidade: modelos anunciados pelo host Codex desta tarefa.
