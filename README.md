# TERMO

**Termodinâmica para Estudantes de Física** é um livro interativo de Termodinâmica com capítulos, exercícios automáticos por IA, simulados por capítulo, pontos de estudo, desafio do dia, simuladores, exemplos resolvidos e material didático do Prof. Mario Reis (IF-UFF).

## Acessos principais

- Página oficial: https://termo-theta.vercel.app/home.html
- App interativo: https://termo-theta.vercel.app/
- Pontos e simulados: https://termo-theta.vercel.app/index.html?view=journey
- Desafio do dia: https://termo-theta.vercel.app/index.html?view=daily-challenge
- Mapa de conteúdo: https://termo-theta.vercel.app/conteudo.html
- Ponte no GitHub Pages: https://msr-br.github.io/termo/

## Conteúdo

O projeto reúne capítulos sobre conceitos fundamentais, potenciais termodinâmicos, termodinâmica estatística, transições de fase, processos termodinâmicos e ciclos termodinâmicos.

Também inclui simuladores para escalas termométricas, equilíbrio térmico, relações de Maxwell, paramagnetismo, gás de Van der Waals, processos isotérmicos, máquinas de Carnot e máquinas de Stirling.

## Gamificação

A primeira versão pública da gamificação usa uma estrutura simples: o estudante marca seções como estudadas, ganha pontos, acompanha nível e sequência de estudo, libera simulados IA em ordem por capítulo e pode fazer um desafio do dia quando já tiver histórico suficiente. A ideia de um estudo guiado inteligente fica documentada para uma fase futura, depois de haver dados reais de uso.

## Índice Técnico Dos Exercícios IA

O arquivo `docs/exercicios-ia-indice-referencias.html` documenta o índice principal por seção do app e o índice transversal por tema usados como referência para exercícios IA e simulados.

Sempre que o PDF do livro ou as páginas HTML do app forem atualizados, regenere o corpus e esse índice antes de alterar prompts ou lógica de geração IA:

```bash
npm run extract:book-sections
npm run build:book-topic-index
npm run docs:ai-exercise-index
npm run validate:book-corpus
npm run validate:book-topic-index
npm run smoke:ai-context
npm run smoke:math-contract
```
