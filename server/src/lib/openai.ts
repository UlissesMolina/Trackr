import OpenAI from "openai";

// Created on first use: the SDK throws when OPENAI_API_KEY is missing, and the
// server has to run without it (Gmail sync falls back to rule-based classification).
let client: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY?.trim();
}

export function getOpenAI(): OpenAI {
  if (!isOpenAIConfigured()) {
    throw new Error("AI features need an OpenAI API key. Set OPENAI_API_KEY on the server.");
  }
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}
