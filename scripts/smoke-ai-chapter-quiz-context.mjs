import {
  buildAiChapterQuizContextPackage,
  generateAiChapterQuiz,
  listAiQuizChapters,
  validateQuizMathContract
} from "../lib/gamification-ai-quiz.mjs";

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
