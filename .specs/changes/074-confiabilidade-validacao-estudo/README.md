# 074 — Confiabilidade da validação de estudo

## Problema e escopo
Quando a API respondia que a gamificação não estava configurada, o marcador local passava a ser exibido como se o progresso e os pontos tivessem sido confirmados, e não havia nova tentativa. O problema é condicionado a essa falha; sua ocorrência em produção não foi estabelecida.

## Correção
Marcadores guardados apenas no aparelho e marcadores antigos sem indicação de sincronização passam a oferecer confirmação no servidor. Respostas confirmadas são registradas localmente como sincronizadas. A mesma chave de idempotência é reutilizada, e uma resposta duplicada não soma pontos novamente na interface. O botão evita afirmar que pontos foram concedidos apenas porque há um marcador local. Não altera esquema, autenticação nem critérios de premiação do servidor. Marcadores antigos exigem um clique de confirmação, pois não é possível distinguir com segurança os salvos apenas localmente dos já sincronizados.

## Validação
Testes de recuperação cobrem falha de configuração seguida de sucesso, marcador antigo e resposta duplicada, e erro persistente; testes de conteúdo, autenticação, analytics e gamificação devem passar antes de liberar. A publicação exige revisão e verificação do candidato específico; não há alteração de banco ou campanha de publicidade.
