# Validação — Change 049

## Gates planejados

- [x] `npm run check`
- [x] `npm run test:auth-config`
- [x] `node --check assets/termo-auth.js`
- [x] `git diff --check`
- [x] revisão do diff e de segredos
- [x] validação visual, responsiva e por teclado da mensagem e do botão de nova tentativa
- [x] validação anônima do estado normal de login

## Evidência de execução

- Data: 23/09/2026
- Estado inicial: `main` sincronizada com `origin/main`, sem alterações locais.
- Produção: `/api/public-config` respondeu `200` com autenticação habilitada; o host legado redirecionou para `termo.app.br`.
- Supabase: changelog oficial consultado; nenhuma mudança recente afeta o uso hospedado de `supabase-js` neste fluxo. A remoção de `logs.all` e mudanças self-hosted não se aplicam.
- Comando ou inspeção: `npm run check`.
- Resultado: aprovado; 6 capítulos, 61 seções públicas e 43 elegíveis para IA preservados.
- Comando ou inspeção: `node --test tests/*.test.mjs`.
- Resultado: 75 testes aprovados, 0 falhas.
- Comando ou inspeção: `npm run test:auth-config`.
- Resultado: 5 testes específicos aprovados, incluindo falha transitória, recuperação e configuração realmente ausente.
- Comando ou inspeção: `node --check assets/termo-auth.js` e `git diff --check`.
- Resultado: ambos aprovados sem saída de erro.
- Comando ou inspeção: Playwright local em 390×844 e 1280×720, com `/api/public-config` normal e artificialmente interrompido.
- Resultado: estado anônimo normal preservado; estados de pontos, desafio e exercícios exibiram “Tentar novamente”; foco por teclado confirmado; remoção da falha restaurou a tela normal sem recarga.
- Comando ou inspeção: modal “Entrar” com endpoint artificialmente interrompido.
- Resultado: mensagem temporária correta e botão de nova tentativa focalizável.
- Comando ou inspeção: `security_fast_check.py --mode worktree` e gate focado de release.
- Resultado: `PASS`; projeto `S2_AUTHENTICATED`, 14 arquivos inspecionados e 0 gatilhos sensíveis.
- Configuração de produção: autenticação habilitada e quatro campos públicos necessários presentes, sem exibição de valores.
- Destino: Vercel produção, projeto `termo`, domínio canônico `termo.app.br`.
- Rollback: deployment de produção anterior da Vercel e reversão do commit no Git.
- Falha encontrada: uma rejeição de `/api/public-config` era convertida e memorizada como `authEnabled: false` até o fim da página.
- Correção aplicada: fetch `no-store`, três tentativas limitadas, estado `unavailable` não persistido, nova tentativa manual, retomada do bootstrap e revalidação por bfcache.
- Evidência: testes automatizados, inspeção do diff e validações de navegador acima.

## Modelo realmente observado

- Modelo: `não exposto`
- Reasoning: `não exposto`
- Fallback utilizado: `não observado`
- Tokens: `não medidos`
- Latência: `não medida`
- Fonte da evidência: metadados do ambiente, quando disponíveis

Não substituir valores desconhecidos por estimativas.
