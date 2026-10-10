# Riscos e controles

| Risco | Controle | Gate de fechamento |
|---|---|---|
| Interromper o login ao limpar o código PKCE | Nenhuma limpeza da URL enquanto houver parâmetros de retorno; esperar `whenReady()` | Login real em produção e testes locais |
| Perder atribuição de Ads | Manter parâmetros de campanha conhecidos e seus valores não pessoais | Testes de campanha e relatório GA4 após publicação |
| Perder eventos durante o retorno OAuth | Fila limitada até configurar o Google tag | Teste de evento enfileirado e `login_success` real |
| `page_view` automático ainda enviar URL bruta ou duplicar | Conferir medição aprimorada remota e `pageLocation`/`pageReferrer` após deploy | Consulta de eventos pós-publicação |
| Confundir presença em busca com indexação | Exigir URL Inspection/Page Indexing no Search Console | Propriedade conectada e URLs verificadas |

Reversão: restaurar apenas as mudanças desta Change nos dois arquivos de produto e no teste; não reverter mudanças preexistentes do usuário nem alterar a propriedade GA4 às cegas.
