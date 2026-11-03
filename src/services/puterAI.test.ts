import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateAIRecommendations } from "./puterAI";
import type { JobDetails, ParsedResume, SkillComparison } from "../types";

const resume: ParsedResume = {
  fullText: "Figma designer with product research experience.",
  email: null,
  phone: null,
  sections: {
    summary: "",
    skills: "Figma",
    experience: "Product research",
    education: "",
    projects: "",
    certifications: "",
  },
};
const job: JobDetails = {
  title: "Product Designer",
  description: "Design customer facing products for our users.",
  responsibilities: "",
  requiredSkills: "Figma",
  requiredExperience: "",
  education: "",
};
const skills: SkillComparison = {
  matching: ["Figma"],
  missing: [],
  partial: [],
  keywords: [],
};

describe("generateAIRecommendations", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns suggestions from the official Puter chat response", async () => {
    const request = vi.fn(async () => ({
      message: { content: "1. Clarify how you used Figma.\n2. Add measurable outcomes where accurate." },
    }));

    await expect(generateAIRecommendations(resume, job, skills, request)).resolves.toEqual({
      ok: true,
      recommendations: [
        "Clarify how you used Figma.",
        "Add measurable outcomes where accurate.",
      ],
    });
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining("RESUME TEXT:"),
      expect.objectContaining({ model: "gpt-5.4-nano", normalize: true }),
    );
  });

  it("surfaces API failures instead of returning mock suggestions", async () => {
    const request = vi.fn(async () => {
      throw new Error("rate limited");
    });
    await expect(generateAIRecommendations(resume, job, skills, request)).resolves.toEqual({
      ok: false,
      error: "rate limited",
    });
  });
});
