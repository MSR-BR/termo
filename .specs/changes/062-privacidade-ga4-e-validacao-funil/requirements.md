# Requisitos

## Funcionais

- [x] Enviar ao GA4 uma URL de página sem fragmento, código OAuth ou parâmetros desconhecidos.
- [x] Preservar `utm_*` conhecidos e identificadores de clique de anúncios no `page_location`.
- [x] Limpar o `page_referrer` interno e o caminho de destino do evento de abertura do app.
- [x] Manter a URL real do navegador intacta para que o Supabase conclua o login.
- [x] Testar a emissão de `termo_open_app`, `chapter_start` e `study_activation`.

## Segurança, privacidade e conteúdo

- [x] Não ler, alterar nem expor credenciais ou dados de usuários.
- [x] Não modificar autenticação, autorização, conteúdo editorial ou campanha paga.
- [ ] Verificar, depois da publicação autorizada, se outros recursos de medição do GA4 não emitem URLs brutas independentemente deste script.

## Rota planejada

- Classe da tarefa: medição, privacidade e teste de funil.
- Modelo: `gpt-6.1-sol`.
- Reasoning: `high`.
- Justificativa: exige preservar atribuição de Ads e retorno OAuth enquanto se minimiza exposição de parâmetros sensíveis.
- Fallback permitido: `gpt-6.1-sol / xhigh` se testes revelarem conflito de autenticação ou atribuição.
- Gatilhos de escalonamento: falha reproduzível em login ou perda de parâmetros de campanha.
- Fonte da disponibilidade: catálogo do host Codex; modelo realmente executado não exposto.
