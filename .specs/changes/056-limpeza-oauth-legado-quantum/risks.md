# Riscos e reversão

Remover uma entrada ainda usada poderia impedir OAuth. Mitigações: inspeção do fluxo TERMO, confirmação C33, configurações públicas qm-beta e verificação de qm-theta, teste antes/depois, preservação de todas as entradas TERMO.

Se o login apresentar regressão atribuível à limpeza, adicionar novamente EXATAMENTE os valores removidos de oauth-before.json nos respectivos painéis, salvar e repetir login. Não rotacionar credenciais nem restaurar configurações de terceiros. O estado anterior é evidência de reversão, não recomendação de manter indefinidamente origem hoje pertencente a outro site.

Preview real não disponível: manter essa validação pendente. Nenhuma alteração em políticas, usuários ou dados Supabase.
