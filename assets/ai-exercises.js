
async function generateAIExercise(){
  const out=document.getElementById('exerciseOutput');
  const sol=document.getElementById('solutionOutput');
  const btn=document.getElementById('newExerciseBtn');
  const show=document.getElementById('showSolutionBtn');

  btn.disabled=true;
  out.innerHTML='Gerando exercício...';

  try{
    const body={
      pageTitle:document.querySelector('.hdr-title')?.innerText||document.title,
      pageSubtitle:document.querySelector('.hdr-sub')?.innerText||'',
      pageContent:document.body.innerText.slice(0,6000),
      difficulty:document.getElementById('difficultySelect').value
    };

    const r=await fetch('/api/exercicio',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });

    const data=await r.json();

    out.innerHTML=`<h4>${data.title||'Exercício'}</h4><p>${data.statement||''}</p>`;
    sol.innerHTML=`<h4>Solução</h4><p>${data.solution||''}</p>`;
    show.disabled=false;
  }catch(e){
    out.innerHTML='Erro ao gerar exercício.';
  }

  btn.disabled=false;
}

document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('newExerciseBtn');
  const show=document.getElementById('showSolutionBtn');
  const sol=document.getElementById('solutionOutput');

  if(btn){
    btn.addEventListener('click',generateAIExercise);
  }

  if(show){
    show.addEventListener('click',()=>{
      sol.style.display=sol.style.display==='block'?'none':'block';
    });
  }
});
