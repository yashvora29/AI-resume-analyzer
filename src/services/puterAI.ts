import { puter } from "@heyputer/puter.js";
import type { JobDetails, ParsedResume, SkillComparison } from "../types";

export type AIRecommendationsResult =
  | { ok: true; recommendations: string[] }
  | { ok: false; error: string };

type ChatOptions = {
  model: string;
  normalize: true;
  temperature: number;
  max_tokens: number;
};

type ChatResponse = {
  message?: { content?: unknown };
};

type AIChatRequest = (prompt: string, options: ChatOptions) => Promise<ChatResponse>;

const requestPuterAI: AIChatRequest = (prompt, options) => puter.ai.chat(prompt, options);

export async function generateAIRecommendations(
  resume: ParsedResume,
  job: JobDetails,
  skills: SkillComparison,
  requestAI: AIChatRequest = requestPuterAI,
): Promise<AIRecommendationsResult> {
  const prompt = [
    "You are a careful resume coach. Give 3 to 5 short, specific, actionable suggestions based only on the supplied resume evidence and job requirements.",
    "Do not claim the candidate has any skill, experience, achievement, or qualification that is not explicitly supported by the resume.",
    "Never suggest inventing or exaggerating details. If a requirement is absent, say to add it only if it is true.",
    "Return only a numbered list of suggestions, with no introduction or conclusion.",
    "",
    `JOB TITLE: ${job.title}`,
    `JOB DESCRIPTION: ${job.description}`,
    `RESPONSIBILITIES: ${job.responsibilities || "Not provided"}`,
    `REQUIRED SKILLS: ${job.requiredSkills || "Not provided"}`,
    `REQUIRED EXPERIENCE: ${job.requiredExperience || "Not provided"}`,
    `EDUCATION: ${job.education || "Not provided"}`,
    `SKILLS MATCHING THE RESUME TEXT: ${skills.matching.join(", ") || "None detected"}`,
    `POSSIBLE SKILL OVERLAPS TO VERIFY: ${skills.partial.join(", ") || "None detected"}`,
    `SKILLS NOT FOUND IN THE RESUME: ${skills.missing.join(", ") || "None detected"}`,
    "",
    "RESUME TEXT:",
    resume.fullText.slice(0, 12_000),
  ].join("\n");

  let response;
  try {
    response = await requestAI(prompt, {
      model: "gpt-5.4-nano",
      normalize: true,
      temperature: 0.2,
      max_tokens: 700,
    });
  } catch (error) {
    return {
      ok: false,
      error: errorMessage(error),
    };
  }
  const content = response.message?.content;
  const responseText = typeof content === "string" ? content : "";
  const recommendations = responseText
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length > 12)
    .slice(0, 5);

  if (!recommendations.length) {
    return { ok: false, error: "The AI returned no usable recommendations." };
  }
  return { ok: true, recommendations };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "The Puter AI request failed.";
}
