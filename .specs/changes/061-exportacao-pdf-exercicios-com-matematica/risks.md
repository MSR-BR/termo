# Riscos

| Risco | Probabilidade/impacto | Controle | Evidência esperada |
|---|---|---|---|
| MathJax indisponível por rede/CDN | baixa/média | não liberar impressão; aviso e recarga | estado de falha testado no código |
| Navegador bloquear nova aba | média/baixa | abertura síncrona no clique e mensagem específica | teste de popup bloqueado |
| Equação longa exceder largura | baixa/média | CSS responsivo e inspeção de PDF A4 | PDF de exemplo renderizado |
| Mudança de fluxo direto para diálogo de impressão | certa/baixa | botão e instrução “Salvar como PDF” | validação visual e texto claro |

## Riscos que impedem conclusão

- Nenhum identificado após a validação local; comportamento de impressão nativo pode variar entre navegadores.
