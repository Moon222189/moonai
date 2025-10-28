// api/moonai.js
import fetch from "node-fetch";

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).send("Method not allowed");
  const { message } = req.body;
  if(!message) return res.status(400).json({error:"No message provided"});
  
  const log=[];
  let answer="";

  // DuckDuckGo search
  try{
    log.push("DuckDuckGo fetching...");
    const resDuck=await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(message)}&format=json&no_redirect=1`);
    const data=await resDuck.json();
    if(data.AbstractText) answer+=data.AbstractText+"\n";
    else if(data.RelatedTopics && data.RelatedTopics.length>0) answer+=data.RelatedTopics[0].Text.split('\n').slice(0,2).join(' ')+"\n";
    log.push("DuckDuckGo success");
  }catch(e){ log.push("DuckDuckGo error: "+e); }

  // Joke API
  if(message.toLowerCase().includes("joke")){
    try{
      log.push("Fetching joke...");
      const resJoke=await fetch('https://official-joke-api.appspot.com/random_joke');
      const joke=await resJoke.json();
      answer+=joke.setup+" ... "+joke.punchline+"\n";
      log.push("Joke fetched");
    }catch(e){ log.push("Joke error: "+e); }
  }

  if(!answer) answer="I could not find relevant online info.";
  res.json({answer,log});
}
