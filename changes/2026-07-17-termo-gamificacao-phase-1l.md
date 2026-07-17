# Change Plan: TERMO Gamificacao Fase 1L

## Objetivo

Preparar a Fase 1 para um commit offline unico, sem fazer deploy e sem misturar
essa entrega com alteracoes futuras.

## Escopo Do Pacote

Este pacote inclui:

- especificacao e arquitetura da gamificacao;
- endpoints de gamificacao;
- handlers compartilhados;
- catalogo versionado de simulados;
- testes automatizados dos handlers;
- integracao do `Estudo guiado` no `index.html`;
- botoes de marcar item estudado nas paginas HTML;
- navegacao anterior/proximo nos slides;
- checklist por capitulo na jornada;
- documentacao de changes de 0B ate 1L.

## O Que Nao Deve Entrar Ainda

- deploy de producao;
- nova mudanca de banco;
- email do desafio do dia;
- ranking, turma ou recurso social;
- notificacoes automaticas;
- aumento de consultas ao Supabase.
- prototipo offline em HTML/CSS/JS solto na raiz, porque ele foi util para
  desenho local, mas nao deve virar pagina publica em producao.

## Validacoes Executadas

- `node --check assets/termo-auth.js`;
- `node --check assets/termo-share.js`;
- `node --check api/gamification-event.js`;
- `node --check api/gamification-profile.js`;
- `node --check api/chapter-quiz.js`;
- `node --check lib/gamification-shared.mjs`;
- `node --check lib/gamification-event-handler.mjs`;
- `node --check lib/gamification-profile-handler.mjs`;
- `node --check lib/chapter-quiz-handler.mjs`;
- validacao de scripts inline do `index.html`;
- `npm run test:gamification`;
- `npm run check`;
- `curl -I http://127.0.0.1:3000/index.html?view=journey`;
- `curl -I http://127.0.0.1:3000/index.html?view=journey&section=quiz&chapter=02`;
- `curl -I http://127.0.0.1:3000/slides/capitulo-04/page_6.html`.

## Resultado

A Fase 1 esta pronta para uma revisao final de diff e, se aprovada, para um
commit offline.

## Proximo Passo

Fazer uma revisao de diff por grupo de arquivos antes do commit:

1. specs, docs e changes;
2. backend e handlers;
3. `index.html` e assets;
4. paginas HTML dos capitulos;
5. testes e scripts.

Depois disso, criar um commit unico. O deploy deve continuar separado.
