import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let geminiClient: GoogleGenAI | null = null;
if (env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  } catch (err: any) {
    logger.warn('Failed to initialize GoogleGenAI client:', err.message);
  }
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  structuredJson?: any;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
}

export const aiService = {
  /**
   * Primary completion method with automatic fallback from Gemini to Groq
   */
  async generateCompletion(
    messages: AIChatMessage[],
    options: {
      jsonMode?: boolean;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    const { jsonMode = false, systemPrompt, temperature = 0.2, maxTokens = 2048 } = options;

    // 1. Try Gemini first if available
    if (geminiClient && env.GEMINI_API_KEY) {
      try {
        const fullPrompt = [
          systemPrompt ? `[SYSTEM INSTRUCTIONS]:\n${systemPrompt}\n\n` : '',
          ...messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
        ].join('\n\n');

        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
          config: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: jsonMode ? 'application/json' : 'text/plain'
          }
        });

        const text = response.text || '';
        if (text) return text.trim();
      } catch (geminiError: any) {
        logger.warn(`Gemini generation failed, falling back to Groq: ${geminiError.message}`);
      }
    }

    // 2. Fallback to Groq
    if (env.GROQ_API_KEY) {
      try {
        const groqMessages = [];
        if (systemPrompt) {
          groqMessages.push({ role: 'system', content: systemPrompt });
        }
        for (const msg of messages) {
          groqMessages.push({ role: msg.role, content: msg.content });
        }

        const res = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'qwen/qwen3.8-27b',
            messages: groqMessages,
            temperature,
            max_tokens: maxTokens,
            response_format: jsonMode ? { type: 'json_object' } : undefined
          },
          {
            headers: {
              Authorization: `Bearer ${env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 25000
          }
        );

        const content = res.data?.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } catch (groqError: any) {
        logger.error(`Groq completion failed: ${groqError.message}`);
      }
    }

    throw new Error('All AI providers failed or are unconfigured.');
  },

  /**
   * Generates strictly validated JSON structured output
   */
  async generateStructuredOutput<T>(
    prompt: string,
    systemInstruction: string,
    fallbackValue?: T
  ): Promise<T> {
    try {
      const responseText = await this.generateCompletion(
        [{ role: 'user', content: prompt }],
        {
          jsonMode: true,
          systemPrompt: `${systemInstruction}\n\nCRITICAL: Return ONLY a valid, single raw JSON object matching the requested schema. Do not enclose in markdown ticks if jsonMode is active.`
        }
      );

      // Clean up markdown block if model output includes ```json ... ```
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(cleaned) as T;
    } catch (err: any) {
      logger.error('Failed to parse AI structured output:', err.message);
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw err;
    }
  },

  /**
   * Analyzes syllabus / handout document text and extracts course, units, assignments, and exams
   */
  async extractCourseHandout(extractedText: string): Promise<{
    courseName: string;
    courseCode: string;
    instructor?: string;
    units: Array<{
      unitNumber: number;
      title: string;
      topics: string[];
      learningObjectives?: string[];
    }>;
    assignments: Array<{
      title: string;
      description?: string;
      dueDate?: string;
      estimatedMinutes?: number;
      weight?: number;
    }>;
    assessments: Array<{
      title: string;
      type: 'cat' | 'midterm' | 'final' | 'quiz' | 'lab_exam' | 'project';
      date?: string;
      syllabus?: string;
      weight?: number;
    }>;
    recommendedMaterials: string[];
  }> {
    const prompt = `You are the NEXUS AI Academic Extractor. Analyze the following course handout / syllabus document thoroughly and extract structured academic details into clean JSON.

DOCUMENT CONTENT:
"""
${extractedText.slice(0, 15000)}
"""

JSON SCHEMA REQUIREMENTS:
{
  "courseName": "string",
  "courseCode": "string",
  "instructor": "string (optional)",
  "units": [
    {
      "unitNumber": 1,
      "title": "string",
      "topics": ["topic 1", "topic 2"],
      "learningObjectives": ["objective 1"]
    }
  ],
  "assignments": [
    {
      "title": "string",
      "description": "string",
      "dueDate": "YYYY-MM-DD (ISO date format if identifiable or estimate based on course timeline)",
      "estimatedMinutes": 90,
      "weight": 10
    }
  ],
  "assessments": [
    {
      "title": "CAT-1 / Midterm / etc.",
      "type": "cat" | "midterm" | "final" | "quiz" | "lab_exam" | "project",
      "date": "YYYY-MM-DD",
      "syllabus": "Units covered",
      "weight": 25
    }
  ],
  "recommendedMaterials": ["Textbook / Reference link"]
}`;

    const systemInstruction =
      'You are a precise academic parser. Extract the real syllabus details. If specific dates are mentioned, extract them in YYYY-MM-DD format. If exact dates are not mentioned, estimate sensible future dates based on typical semester timelines.';

    return this.generateStructuredOutput(prompt, systemInstruction, {
      courseName: 'Extracted Course',
      courseCode: 'COURSE101',
      units: [],
      assignments: [],
      assessments: [],
      recommendedMaterials: []
    });
  }
};
