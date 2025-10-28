import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

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
  } catch (e) { log.push("DuckDuckGo error: " + e); }

  // --- Joke API ---
  if (message.toLowerCase().includes("joke")) {
    try {
      log.push("Fetching a joke...");
      const resJoke = await fetch("https://official-joke-api.appspot.com/random_joke");
      const joke = await resJoke.json();
      finalText += joke.setup + " ... " + joke.punchline + "\n";
      log.push("Joke fetched.");
    } catch (e) { log.push("Joke fetch error: " + e); }
  }

  // --- Weather API ---
  if (message.toLowerCase().includes("weather")) {
    try {
      log.push("Fetching weather...");
      const apiKey = process.env.OPENWEATHER_KEY; // Set in Vercel Environment Variables
      const city = message.match(/in ([a-zA-Z\s]+)/i)?.[1] || "New York";
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
      const weather = await weatherRes.json();
      finalText += `Weather in ${weather.name}: ${weather.weather[0].description}, Temp: ${weather.main.temp}°C\n`;
      log.push("Weather fetched.");
    } catch (e) { log.push("Weather fetch error: " + e); }
  }

  if (!finalText) finalText = "I couldn't find relevant online info. Try another question.";

  return res.json({ answer: finalText, log });
}
