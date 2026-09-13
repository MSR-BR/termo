# Riscos — Change 034

| Risco | Probabilidade/impacto | Mitigação | Verificação |
|---|---|---|---|
| confiar em `user_id` enviado pelo cliente | baixa/alto | ignorar identidade no corpo e validar Bearer no Auth | teste com tokens e corpos distintos |
| expor vínculo com a conta | baixa/alto | HMAC com chave secreta; não persistir ID, nome ou e-mail | inspeção do payload capturado |
| quebrar a área administrativa | baixa/alto | preservar GET padrão e DELETE | testes administrativos existentes |
| popup reaparecer entre domínios | baixa/médio | consultar estado no servidor antes de abrir | teste de frontend e contrato do endpoint |
| indisponibilidade da consulta abrir popup indevido | baixa/médio | falhar fechado: não abrir | teste controlado |
| alterar histórico anterior | baixa/médio | não migrar nem reescrever linhas antigas | diff e ausência de nova migration |
| sessão expirar entre abertura e envio | média/baixo | obter sessão atual ao abrir e tratar `401` amigavelmente | teste de erro e navegador |

## Risco residual

Avaliações históricas baseadas no navegador não podem ser associadas retroativamente a contas sem violar a minimização de dados. A primeira avaliação após a T34 pode coexistir com uma linha histórica antiga, mas todas as novas submissões da mesma conta convergem para uma única linha.
