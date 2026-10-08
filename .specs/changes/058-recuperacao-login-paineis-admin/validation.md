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
- Checklist Supabase: autorização server-side preservada, service-role somente servidor, sem mudança de RLS/grants/credenciais. Diagnóstico adicional retorna apenas contagens ao administrador e não altera seleção de envio.
- Safari canônico: configuração carregou e botão Google disponível; fluxo chegou ao seletor Google. Validação da sessão final/contagens reais ainda pendente.
- Produção: verificação após CPD pendente.

## Modelo realmente observado

Modelo e reasoning: `não exposto`. Fallback: `não observado`. Tokens e latência: `não medidos`.
