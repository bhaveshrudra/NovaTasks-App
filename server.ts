import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Shared Gemini client utility
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API Route: parse natural language task using Gemini
  app.post("/api/gemini/parse-task", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text prompt is required" });
      }

      if (!ai) {
        // Fallback if API Key is missing: parse with simple heuristic
        const cleanText = text.trim();
        const isPersonal = cleanText.toLowerCase().includes("gym") || 
                           cleanText.toLowerCase().includes("run") || 
                           cleanText.toLowerCase().includes("dinner") || 
                           cleanText.toLowerCase().includes("exercise") || 
                           cleanText.toLowerCase().includes("evening");
                           
        const isHigh = cleanText.toLowerCase().includes("urgent") || 
                       cleanText.toLowerCase().includes("critical") || 
                       cleanText.toLowerCase().includes("high") || 
                       cleanText.toLowerCase().includes("asap");

        return res.json({
          title: cleanText.charAt(0).toUpperCase() + cleanText.slice(1),
          category: isPersonal ? "personal" : "work",
          priority: isHigh ? "high" : "normal",
          estimatedEnergy: "Energy calibrated based on request",
          dueDateText: "Calibrated schedule"
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Parse this task instruction into a structured task object for a futuristic command center app: "${text}".
Current time is ${new Date().toISOString()}.
Determine standard categories ('work' or 'personal') and priorities ('high', 'normal' or 'system').
Suggest a realistic completion timeline/estimation (e.g. "Due in 3 hours" or "Scheduled for 18:00") and estimated energy impact context (e.g. "80% completion energy" or "Recommended based on team availability").`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A summarized, neat title of the action item." },
              category: { type: Type.STRING, enum: ["work", "personal"], description: "Category of task." },
              priority: { type: Type.STRING, enum: ["high", "normal", "system"], description: "The urgency priority level." },
              estimatedEnergy: { type: Type.STRING, description: "A brief, futuristic text explaining energy or recommendation details, like 'Recommended based on team availability' or 'Medium cognitive load'." },
              dueDateText: { type: Type.STRING, description: "Compact timeline text, for example 'Due in 2 hours', 'Recommended at 14:00', or 'Scheduled for tomorrow'." }
            },
            required: ["title", "category", "priority", "estimatedEnergy", "dueDateText"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to process task." });
    }
  });

  // API Route: AI Insights & Suggestion Engine
  app.post("/api/gemini/suggest", async (req, res) => {
    try {
      const { tasks, focusTask } = req.body;

      if (!ai) {
        // Fallback suggest
        return res.json({
          insight: "Peak cognitive capacity detected. Suggesting high-energy focus for tasks.",
          suggestedTasks: [
            {
              title: "Finalize Q4 Strategy Deck",
              priority: "high",
              estimatedEnergy: "Due in 2 hours • 85% completion energy required",
              category: "work"
            },
            {
              title: "Schedule Dev Sync",
              priority: "system",
              estimatedEnergy: "Recommended based on team availability",
              category: "work"
            }
          ]
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Review the current task list and provide 1) a short single-sentence high-tech 'Nova Insight' text summarizing recommended action (e.g. "Optimal window for complex architecture code review detected now." or "Focus window peaking soon. Advise finishing pending high-priority items.") and 2) exactly two recommended futuristic tasks optimized for efficiency.
Current task list: ${JSON.stringify(tasks)}
Active/Focus objective: ${JSON.stringify(focusTask)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insight: { type: Type.STRING, description: "A neat single-sentence futuristic commander advice." },
              suggestedTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Futuristic/highly technical sounding task name." },
                    category: { type: Type.STRING, enum: ["work", "personal"] },
                    priority: { type: Type.STRING, enum: ["high", "system", "normal"] },
                    estimatedEnergy: { type: Type.STRING, description: "Energy or priority text details, e.g. 'Recommended based on team availability' or '85% completion energy required'." }
                  },
                  required: ["title", "category", "priority", "estimatedEnergy"]
                }
              }
            },
            required: ["insight", "suggestedTasks"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to suggest." });
    }
  });

  // API Route: Voice assistant smart agent handler
  app.post("/api/gemini/voice-assistant", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text prompt is required" });
      }

      const lower = text.toLowerCase();

      if (!ai) {
        // Heuristic fallback offline parser
        let action = "TALK";
        let talkResponse = `Neural connection sandbox online. Transcribed instruction: "${text}". Standing by for core authorization.`;
        let taskData: any = null;
        let alarmData: any = null;

        if (lower.includes("task") || lower.includes("schedule") || lower.includes("add") || lower.includes("todo")) {
          action = "CREATE_TASK";
          const title = text.replace(/add task|add a task|schedule task|to schedule|task|todo/gi, "").trim();
          taskData = {
            title: title || "New Calibrated Objective",
            category: lower.includes("personal") || lower.includes("gym") || lower.includes("home") || lower.includes("run") ? "personal" : "work",
            priority: lower.includes("important") || lower.includes("high") || lower.includes("critical") ? "high" : "normal",
            dueDateText: "Calibrated Today"
          };
          talkResponse = `Calibrating task parameters. Added objective "${taskData.title}" to database stream.`;
        } else if (lower.includes("alarm") || lower.includes("timer") || lower.includes("trigger") || lower.includes("wake")) {
          action = "CREATE_ALARM";
          // Match HH:MM format or single digit clocks
          const timeMatch = text.match(/([0-1]?[0-9]|2[0-3])[:.]([0-5][0-9])/);
          const time = timeMatch ? `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}` : "08:30";
          const title = text.replace(/set alarm|alarm for|wake up|at|for/gi, "").replace(/([0-1]?[0-9]|2[0-3])[:.]([0-5][0-9])/, "").trim() || "Active Intercept Trigger";
          alarmData = {
            title,
            time
          };
          talkResponse = `Synthesized alarm array. Calibrated trigger intercept point for ${time} labeled "${title}".`;
        } else if (lower.includes("efficiency") || lower.includes("overview") || lower.includes("insight") || lower.includes("status")) {
          action = "SUGGEST_STRATEGY";
          talkResponse = "Focus coefficients are optimal. Commander activity index is high. Keep maintaining active constraints.";
        }

        return res.json({ action, talkResponse, taskData, alarmData });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the user's spoken voice command. Categorize their intent, extract details to create a task or an alarm if requested, and draft an authoritative, modern, clean tactical AI response to speak back.
Voice input: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING, enum: ["CREATE_TASK", "CREATE_ALARM", "SUGGEST_STRATEGY", "TALK"] },
              talkResponse: { type: Type.STRING, description: "A simple, highly polished verbal response to speak back in the role of Nova Tactical Assistant." },
              taskData: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ["work", "personal"] },
                  priority: { type: Type.STRING, enum: ["normal", "high", "system"] },
                  dueDateText: { type: Type.STRING }
                },
                required: ["title", "category", "priority", "dueDateText"]
              },
              alarmData: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  time: { type: Type.STRING }
                },
                required: ["title", "time"]
              }
            },
            required: ["action", "talkResponse"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to process voice command" });
    }
  });

  // API Route: AI Text-to-Speech Generation using gemini-3.1-flash-tts-preview
  app.post("/api/gemini/tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      if (!ai) {
        return res.json({ success: false, error: "AI Client not initiated" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        res.json({ success: true, audioData });
      } else {
        res.json({ success: false, error: "No audio generated from Google GenAI" });
      }
    } catch (e: any) {
      console.error("TTS Endpoint Error:", e);
      res.status(500).json({ error: e.message || "TTS conversion failed" });
    }
  });

  // Serve static assets or use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
