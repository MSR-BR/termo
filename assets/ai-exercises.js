
(function(){
  function ready(fn){
    if(document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function escapeHtml(str){
    return String(str || "").replace(/[&<>"']/g, s => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[s]));
  }

  function textToParagraphs(str){
    const text = String(str || "").trim();
    if(!text) return "";
    return text.split(/\n{2,}|\r?\n/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join("");
  }

  function pageContext(box){
    const title = document.querySelector(".hdr-title")?.innerText || document.title || "";
    const subtitle = document.querySelector(".hdr-sub")?.innerText || "";
    const cards = Array.from(document.querySelectorAll(".card:not(.ai-exercise-card)"))
      .map(card => card.innerText.trim())
      .filter(Boolean)
      .join("\n\n");
    return { title, subtitle, content: cards };
  }

  ready(function(){
    document.querySelectorAll(".ai-exercise-card").forEach(function(box){
      const newBtn = box.querySelector(".newExerciseBtn");
      const solBtn = box.querySelector(".showSolutionBtn");
      const select = box.querySelector(".difficultySelect");
      const exerciseOutput = box.querySelector(".exerciseOutput");
      const solutionOutput = box.querySelector(".solutionOutput");
      let currentSolution = "";

      function setMessage(msg){
        exerciseOutput.innerHTML = `<p class="ai-status">${msg}</p>`;
      }

      function renderExercise(data){
        currentSolution = data.solution || "";
        exerciseOutput.innerHTML = `
          <h4>${escapeHtml(data.title || "Exercício gerado")}</h4>
          ${textToParagraphs(data.statement || "")}
        `;
        solutionOutput.innerHTML = `
          <h4>Solução comentada</h4>
          ${textToParagraphs(currentSolution)}
        `;
        solutionOutput.style.display = "none";
        solBtn.disabled = !currentSolution;
        solBtn.textContent = "Ver solução";
      }

      async function generateExercise(){
        const ctx = pageContext(box);
        const difficulty = select ? select.value : "medio";
        newBtn.disabled = true;
        solBtn.disabled = true;
        solutionOutput.style.display = "none";
        setMessage("Gerando exercício...");

        try{
          const res = await fetch("/api/exercicio", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              pageTitle: ctx.title,
              pageSubtitle: ctx.subtitle,
              pageContent: ctx.content,
              difficulty,
              level: "graduação em Física",
              language: "pt-BR"
            })
          });

          const data = await res.json().catch(() => ({}));
          if(!res.ok){
            throw new Error(data.error || `Erro ${res.status}`);
          }
          renderExercise(data);
        }catch(err){
          setMessage(`Não foi possível gerar o exercício. Detalhe: ${escapeHtml(err.message || err)}. Verifique se /api/exercicio existe no Vercel e se GEMINI_API_KEY está configurada.`);
        }finally{
          newBtn.disabled = false;
        }
      }

      newBtn.addEventListener("click", generateExercise);
      solBtn.addEventListener("click", function(){
        const visible = solutionOutput.style.display === "block";
        solutionOutput.style.display = visible ? "none" : "block";
        solBtn.textContent = visible ? "Ver solução" : "Ocultar solução";
      });
    });
  });
})();
