# Requisitos — Change 035

## Funcionais

- [x] Confirmar a visibilidade e a permissão administrativa do repositório.
- [x] Confirmar a fonte e o endereço atuais do GitHub Pages.
- [x] Inventariar integralmente os arquivos rastreados em `docs/`.
- [x] Verificar por requisição pública quais classes de arquivo são entregues.
- [x] Confirmar o projeto, aliases, plano e ligação Git do Vercel.
- [x] Verificar se tornar apenas o GitHub privado protege o código publicado.
- [x] Definir uma arquitetura-alvo que preserve a URL histórica da ponte.
- [x] Classificar o índice de referências dos exercícios IA como administrativo.
- [x] Separar auditoria, proteção do deploy, migração da ponte, corte e monitoramento.
- [x] Registrar a decisão posterior de manter o repositório público e suspender
  as etapas de privatização.

## Segurança, privacidade e conteúdo

- [x] Não consultar nem registrar valores de variáveis de ambiente.
- [x] Não expor segredos ou dados de usuários durante a auditoria.
- [x] Não modificar autenticação, Supabase, Gemini, Resend ou dados pessoais.
- [x] Não tornar conteúdo bloqueado elegível para busca, SEO ou IA.
- [x] Tratar `noindex` como controle de indexação, não como autorização.

## Rota planejada

- Classe da tarefa: auditoria arquitetural e desenho de migração com impacto em
  segurança, SEO, GitHub Pages e Vercel.
- Modelo: `gpt-5.6-sol`.
- Reasoning: `high`.
- Justificativa: a decisão cruza superfícies públicas, deploy estático,
  integração Git, URLs históricas e autorização administrativa.
- Fallback permitido: `gpt-5.6-terra / high`.
- Gatilhos de escalonamento: conflito entre URLs canônicas, impossibilidade de
  preservar a ponte, exposição adicional de código ou perda da integração Git.
- Fonte da disponibilidade: modelos anunciados pelo host Codex desta tarefa.
