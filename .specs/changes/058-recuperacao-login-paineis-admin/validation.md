# Validação

## Estado inicial e diagnóstico (08/10/2026)

- Base Git: `693ab7ba161a7da9cab475bea8aa4de0edf336b0`.
- Safari: documento no host legado com retorno OAuth; consulta `/api/public-config` falhou com `TypeError: Load failed`. Sem copiar URL ou credenciais.
- Nova janela Safari no domínio canônico: configuração `configured`, sem sessão ativa.
- Chromium novo no canônico: configuração disponível.
- Comunicação só consultava ao clicar; erro aparecia longe da lista e botão desaparecia após sucesso/vazio.
- Grid de avaliação herdava a largura mínima de 680px da tabela, apesar do overflow interno.

## Gates

- `npm run check`: passou.
- `node --test tests/*.test.mjs`: 138/138 passaram (provedores simulados).
- `node --check assets/termo-auth.js` e handler de e-mail: passaram.
- Oito scripts inline de index.html compilados com vm.Script: passaram.
- `node scripts/test-admin-panels-browser.mjs`: passou com Chromium; 320/390/1280px, foco e teclas em tabela, ampliação de texto 200%, consulta automática, falha, retry, vazio e seleção. Todas as APIs interceptadas; zero envios reais.
- Captura mobile inspecionada visualmente, mantida apenas em `/private/tmp`, com fixtures.
- `git diff --check`: passou.
- Sandbox inicialmente bloqueou lançamento do Chromium (MachPort); teste repetido com permissão de processo, sem mudanças no produto por esse motivo.
- Checklist Supabase: autorização server-side preservada, service-role somente servidor, nenhuma credencial alterada. Diagnóstico adicional retorna apenas contagens ao administrador e não altera seleção de envio.
- Safari canônico: login Google real concluído com `marioreis@id.uff.br`, sessão administrativa confirmada sem exportar tokens.
- Consulta real antes da correção: HTTP 502 no controle de frequência.
- SQL Editor confirmou projeto `termo`, organização `MSR-BR's Org`, ref `guifkjjuxsdgwjlhkmnx`; `to_regclass` comprovou tabela de histórico ausente.
- Contagens agregadas: 6 opt-ins, 1 com documentos vigentes, 0 pausas. Uma campanha histórica; zero campanhas e zero entregas nos últimos 7 dias, portanto sem histórico recente a reconciliar para os limites.
- Migração canônica `20260824_create_email_recipient_deliveries.sql` aplicada em transação pelo editor. Sem db push, sem alterar o histórico divergente de migrations.
- Pós-migração: tabela existe; service_role SELECT/INSERT true; anon e authenticated SELECT false; RLS true.
- Consulta autenticada pós-migração: HTTP 200, 1 destinatário elegível, 0 excluídos por frequência. Sem imprimir endereços de destinatários ou dados de sessão.
- Produção: verificação após CPD pendente.

## Modelo realmente observado

Modelo e reasoning: `não exposto`. Fallback: `não observado`. Tokens e latência: `não medidos`.
