import { GoogleGenerativeAI } from "@google/generative-ai"
import { env } from "./env.js"
import { logger } from "../utils/logger.js"

let geminiClient = null

if (env.ai.geminiApiKey) {
  geminiClient = new GoogleGenerativeAI(env.ai.geminiApiKey)
}

export const isAiConfigured = () => {
  if (env.ai.provider === "openai") {
    return Boolean(env.ai.openaiApiKey)
  }
  return Boolean(geminiClient)
}

const callGemini = async ({ systemPrompt, userPrompt, jsonMode = false }) => {
  if (!geminiClient) {
    throw new Error("Gemini API is not configured")
  }
  const model = geminiClient.getGenerativeModel({
    model: env.ai.geminiModel,
    ...(jsonMode
      ? { generationConfig: { responseMimeType: "application/json" } }
      : {})
  })
  const parts = []
  if (systemPrompt) {
    parts.push({ text: systemPrompt })
  }
  parts.push({ text: userPrompt })
  const result = await model.generateContent({
    contents: [{ role: "user", parts }]
  })
  return result.response.text()
}

const callOpenAi = async ({ systemPrompt, userPrompt, jsonMode = false }) => {
  if (!env.ai.openaiApiKey) {
    throw new Error("OpenAI API is not configured")
  }
  const messages = []
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt })
  }
  messages.push({ role: "user", content: userPrompt })

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ai.openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.ai.openaiModel,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {})
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}

export const generateAiText = async ({ systemPrompt, userPrompt, jsonMode = false }) => {
  try {
    if (env.ai.provider === "openai") {
      return await callOpenAi({ systemPrompt, userPrompt, jsonMode })
    }
    return await callGemini({ systemPrompt, userPrompt, jsonMode })
  } catch (error) {
    logger.error(`AI generation failed (${env.ai.provider}): ${error.message}`)
    throw error
  }
}

export const parseAiJson = (rawText) => {
  const trimmed = rawText.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const payload = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(payload)
}
