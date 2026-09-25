# TERMO — avaliação acadêmica e comunicação responsável v1

## Decisão

A T54 não declara que pontos, tempo, cliques, satisfação ou aumento de uso
representam aprendizagem. O TERMO passa a manter cinco camadas explicitamente
separadas: aprendizagem observada, comportamento, experiência, fidelidade de
implementação e equidade/segurança.

O contrato canônico está em
`data/termo-evaluation-communication-policy-v1.json`. O painel administrativo
consulta somente agregados e suprime células entre 1 e 4 registros. Nenhuma
linha individual, e-mail, identificador de usuário, resposta ou comentário livre
é devolvido pelo endpoint de avaliação.

## Pergunta acadêmica e gate de alegação

Pergunta principal: após exposição fiel aos modos adaptativos, há melhora em
recuperação independente tardia e em uma forma alterada do problema?

Uma alegação de ganho acadêmico exige, antes da análise:

1. baseline ou pré-teste comparável;
2. definição prévia da população elegível e da exposição;
3. nova medida após pelo menos sete dias;
4. item do mesmo conceito em enunciado, números ou representação alterados;
5. amostra, atrito, ausências e dados faltantes;
6. estimativa de efeito e intervalo de incerteza;
7. registro de efeitos adversos e limitações.

Até que esses itens existam, o relatório pode descrever uso, satisfação,
tentativas e desempenho observado, mas não causalidade, retenção ou ganho de
aprendizagem.

## Fontes e grãos

| Camada | Fonte | Grão | Interpretação permitida |
|---|---|---|---|
| Aprendizagem observada | `gamification_event_log`, `chapter_quiz_attempts` | evento/tentativa autenticada | resultado observado, tipo de ajuda e evidência |
| Comportamento | `app_analytics_events`, GA4 | evento de uso | navegação, ativação e uso de recurso |
| Experiência | `app_ratings` | uma avaliação por conta pseudonimizada | satisfação declarada |
| Fidelidade | ledger, tentativas e telemetria | etapa observável da mecânica | cobertura de elegibilidade, exposição, ação e recompensa |
| Equidade/segurança | preferências, falhas e entregas | agregado por janela | atrito, opt-out, falhas e dados ausentes |

O GA4 não escreve no ledger, não concede pontos e não define domínio. O painel
administrativo não mistura eventos do GA4 com evidência acadêmica.

## Auditoria de fidelidade T51–T52 em 25/09/2026

- recompensa e tentativa são persistidas de forma atômica no caminho v1;
- o Desafio do dia tem supressão duplicada por usuário e dia;
- a abertura de simulador continua sendo apenas comportamento, sem recompensa;
- elegibilidade é derivável dos registros editoriais e catálogos publicados;
- exposições de retomada, nova tentativa e Desafio do dia ainda não possuem
  contagem histórica dedicada;
- respostas de duplicata existem em tempo de execução, mas sua contagem histórica
  não é persistida;
- retenção tardia e transferência em forma alterada ainda não são identificáveis
  de maneira automática.

Essas lacunas aparecem no painel como `unavailable` ou `partial`; não são
preenchidas por inferência.

## Comunicação responsável

- opt-in afirmativo e desligado por padrão;
- uso integral do TERMO sem aceitar mensagens;
- pausa de 30 dias na Área Pessoal;
- descadastro sem login em link individual opaco;
- bloqueio de envio real entre 21h e 8h, horário de Brasília;
- máximo de uma campanha em 24 horas e duas em sete dias por destinatário;
- mensagens com ameaça de perda, ranking ou urgência artificial são recusadas;
- campanhas continuam exigindo teste, revisão e confirmação explícita do
  administrador.

A migração redefine como opt-out registros legados que estavam ligados pelo
antigo valor padrão sem timestamp de consentimento afirmativo. Nenhuma campanha
é enviada pela T54.

## Privacidade e segurança

As leituras administrativas usam a credencial de servidor somente após validar a
sessão e o e-mail administrativo. A credencial não é enviada ao navegador. As
tabelas de preferências continuam com RLS ativa, sem grants para `anon` e
`authenticated`. O token de descadastro é opaco e não é encaminhado ao GA4.

## Limitações e próxima decisão editorial

Ainda é necessário aprovar um desenho prospectivo com instrumentos equivalentes
de baseline, retenção e transferência. Sem isso, a T54 entrega governança,
qualidade e prontidão de medição — não uma conclusão sobre eficácia pedagógica.
