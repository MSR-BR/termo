# Blueprint unificada de aprendizagem e gamificação — v1

## Escopo

Esta versão incorpora ao TERMO a metodologia definida pela skill
`adaptive-learning-gamification` e pelo programa de execução entregue em
`TERMO_UNIFIED_GAMIFICATION_HANDOFF.md`. Ela é uma referência contratual: não
altera a experiência pública, o banco ou as regras em produção.

## Ordem de decisão

1. objetivo de aprendizagem;
2. atividade e evidência observável;
3. feedback, revisão e nova recuperação;
4. recompensa estrutural;
5. comunicação e medição.

Pontos, nível, streak, badge e missão reconhecem participação verificável, mas
não constituem evidência de domínio. Pageview, scroll, refresh e abertura de
simulador são atividade de uso, não aprendizagem.

## Modos compartilhados

- **Prática da seção:** aplicação imediata de conteúdo publicado; conclusão é
  atividade, não domínio.
- **Simulado do capítulo:** diagnóstico amplo, com correção, revisão guiada e
  nova tentativa focalizada.
- **Desafio do dia:** recuperação curta e espaçada de conceitos estudados,
  fracos ou vencidos; ausência não gera punição.
- **Recuperação guiada:** indicação do ponto a rever, fonte, dicas graduais,
  feedback e questão semelhante, sem antecipar a resposta.
- **Atividade de simulador:** `prever -> manipular -> comparar -> explicar`;
  cada capacidade precisa ser declarada pelo simulador.

## Evidência e domínio

Erro, acerto com baixa confiança, acerto com ajuda, solução revelada e acerto
autônomo permanecem distintos. A política v1 exige no mínimo duas recuperações
independentes em sessões diferentes e, quando aplicável, mais de uma
representação antes de um marco de domínio. Um único simulado com 80% continua
registrável como desempenho, mas não basta para uma nova alegação de domínio.

## Arquitetura contratual

O desenho alvo possui três camadas:

1. ledger imutável de eventos verificados;
2. projeções versionadas do estado do estudante;
3. apresentação, analytics e comunicação.

O envelope compartilhado está em
`contracts/adaptive-learning-gamification-events-v1.json`. O adapter do TERMO
está em `data/termo-gamification-policy-v1.json`. O servidor deriva o usuário
da sessão, aplica idempotência e decide recompensa; o cliente apenas solicita a
ação.

## Conteúdo, IA e privacidade

O registry editorial e o manifesto de fontes são autoridades de elegibilidade.
Ausência, conflito ou estado bloqueado falha fechado. IA usa somente fontes
aprovadas e possui fallback determinístico. Analytics não pode atribuir pontos,
domínio ou mutar o profile. Texto livre, e-mail, segredo e resposta oculta não
entram no envelope salvo sem necessidade explícita e proteção adequada.

## Limites desta versão

- o contrato ainda não é aplicado pelo runtime;
- os conflitos inventariados serão tratados por T51 e T52;
- ranking individual público permanece desligado;
- comunicação opcional e avaliação acadêmica ficam para T54;
- a ajuda pública e explicabilidade ficam para T53.
