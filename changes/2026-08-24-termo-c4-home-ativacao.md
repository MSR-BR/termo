# Change Plan: TERMO C4 — Home orientada à ativação

## Objetivo

Transformar melhor a visita da campanha em começo de estudo, sem redesenhar a
home, alterar capítulos, mecanismos de IA ou desbloqueios.

## Alterações

### C4-A — CTA móvel de estudo

- Preservar o CTA já publicado no início da hero móvel:
  `Começar a estudar` → `index.html?view=chapters&chapter=01`.
- Manter Capítulo 1 como destino único de aquisição. Não enviar o visitante
  novo para área pessoal, simulados ou desafio diário.

### C4-B — Explicação curta do percurso

Logo abaixo do CTA móvel, apresentar três passos curtos:

1. Leia o Capítulo 1;
2. Pratique com exercícios gerados por IA;
3. Desbloqueie simulados à medida que avança.

O terceiro passo deixa explícita a condição de desbloqueio; não promete que um
simulado estará disponível imediatamente.

### C4-C — Continuidade no app

- Preservar o conteúdo aberto sem login.
- Pedir login apenas para salvar histórico, exercícios e progresso.
- Priorizar a ação "continuar de onde parei" para usuário autenticado, sem
  bloquear a primeira exploração.

### C4-D — Medição

- Manter `home_study_cta_click` para o CTA móvel.
- Usar `chapter_start`, `exercise_generate_success`, `login_success` e
  `simulator_start` como etapas sequenciais do funil.
- Não enviar parâmetros UTM crus, e-mails ou outros dados pessoais em eventos.

## Arquivos previstos

- `home.html` — cópia curta e estilo do percurso móvel.
- `assets/termo-analytics.js` — somente se faltar evento ou proteção de dados.
- `index.html` — apenas se a continuidade não estiver disponível no fluxo atual.

## Validação

- Em tela de até 680 px, CTA e os três passos aparecem antes de "Entrada rápida".
- O CTA segue abrindo diretamente o Capítulo 1.
- Desktop permanece visualmente inalterado.
- Não há mudança em capítulos, simulados, autenticação ou regras de progresso.

## Riscos a evitar

- transformar a home numa lista de funcionalidades;
- levar iniciante direto a recurso bloqueado;
- criar outro CTA competindo com o começo do Capítulo 1.
