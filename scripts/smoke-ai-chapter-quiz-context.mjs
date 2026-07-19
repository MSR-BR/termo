import {
  buildAiChapterQuizContextPackage,
  generateAiChapterQuiz,
  listAiQuizChapters,
  validateQuizMathContract
} from "../lib/gamification-ai-quiz.mjs";

function buildMockGeminiResponse(rawText) {
  return {
    ok: true,
    json: async function () {
      return {
        candidates: [
          {
            content: {
              parts: [{ text: rawText }]
            }
          }
        ]
      };
    }
  };
}

async function smokeRawLatexJsonRepair() {
  const previousFetch = global.fetch;
  let callCount = 0;
  const rawLatexJson = String.raw`{
    "note": "Teste com escape cru",
    "questions": [
      {
        "prompt": "Qual expressao representa \(F = U - TS\)?",
        "options": {
          "a": "Energia livre de Helmholtz \(F\)",
          "b": "Entalpia \(H\)",
          "c": "Gibbs \(G\)",
          "d": "Potencial quimico \(\mu\)"
        },
        "correct": "a",
        "explanation": "A definicao usa \(F = U - TS\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Rever a transformada que define \(F\).",
        "reviewCheck": {
          "prompt": "A formula \(F = U - TS\) define qual potencial?",
          "options": {
            "a": "Helmholtz",
            "b": "Entalpia"
          },
          "correct": "a",
          "reinforcement": "Essa e a forma correta de \(F\)."
        }
      },
      {
        "prompt": "Em \(dF = -S dT - P dV\), qual variavel natural aparece?",
        "options": {
          "a": "\(T\)",
          "b": "\(H\)",
          "c": "\(G\)",
          "d": "\(N_A\)"
        },
        "correct": "a",
        "explanation": "A diferencial evidencia \(T\) e \(V\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Rever variaveis naturais de \(F\).",
        "reviewCheck": {
          "prompt": "\(T\) e \(V\) sao naturais de \(F\)?",
          "options": { "a": "Sim", "b": "Nao" },
          "correct": "a",
          "reinforcement": "A diferencial de \(F\) mostra isso."
        }
      },
      {
        "prompt": "Qual relacao usa \frac{\partial F}{\partial V}?",
        "options": {
          "a": "Pressao",
          "b": "Entalpia",
          "c": "Temperatura",
          "d": "Calor"
        },
        "correct": "a",
        "explanation": "A pressao vem de uma derivada de \(F\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Rever derivadas de potenciais.",
        "reviewCheck": {
          "prompt": "Derivadas de potenciais geram variaveis conjugadas?",
          "options": { "a": "Sim", "b": "Nao" },
          "correct": "a",
          "reinforcement": "Essa e a ideia central."
        }
      },
      {
        "prompt": "Qual alternativa evita misturar \(F\) e \(G\)?",
        "options": {
          "a": "\(F\) usa \(T,V\)",
          "b": "\(F\) usa apenas \(P\)",
          "c": "\(F\) e entalpia",
          "d": "\(F\) e entropia"
        },
        "correct": "a",
        "explanation": "\(F\) e natural em \(T,V\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Separar potenciais por variaveis naturais.",
        "reviewCheck": {
          "prompt": "\(F\) e \(G\) tem as mesmas variaveis naturais?",
          "options": { "a": "Nao", "b": "Sim" },
          "correct": "a",
          "reinforcement": "Cada potencial tem seu conjunto natural."
        }
      },
      {
        "prompt": "Para volume constante, qual potencial tende a ser conveniente?",
        "options": {
          "a": "\(F\)",
          "b": "\(H\)",
          "c": "\(G\)",
          "d": "\(S\)"
        },
        "correct": "a",
        "explanation": "\(F\) e adequado para \(T,V\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Consolidar o uso de \(F\).",
        "reviewCheck": {
          "prompt": "\(F\) combina com volume fixo?",
          "options": { "a": "Sim", "b": "Nao" },
          "correct": "a",
          "reinforcement": "Sim, quando \(T\) e \(V\) sao naturais."
        }
      }
    ]
  }`;
  const repairedJson = String.raw`{
    "note": "Teste com escape reparado",
    "questions": [
      {
        "prompt": "Qual expressao representa \\(F = U - TS\\)?",
        "options": {
          "a": "Energia livre de Helmholtz \\(F\\)",
          "b": "Entalpia \\(H\\)",
          "c": "Gibbs \\(G\\)",
          "d": "Potencial quimico \\(\\mu\\)"
        },
        "correct": "a",
        "explanation": "A definicao usa \\(F = U - TS\\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Rever a transformada que define \\(F\\).",
        "reviewCheck": {
          "prompt": "A formula \\(F = U - TS\\) define qual potencial?",
          "options": { "a": "Helmholtz", "b": "Entalpia" },
          "correct": "a",
          "reinforcement": "Essa e a forma correta de \\(F\\)."
        }
      },
      {
        "prompt": "Em \\(dF = -S dT - P dV\\), qual variavel natural aparece?",
        "options": { "a": "\\(T\\)", "b": "\\(H\\)", "c": "\\(G\\)", "d": "\\(N_A\\)" },
        "correct": "a",
        "explanation": "A diferencial evidencia \\(T\\) e \\(V\\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Rever variaveis naturais de \\(F\\).",
        "reviewCheck": {
          "prompt": "\\(T\\) e \\(V\\) sao naturais de \\(F\\)?",
          "options": { "a": "Sim", "b": "Nao" },
          "correct": "a",
          "reinforcement": "A diferencial de \\(F\\) mostra isso."
        }
      },
      {
        "prompt": "Qual relacao usa \\(\\frac{\\partial F}{\\partial V}\\)?",
        "options": { "a": "Pressao", "b": "Entalpia", "c": "Temperatura", "d": "Calor" },
        "correct": "a",
        "explanation": "A pressao vem de uma derivada de \\(F\\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Rever derivadas de potenciais.",
        "reviewCheck": {
          "prompt": "Derivadas de potenciais geram variaveis conjugadas?",
          "options": { "a": "Sim", "b": "Nao" },
          "correct": "a",
          "reinforcement": "Essa e a ideia central."
        }
      },
      {
        "prompt": "Qual alternativa evita misturar \\(F\\) e \\(G\\)?",
        "options": {
          "a": "\\(F\\) usa \\(T,V\\)",
          "b": "\\(F\\) usa apenas \\(P\\)",
          "c": "\\(F\\) e entalpia",
          "d": "\\(F\\) e entropia"
        },
        "correct": "a",
        "explanation": "\\(F\\) e natural em \\(T,V\\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Separar potenciais por variaveis naturais.",
        "reviewCheck": {
          "prompt": "\\(F\\) e \\(G\\) tem as mesmas variaveis naturais?",
          "options": { "a": "Nao", "b": "Sim" },
          "correct": "a",
          "reinforcement": "Cada potencial tem seu conjunto natural."
        }
      },
      {
        "prompt": "Para volume constante, qual potencial tende a ser conveniente?",
        "options": { "a": "\\(F\\)", "b": "\\(H\\)", "c": "\\(G\\)", "d": "\\(S\\)" },
        "correct": "a",
        "explanation": "\\(F\\) e adequado para \\(T,V\\).",
        "reviewItem": "2.3",
        "reviewTitle": "Energia Livre de Helmholtz",
        "reviewPath": "slides/capitulo-02/page_3.html",
        "reviewWhy": "Consolidar o uso de \\(F\\).",
        "reviewCheck": {
          "prompt": "\\(F\\) combina com volume fixo?",
          "options": { "a": "Sim", "b": "Nao" },
          "correct": "a",
          "reinforcement": "Sim, quando \\(T\\) e \\(V\\) sao naturais."
        }
      }
    ]
  }`;
  global.fetch = async function () {
    callCount += 1;
    return buildMockGeminiResponse(callCount === 1 ? rawLatexJson : repairedJson);
  };

  try {
    const generated = await generateAiChapterQuiz({
      chapterId: "02",
      stage: "after",
      env: {
        GEMINI_API_KEY: "fake-key",
        TERMO_QUIZ_TOKEN_SECRET: "smoke-test"
      }
    });

    if (!generated.ok || !generated.quiz?.mathContractOk) {
      throw new Error(`Parser nao recuperou JSON com LaTeX cru: ${generated.error || "sem detalhe"}`);
    }

    console.log("\nRaw LaTeX JSON repair OK");
  } finally {
    global.fetch = previousFetch;
  }
}

const chapters = listAiQuizChapters();

if (!chapters.length) {
  throw new Error("Nenhum capitulo ativo encontrado para simulados IA.");
}

for (const chapter of chapters) {
  const contextPackage = buildAiChapterQuizContextPackage(chapter);
  const references = contextPackage.sourceReferences || [];
  const missingPdfReferences = references.filter((reference) => !reference.pageStart);

  console.log(`\nCapitulo ${chapter.id} - ${chapter.title}`);
  console.log(JSON.stringify({
    topicCount: chapter.topics.length,
    pdfChapter: contextPackage.meta.pdfChapterNumber,
    pdfPages: `${contextPackage.meta.pageStart}-${contextPackage.meta.pageEnd}`,
    sourceReferenceCount: references.length,
    missingPdfReferenceCount: missingPdfReferences.length,
    bookContextChars: String(contextPackage.bookContext || "").length,
    indexedTopicCount: contextPackage.meta.indexedTopicCount
  }, null, 2));

  if (!contextPackage.bookContext || references.length < chapter.topics.length) {
    throw new Error(`Contexto insuficiente para o capitulo ${chapter.id}.`);
  }

  const generated = await generateAiChapterQuiz({
    chapterId: chapter.id,
    stage: "after",
    env: {
      TERMO_AI_QUIZ_MOCK: "true",
      TERMO_QUIZ_TOKEN_SECRET: "smoke-test"
    }
  });

  if (!generated.ok || !generated.quiz) {
    throw new Error(`Falha ao gerar quiz mock para capitulo ${chapter.id}: ${generated.error || "erro desconhecido"}`);
  }

  const mathContract = validateQuizMathContract(generated.quiz);
  if (!mathContract.ok) {
    console.log(JSON.stringify(mathContract, null, 2));
    throw new Error(`Contrato matematico falhou no quiz mock do capitulo ${chapter.id}.`);
  }

  console.log(`Quiz mock OK: ${generated.quiz.quizKey} (${generated.quiz.questions.length} questoes)`);
}

await smokeRawLatexJsonRepair();
