# Validação

## Gates planejados

- [x] `npm run check`
- [x] testes de contrato, ledger e adaptação da gamificação
- [x] suíte completa de testes
- [x] `git diff --check`
- [x] revisão do diff e de segredos
- [x] produção: jornada autenticada e autorização
- [x] loading, recuperação, retry e proteção contra recompensa repetida
- [x] teclado, foco e árvore de acessibilidade
- [ ] zoom real e VoiceOver: dependem de validação humana fora da automação

## Evidência de execução

- Data: 25/09/2026.
- Estado inicial: `main` sincronizada com `origin/main`; somente
  `SUPABASE-EXPLICIT-GRANTS-2026-10-30.md` estava fora do Git e permanece fora
  do escopo.
- Changelog Supabase: consultado; a futura exigência de grants explícitos da
  Data API é relevante, mas T51/T52 já usam grants explícitos e escrita
  autoritativa server-side.
- Git: commits `d001739`, `4de7207`, `f0b0974`, `ca7c9c0` e `82c2f52`
  confirmam publicação sequencial de T50–T54.
- Supabase/Vercel: evidências existentes confirmam migrations T51, T52 e T54,
  ativação opt-in do ledger e deploy final `READY`; nenhum provedor foi
  modificado nesta Change.
- `npm run check`: aprovado; 6 capítulos, 61 seções públicas, 43 seções
  elegíveis para IA, capítulo 05 excluído.
- Testes focalizados de contrato, ledger, handlers e adaptação: 36/36.
- Suíte integral após a correção: 125/125 testes aprovados.
- Produção anônima: jornada apresentou estado claro de login, árvore semântica
  com landmarks/títulos/controles e API protegida com HTTP 401, sem retornar
  dados pessoais.
- Teclado anônimo: ordem alcançou pontos, login, PDF, envio, menu, login da
  jornada e conteúdo; foco nativo visível em todos os controles observados.
- Produção autenticada: a jornada carregou o snapshot privado, progresso,
  simuladores e liberações esperadas; capítulo 05 permaneceu ausente; nenhum
  erro ou aviso apareceu no console.
- Teclado autenticado: os controles principais e a ajuda de metodologia foram
  alcançados e exibiram foco visível. A árvore expôs regiões, títulos, botões e
  links com nomes compreensíveis.
- Loading: o recarregamento apresentou o estado de busca antes do snapshot.
- Repetição: a UI desabilita o envio imediatamente; ledger, RPC atômico e suíte
  automatizada confirmam supressão de recompensa repetida. Não foi enviado um
  simulado duplicado à conta real apenas para produzir evidência.
- Falha encontrada: a jornada usava um perfil local com zero pontos quando a
  API de perfil falhava, podendo simular perda de progresso.
- Decisão humana: o responsável autorizou a correção mínima em 25/09/2026.
- Correção aplicada: a falha agora mostra mensagem em português, afirma que os
  dados não foram alterados e oferece botão acessível de nova tentativa; nenhum
  total zerado é renderizado.
- Teste específico: 3/3 cenários aprovados, incluindo execução real do handler
  de retry em ambiente unitário.
- Limitação: o zoom do Chrome não respondeu ao comando da automação e não foi
  contado como teste real; VoiceOver também não foi executado. A estrutura usa
  controles nativos e o estado novo possui `role="status"` com
  `aria-live="polite"`, mas isso não substitui a validação humana.
- Falha encontrada: a tentativa de usar o utilitário `agent-browser` não pôde
  prosseguir porque o binário não está instalado; o teste de produção continuou
  pela automação do Chrome disponível no ambiente.
- Publicação: `cpd` autorizado pelo responsável em 25/09/2026; confirmar
  commit, push, deploy e smoke da revisão publicada antes de declarar conclusão.

## Modelo realmente observado

- Modelo: `não exposto`
- Reasoning: `não exposto`
- Fallback utilizado: `não observado`
- Tokens: `não medidos`
- Latência: `não medida`
- Fonte da evidência: o runtime não expôs metadados verificáveis de modelo.

Não substituir valores desconhecidos por estimativas.
