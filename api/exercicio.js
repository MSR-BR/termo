
export default async function handler(req,res){
 if(req.method!=='POST'){
   return res.status(405).json({error:'Use POST'});
 }

 const apiKey=process.env.GEMINI_API_KEY;

 if(!apiKey){
   return res.status(500).json({error:'GEMINI_API_KEY missing'});
 }

 const {pageTitle='',pageSubtitle='',pageContent='',difficulty='medio'}=req.body||{};

 const prompt=`Crie um exercício de termodinâmica em português.
Tema: ${pageTitle}
Subtítulo: ${pageSubtitle}
Conteúdo: ${pageContent}
Dificuldade: ${difficulty}

Responda SOMENTE em JSON:
{
"title":"...",
"statement":"...",
"solution":"..."
}`;

 try{
   const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({
       contents:[{parts:[{text:prompt}]}]
     })
   });

   const data=await r.json();
   const raw=data?.candidates?.[0]?.content?.parts?.[0]?.text||'{}';

   let parsed={};
   try{parsed=JSON.parse(raw);}catch{}

   return res.status(200).json(parsed);
 }catch(e){
   return res.status(500).json({error:String(e)});
 }
}
