# Objetivo — Change 034

Impedir que o pedido de avaliação do TERMO reapareça para uma conta que já enviou uma resposta, inclusive em outro domínio ou dispositivo, e tornar falhas temporárias menos insistentes.

## Classificação

`INTERACTIVE_BOOK + EDUCATIONAL_MATERIAL + APP`

## Rota de modelo

- Modelo principal: `gpt-5.6-sol / xhigh`.
- Fallback: `gpt-5.5 / xhigh`.
- Motivo: mudança pequena em superfície, mas sensível a autenticação, privacidade, idempotência, banco e regressão administrativa.

## Resultado observável

- Somente uma linha representa cada conta que avaliar o TERMO após esta change.
- Uma conta já avaliada não recebe novamente o diálogo, mesmo em outra origem ou dispositivo autenticado.
- Uma falha de envio cria um intervalo local antes de uma nova solicitação automática.
- O texto descreve corretamente o tratamento pseudônimo, sem chamar a resposta de anônima.

## Limites

- Fora do escopo: publicar média para usuários comuns, alterar notas históricas, identificar autores para o administrador, mudar domínio canônico, capítulos, exercícios, simuladores e campanhas.
- A publicação depende de autorização explícita, concedida pelo pedido de CPD da T34.
