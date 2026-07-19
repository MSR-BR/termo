import { validateExerciseMathContract } from "../lib/math-format-validator.mjs";

const cases = [
  {
    name: "valid inline and display math",
    expectedOk: true,
    exercise: {
      title: "Energia livre",
      statement: "A energia livre de Helmholtz e \\(F = U - TS\\).",
      solution: "Logo, em temperatura constante:\n\\[dF = -P\\,dV\\]"
    }
  },
  {
    name: "dollar delimiters are rejected",
    expectedOk: false,
    exercise: {
      title: "Energia livre",
      statement: "Use $F = U - TS$ para o potencial.",
      solution: "Resposta curta."
    }
  },
  {
    name: "raw latex command is rejected",
    expectedOk: false,
    exercise: {
      title: "Derivada",
      statement: "Calcule \\frac{dF}{dT}.",
      solution: "Resposta curta."
    }
  },
  {
    name: "bare assignment is rejected",
    expectedOk: false,
    exercise: {
      title: "Entalpia",
      statement: "A entalpia e H = U + PV.",
      solution: "Resposta curta."
    }
  },
  {
    name: "unbalanced delimiter is rejected",
    expectedOk: false,
    exercise: {
      title: "Potencial",
      statement: "A expressao e \\(F = U - TS.",
      solution: "Resposta curta."
    }
  }
];

let failures = 0;

for (const entry of cases) {
  const result = validateExerciseMathContract(entry.exercise);
  const ok = result.ok === entry.expectedOk;
  console.log(`\n${ok ? "OK" : "FAIL"} - ${entry.name}`);
  console.log(JSON.stringify({
    expectedOk: entry.expectedOk,
    actualOk: result.ok,
    errorCodes: result.errors.map((error) => `${error.field}:${error.code}`),
    warningCodes: result.warnings.map((warning) => `${warning.field}:${warning.code}`)
  }, null, 2));

  if (!ok) failures += 1;
}

if (failures > 0) {
  process.exitCode = 1;
}
