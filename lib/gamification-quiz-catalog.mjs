function buildQuestion(question, questionId) {
  return {
    questionId,
    prompt: question.prompt,
    options: question.options,
    correct: question.correct,
    explanation: question.explanation,
    reviewItem: question.reviewItem,
    reviewTitle: question.reviewTitle,
    reviewPath: question.reviewPath,
    reviewWhy: question.reviewWhy,
    reviewCheck: question.reviewCheck
  };
}

const QUIZ_CATALOG = {
  cap02: {
    quizKey: "cap02",
    chapterId: "02",
    chapterCode: "Capitulo 02",
    chapterTitle: "Potenciais Termodinamicos e Transformacoes de Legendre",
    note: "Foco em leitura conceitual e conexao entre definicoes e derivadas naturais.",
    rewardXp: 30,
    rewardBonusXp: 15,
    questions: [
      buildQuestion({
        prompt: "Qual potencial e mais adequado quando a temperatura e o volume sao mantidos constantes?",
        options: {
          a: "Entalpia",
          b: "Energia livre de Helmholtz",
          c: "Energia livre de Gibbs",
          d: "Grand potential"
        },
        correct: "b",
        explanation: "Helmholtz usa as variaveis naturais T e V, entao ele organiza melhor problemas nesse regime.",
        reviewItem: "2.3",
        reviewTitle: "Energia Livre de Helmholtz",
        reviewPath: "slides/capitulo-02/page_3.html",
        reviewWhy: "Releia como as variaveis naturais do potencial orientam a escolha correta em cada condicao experimental.",
        reviewCheck: {
          prompt: "Se temperatura e volume sao fixos, qual potencial organiza melhor a analise?",
          options: {
            a: "Energia livre de Helmholtz",
            b: "Entalpia"
          },
          correct: "a",
          reinforcement: "A ideia central e ligar o potencial as variaveis naturais do problema."
        }
      }, "cap02-q1"),
      buildQuestion({
        prompt: "A transformacao de Legendre permite trocar variaveis naturais de um potencial por suas variaveis conjugadas. No caso da energia interna U(S,V), qual troca gera a entalpia H?",
        options: {
          a: "Troca S por T",
          b: "Troca V por P",
          c: "Troca S por mu",
          d: "Troca V por N"
        },
        correct: "b",
        explanation: "A entalpia H = U + PV substitui o volume pela pressao como variavel natural mecanica.",
        reviewItem: "2.4",
        reviewTitle: "Entalpia e Calor Isobarico",
        reviewPath: "slides/capitulo-02/page_4.html",
        reviewWhy: "Vale revisar o papel do termo PV e por que a entalpia reorganiza o problema para processos a pressao constante.",
        reviewCheck: {
          prompt: "Ao formar H = U + PV, qual troca conceitual acontece?",
          options: {
            a: "Volume cede lugar a pressao como variavel natural mecanica",
            b: "Temperatura cede lugar a entropia"
          },
          correct: "a",
          reinforcement: "Pense em qual variavel passa a ser mais conveniente em processos isobaricos."
        }
      }, "cap02-q2"),
      buildQuestion({
        prompt: "Uma relacao de Maxwell nasce principalmente de qual fato estrutural?",
        options: {
          a: "As funcoes de particao sao sempre exponenciais",
          b: "As derivadas mistas de um potencial bem comportado coincidem",
          c: "Toda transformacao termodinamica e reversivel",
          d: "A energia interna depende apenas da temperatura"
        },
        correct: "b",
        explanation: "As relacoes de Maxwell seguem da igualdade das derivadas cruzadas dos potenciais termodinamicos.",
        reviewItem: "2.8",
        reviewTitle: "Relacoes de Maxwell e Retangulo Termodinamico",
        reviewPath: "slides/capitulo-02/page_8.html",
        reviewWhy: "O ponto-chave aqui e ligar derivadas mistas, potenciais e sinais corretos no retangulo termodinamico.",
        reviewCheck: {
          prompt: "As relacoes de Maxwell nascem principalmente de:",
          options: {
            a: "Derivadas cruzadas iguais em potenciais bem comportados",
            b: "Toda transformacao ser reversivel"
          },
          correct: "a",
          reinforcement: "A revisao curta deve fixar a estrutura matematica por tras das relacoes."
        }
      }, "cap02-q3"),
      buildQuestion({
        prompt: "Qual potencial tende a ser mais natural em processos a temperatura e pressao constantes?",
        options: {
          a: "Energia livre de Gibbs",
          b: "Energia interna",
          c: "Entropia",
          d: "Grand potential"
        },
        correct: "a",
        explanation: "Gibbs tem variaveis naturais T e P e por isso domina esse tipo de problema.",
        reviewItem: "2.5",
        reviewTitle: "Energia Livre de Gibbs e Espontaneidade",
        reviewPath: "slides/capitulo-02/page_5.html",
        reviewWhy: "Revise quando Gibbs se torna o potencial mais informativo e como isso aparece em processos espontaneos.",
        reviewCheck: {
          prompt: "Para processos a temperatura e pressao constantes, qual potencial tende a ser mais util?",
          options: {
            a: "Energia livre de Gibbs",
            b: "Energia interna"
          },
          correct: "a",
          reinforcement: "A chave e associar diretamente T e P a escolha do potencial."
        }
      }, "cap02-q4"),
      buildQuestion({
        prompt: "No retangulo termodinamico, o ganho pedagogico principal e:",
        options: {
          a: "Substituir todas as demonstracoes por memorizacao",
          b: "Organizar visualmente pares conjugados e sinais das derivadas",
          c: "Eliminar a necessidade de potenciais",
          d: "Calcular diretamente funcoes de particao"
        },
        correct: "b",
        explanation: "O retangulo ajuda a enxergar estrutura, sinais e relacoes entre potenciais e variaveis conjugadas.",
        reviewItem: "2.8",
        reviewTitle: "Relacoes de Maxwell e Retangulo Termodinamico",
        reviewPath: "slides/capitulo-02/page_8.html",
        reviewWhy: "Se houve duvida aqui, vale revisar o retangulo como mapa visual, nao como decoreba.",
        reviewCheck: {
          prompt: "O retangulo termodinamico ajuda principalmente a:",
          options: {
            a: "Organizar pares conjugados e sinais das derivadas",
            b: "Eliminar a necessidade dos potenciais"
          },
          correct: "a",
          reinforcement: "O objetivo e recuperar a intuicao visual, nao decorar simbolos isolados."
        }
      }, "cap02-q5")
    ]
  },
  cap04: {
    quizKey: "cap04",
    chapterId: "04",
    chapterCode: "Capitulo 04",
    chapterTitle: "Gas de Van der Waals e transicoes de fase",
    note: "Foco em interpretacao fisica, estabilidade e leitura de isotermas.",
    rewardXp: 30,
    rewardBonusXp: 15,
    questions: [
      buildQuestion({
        prompt: "O parametro a da equacao de Van der Waals representa principalmente:",
        options: {
          a: "Volume proprio das moleculas",
          b: "Atracoes intermoleculares",
          c: "Capacidade calorifica do gas",
          d: "Compressibilidade ideal"
        },
        correct: "b",
        explanation: "O termo com a corrige a pressao para levar em conta a atracao entre particulas.",
        reviewItem: "4.2",
        reviewTitle: "Equacao de Estado de Van der Waals",
        reviewPath: "slides/capitulo-04/page_2.html",
        reviewWhy: "Revise o significado fisico dos parametros a e b antes de voltar ao comportamento da isoterma.",
        reviewCheck: {
          prompt: "No modelo de Van der Waals, o parametro a corrige principalmente:",
          options: {
            a: "As atracoes intermoleculares",
            b: "O volume excluido"
          },
          correct: "a",
          reinforcement: "Diferencie com clareza o papel de a e b antes da proxima tentativa."
        }
      }, "cap04-q1"),
      buildQuestion({
        prompt: "O parametro b da equacao de Van der Waals esta ligado a:",
        options: {
          a: "Aumento da entropia configuracional",
          b: "Volume excluido ou tamanho efetivo das moleculas",
          c: "Calor latente de vaporizacao",
          d: "Pressao critica reduzida"
        },
        correct: "b",
        explanation: "b corrige o volume disponivel por causa do espaco ocupado pelas moleculas.",
        reviewItem: "4.2",
        reviewTitle: "Equacao de Estado de Van der Waals",
        reviewPath: "slides/capitulo-04/page_2.html",
        reviewWhy: "Este ponto fica mais claro quando voce compara volume geometrico, volume excluido e a forma da equacao.",
        reviewCheck: {
          prompt: "O parametro b esta mais ligado a qual ideia?",
          options: {
            a: "Espaco efetivamente indisponivel para o movimento molecular",
            b: "Atracao entre as particulas"
          },
          correct: "a",
          reinforcement: "Revisar o significado geometrico de b ajuda a nao confundir com o termo atrativo."
        }
      }, "cap04-q2"),
      buildQuestion({
        prompt: "Uma regiao espinodal indica, em linguagem fisica, que o sistema esta:",
        options: {
          a: "Mecanicamente instavel",
          b: "Sempre em equilibrio termico completo",
          c: "No limite ideal",
          d: "Sem transicao de fase possivel"
        },
        correct: "a",
        explanation: "Na espinodal, pequenas perturbacoes crescem porque a resposta mecanica do sistema fica instavel.",
        reviewItem: "4.5",
        reviewTitle: "Instabilidade Mecanica e Espinodal",
        reviewPath: "slides/capitulo-04/page_9.html",
        reviewWhy: "Vale revisar por que a derivada da pressao com o volume muda o regime de estabilidade.",
        reviewCheck: {
          prompt: "Uma regiao espinodal aponta para um sistema:",
          options: {
            a: "Mecanicamente instavel",
            b: "Necessariamente ideal"
          },
          correct: "a",
          reinforcement: "A revisao curta aqui deve recuperar a intuicao de estabilidade mecanica."
        }
      }, "cap04-q3"),
      buildQuestion({
        prompt: "A construcao de Maxwell em uma isoterma serve para:",
        options: {
          a: "Ajustar a energia interna do gas ideal",
          b: "Substituir o ponto critico por uma reta",
          c: "Restaurar a coexistencia liquido-vapor com areas iguais",
          d: "Eliminar o termo b da equacao"
        },
        correct: "c",
        explanation: "A regra das areas iguais substitui o trecho nao fisico da isoterma por uma pressao de coexistencia.",
        reviewItem: "4.7",
        reviewTitle: "Construcao de Maxwell",
        reviewPath: "slides/capitulo-04/page_13.html",
        reviewWhy: "Reforce a intuicao geometrica da regra das areas iguais e a conexao com coexistencia de fases.",
        reviewCheck: {
          prompt: "A construcao de Maxwell restaura principalmente:",
          options: {
            a: "A coexistencia liquido-vapor com areas iguais",
            b: "O comportamento de gas ideal"
          },
          correct: "a",
          reinforcement: "Pense no trecho nao fisico da isoterma e em como a construcao o substitui."
        }
      }, "cap04-q4"),
      buildQuestion({
        prompt: "Ao aproximar-se do ponto critico, o comportamento mais marcante e:",
        options: {
          a: "A distincao entre fases cresce",
          b: "A curva sempre volta ao comportamento ideal simples",
          c: "Liquido e vapor tornam-se indistinguiveis",
          d: "A compressibilidade vai necessariamente a zero"
        },
        correct: "c",
        explanation: "No ponto critico a separacao clara entre liquido e vapor desaparece.",
        reviewItem: "4.3",
        reviewTitle: "Ponto Critico",
        reviewPath: "slides/capitulo-04/page_6.html",
        reviewWhy: "Revisar o ponto critico ajuda a ligar diagrama, flutuacoes e desaparecimento da fronteira entre fases.",
        reviewCheck: {
          prompt: "Ao chegar ao ponto critico, a diferenca entre liquido e vapor:",
          options: {
            a: "Desaparece",
            b: "Fica ainda maior"
          },
          correct: "a",
          reinforcement: "O ponto critico deve soar como limite em que a separacao entre fases deixa de ser nitida."
        }
      }, "cap04-q5")
    ]
  }
};

function sanitizeQuestion(question) {
  return {
    questionId: question.questionId,
    prompt: question.prompt,
    options: question.options
  };
}

export function listPublishedQuizzes() {
  return Object.values(QUIZ_CATALOG).map(serializeQuizForClient);
}

export function findQuiz({ quizKey = "", chapterId = "" } = {}) {
  if (quizKey && QUIZ_CATALOG[quizKey]) {
    return QUIZ_CATALOG[quizKey];
  }

  return Object.values(QUIZ_CATALOG).find(function (quiz) {
    return quiz.chapterId === chapterId;
  }) || null;
}

export function serializeQuizForClient(quiz) {
  if (!quiz) return null;

  return {
    quizKey: quiz.quizKey,
    chapterId: quiz.chapterId,
    chapterCode: quiz.chapterCode,
    chapterTitle: quiz.chapterTitle,
    note: quiz.note,
    questionCount: quiz.questions.length,
    questions: quiz.questions.map(sanitizeQuestion)
  };
}

export function gradeQuizSubmission({ quiz, answers = [] }) {
  const answerMap = new Map(
    answers.map(function (answer) {
      return [answer.questionId, answer.choice];
    })
  );

  const feedback = quiz.questions.map(function (question) {
    const submittedChoice = answerMap.get(question.questionId) || "";
    const isCorrect = submittedChoice === question.correct;

    return {
      questionId: question.questionId,
      prompt: question.prompt,
      selectedChoice: submittedChoice,
      correctChoice: question.correct,
      isCorrect,
      explanation: question.explanation,
      reviewItem: question.reviewItem,
      reviewTitle: question.reviewTitle,
      reviewPath: question.reviewPath,
      reviewWhy: question.reviewWhy,
      reviewCheck: question.reviewCheck
    };
  });

  const correctCount = feedback.filter(function (item) {
    return item.isCorrect;
  }).length;
  const questionCount = quiz.questions.length;
  const score = questionCount
    ? Math.round((correctCount / questionCount) * 100)
    : 0;

  return {
    chapterId: quiz.chapterId,
    chapterTitle: quiz.chapterTitle,
    quizKey: quiz.quizKey,
    correctCount,
    questionCount,
    score,
    feedback,
    missedFeedback: feedback.filter(function (item) {
      return !item.isCorrect;
    })
  };
}
