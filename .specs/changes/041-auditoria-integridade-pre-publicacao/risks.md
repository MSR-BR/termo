# Riscos — Change 041

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| falso negativo por testar apenas uma rota representativa no navegador | média/alto | combinar navegador com varredura HTTP de todas as rotas públicas | todas as rotas respondem `200` com conteúdo significativo |
| referência local quebrada fora dos dados de capítulos | média/médio | auditar atributos HTML, `srcset` e `url()` de CSS | zero referências ausentes |
| acionar custos ou gravações durante a auditoria | baixa/alto | não enviar avaliações, eventos autenticados ou geração IA real | somente testes com mocks e leituras públicas |
| regressão editorial expor capítulo 5 | baixa/alto | registry, busca e testes editoriais | capítulo 5 bloqueado e ausente do índice público |
| deploy divergir do commit | baixa/alto | revisar o diff, usar arquivos rastreados e validar produção | hash publicado e rotas de produção verificadas |

## Riscos que impedem conclusão

- Nenhum registrado antes do CPD.
