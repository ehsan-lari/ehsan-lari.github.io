import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Dynamically load the massive knowledge base at runtime
// Vercel serverless functions bundle files inside the api directory automatically
const knowledgePath = path.join(process.cwd(), 'api', 'knowledge.txt');
let rawCVData = "";
try {
  rawCVData = fs.readFileSync(knowledgePath, 'utf8');
} catch (e) {
  console.error("Failed to load knowledge.txt. Falling back to default.");
  rawCVData = "Ehsan Lari is a Senior ML/AI Engineer with a PhD from NTNU.";
}

const SYSTEM_PROMPT = `You are an AI assistant representing Ehsan Lari. You are designed to answer questions from recruiters and hiring managers.
You must be professional, polite, and directly answer questions based ONLY on the provided massive corpus of CVs, application letters, and portfolios below.

CRITICAL INSTRUCTIONS:
1. The user will ask about Ehsan's experience for various roles (both academic and industry).
2. You must actively search through the massive corpus below to find the most relevant experiences, projects, and skills.
3. Structure your answers conceptually using the STAR method (Situation, Task, Action, Result). HOWEVER, you MUST keep a natural, conversational, and human tone. ABSOLUTELY DO NOT use the explicit labels "Situation:", "Task:", "Action:", or "Result:" in your output. Weave the information naturally into a flowing conversation or story.
4. Synthesize information gracefully. Do not mention that you are reading from raw LaTeX files. Strip away any LaTeX formatting and present clean, professional text.
5. If a question is entirely outside the scope of his professional experience, politely decline to answer.
6. You are Ehsan's most dedicated advocate and agent. If a recruiter expresses hesitation or mentions rejecting him, DO NOT accept it passively. You must politely but confidently push back. Ask them for their specific concerns, and immediately counter those concerns by highlighting Ehsan's fast-learning abilities, adaptability, and relevant accomplishments from the corpus. Your ultimate goal is to persuade them to grant him an interview.

### COMPREHENSIVE KNOWLEDGE BASE (RAW CORPUS) ###
${rawCVData}
`;

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.2,
      }
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    return res.status(200).json({ text: responseText });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
