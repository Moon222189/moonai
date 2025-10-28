import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  const { message } = req.body;
  if (!message) return res.status(400).json({error:"No message provided"});

  const log = [];
  let finalText = "";

  // --- DuckDuckGo ---
  try {
    log.push("Searching DuckDuckGo...");
    const duck = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(message)}&format=json&no_redirect=1`);
    const data = await duck.json();
    if (data.AbstractText) finalText += data.AbstractText + "\n";
    else if (data.RelatedTopics && data.RelatedTopics.length > 0)
      finalText += data.RelatedTopics[0].Text.split("\n").slice(0, 2).join(" ") + "\n";
    log.push("DuckDuckGo fetched successfully.");
  } catch (e) {
    log.push("DuckDuckGo error: " + e);
  }

  // --- Joke API ---
  if (message.toLowerCase().includes("joke")) {
    try {
      log.push("Fetching a joke...");
      const resJoke = await fetch("https://official-joke-api.appspot.com/random_joke");
      const joke = await resJoke.json();
      finalText += joke.setup + " ... " + joke.punchline + "\n";
      log.push("Joke fetched.");
    } catch (e) {
      log.push("Joke fetch error: " + e);
    }
  }

  // --- Weather API ---
  if (message.toLowerCase().includes("weather")) {
    try {
      const apiKey = process.env.OPENWEATHER_KEY || "";
      if(!apiKey){ log.push("No OpenWeatherMap API key set."); }
      else{
        log.push("Fetching weather...");
        const city = message.match(/in ([a-zA-Z\s]+)/i)?.[1] || "New York";
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
        if(weatherRes.ok){
          const weather = await weatherRes.json();
          finalText += `Weather in ${weather.name}: ${weather.weather[0].description}, Temp: ${weather.main.temp}°C\n`;
          log.push("Weather fetched.");
        } else log.push("Weather API returned an error");
      }
    } catch (e) { log.push("Weather fetch error: " + e); }
  }

  if (!finalText) finalText = "I couldn't find relevant info online. Try asking something else.";

  // Always return valid JSON
  return res.status(200).json({answer: finalText, log});
}
