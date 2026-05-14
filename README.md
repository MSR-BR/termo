# Pacote corrigido — exercícios IA com Gemini no Vercel

Arquivos incluídos:

- `slides/capitulo-01/page_1.html` a `page_20.html`
- `assets/ai-exercises.css`
- `assets/ai-exercises.js`
- `api/exercicio.js`
- `data/capitulo-01.json`
- `package.json`

## Upload

Envie as pastas e arquivos para a raiz do repositório:

```text
api/exercicio.js
assets/ai-exercises.css
assets/ai-exercises.js
data/capitulo-01.json
slides/capitulo-01/page_1.html ... page_20.html
package.json
```

## Vercel

1. Faça deploy do repositório no Vercel.
2. Em `Project Settings > Environment Variables`, crie:

```text
GEMINI_API_KEY = sua chave do Google AI Studio
```

Opcional:

```text
GEMINI_MODEL = gemini-1.5-flash
```

3. Faça redeploy.
4. Teste:

```text
https://SEU-PROJETO.vercel.app/api/exercicio
```

Deve aparecer uma resposta JSON dizendo que a API está ativa.
