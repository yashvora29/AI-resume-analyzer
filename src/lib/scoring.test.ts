import { describe, expect, it } from "vitest";
import { parseResumeText } from "./resumeParser";
import { analyzeResume, SCORE_WEIGHTS } from "./scoring";
import type { JobDetails } from "../types";

const baseJob: JobDetails = {
  title: "Product Designer",
  description: "Design intuitive customer experiences and accessible digital products.",
  responsibilities: "Lead user research and collaborate with product teams.",
  requiredSkills: "Figma, user research, React Native, Kubernetes",
  requiredExperience: "Lead user research for digital products.",
  education: "Bachelor degree in design",
};

const baseResume = parseResumeText(
  [
    "Jordan Lee",
    "jordan@example.com",
    "SUMMARY",
    "Product designer focused on accessible customer experiences.",
    "SKILLS",
    "Figma, user research, React",
    "EXPERIENCE",
    "Led user research for digital products with product teams.",
    "EDUCATION",
    "Bachelor degree in design",
    "PROJECTS",
    "Accessibility project",
  ].join("\n"),
);

describe("analyzeResume", () => {
  it("uses score weights that total exactly 100", () => {
    expect(Object.values(SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0)).toBe(100);
    const analysis = analyzeResume(baseResume, baseJob);
    expect(analysis.metrics.map((metric) => metric.weight)).toEqual([35, 25, 15, 10, 15]);
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.overallScore).toBeLessThanOrEqual(100);
    const activeMetrics = analysis.metrics.filter(
      (item): item is typeof item & { score: number } => item.score !== null,
    );
    const activeWeight = activeMetrics.reduce((sum, item) => sum + item.weight, 0);
    const expectedOverall = Math.round(
      activeMetrics.reduce((sum, item) => sum + item.score * item.weight, 0) / activeWeight,
    );
    expect(analysis.overallScore).toBe(expectedOverall);
  });

  it("distinguishes exact, partial, and missing skill evidence", () => {
    const analysis = analyzeResume(baseResume, baseJob);
    expect(analysis.skills.matching).toEqual(["Figma", "user research"]);
    expect(analysis.skills.partial).toEqual(["React Native"]);
    expect(analysis.skills.missing).toEqual(["Kubernetes"]);
    expect(analysis.metrics.find((metric) => metric.key === "skills")?.score).toBe(63);
  });

  it("excludes criteria without supplied requirements and renormalizes active weights", () => {
    const analysis = analyzeResume(baseResume, {
      ...baseJob,
      requiredSkills: "",
      requiredExperience: "",
      responsibilities: "",
      education: "",
    });
    expect(analysis.metrics.find((metric) => metric.key === "skills")?.score).toBeNull();
    expect(analysis.metrics.find((metric) => metric.key === "experience")?.score).toBeNull();
    expect(analysis.metrics.find((metric) => metric.key === "education")?.score).toBeNull();
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("builds recommendations without asserting missing skills are possessed", () => {
    const analysis = analyzeResume(baseResume, baseJob);
    expect(analysis.recommendations.join(" ")).toContain("Kubernetes");
    expect(analysis.recommendations.join(" ")).toContain("only if you genuinely have");
  });

  it("scores a sparse resume without throwing", () => {
    const analysis = analyzeResume(parseResumeText("Avery Stone"), {
      ...baseJob,
      requiredSkills: "",
      requiredExperience: "",
      responsibilities: "",
      education: "",
    });
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.metrics.find((metric) => metric.key === "structure")?.score).toBe(0);
  });
});
