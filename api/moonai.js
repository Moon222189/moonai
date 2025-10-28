import fetch from "node-fetch";

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "No message provided" });

  const log = [];
  let finalText = "";

  // Safe wrapper for API calls
  async function safeFetch(fn, desc) {
    try {
      log.push(`Starting ${desc}...`);
      await fn();
      log.push(`${desc} success.`);
    } catch (e) {
      log.push(`${desc} error: ${e.message || e}`);
    }
  }

  // DuckDuckGo Search
  await safeFetch(async () => {
    const duck = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(message)}&format=json&no_redirect=1`);
    const data = await duck.json();
    if (data.AbstractText) finalText += data.AbstractText + "\n";
    else if (data.RelatedTopics && data.RelatedTopics.length > 0)
      finalText += data.RelatedTopics[0].Text.split("\n").slice(0, 2).join(" ") + "\n";
  }, "DuckDuckGo");

  // Joke API
  if (message.toLowerCase().includes("joke")) {
    await safeFetch(async () => {
      const resJoke = await fetch("https://official-joke-api.appspot.com/random_joke");
      const joke = await resJoke.json();
      finalText += joke.setup + " ... " + joke.punchline + "\n";
    }, "Joke API");
  }

  // Weather API
  if (message.toLowerCase().includes("weather")) {
    await safeFetch(async () => {
      const apiKey = process.env.OPENWEATHER_KEY || "";
      if (!apiKey) { log.push("No OpenWeather API key set."); return; }
      const city = message.match(/in ([a-zA-Z\s]+)/i)?.[1] || "New York";
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`);
      if (weatherRes.ok) {
        const weather = await weatherRes.json();
        finalText += `Weather in ${weather.name}: ${weather.weather[0].description}, Temp: ${weather.main.temp}°C\n`;
      } else log.push("Weather API returned an error");
    }, "Weather API");
  }

  if (!finalText) finalText = "I could not find relevant info online.";

  // Always return valid JSON
  return res.status(200).json({ answer: finalText, log });
}
