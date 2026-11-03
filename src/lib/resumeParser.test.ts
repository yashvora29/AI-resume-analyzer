import { describe, expect, it } from "vitest";
import { parseResumeText } from "./resumeParser";

describe("parseResumeText", () => {
  it("extracts contact information and common resume sections", () => {
    const resume = parseResumeText(
      [
        "Jordan Lee",
        "jordan@example.com | (415) 555-0123",
        "SUMMARY",
        "Product designer with five years of research experience.",
        "SKILLS",
        "Figma, prototyping, user research",
        "PROFESSIONAL EXPERIENCE",
        "Designed onboarding for a customer platform.",
        "EDUCATION",
        "B.A. in Design",
        "PROJECTS",
        "Accessibility redesign",
        "CERTIFICATIONS",
        "Certified UX Practitioner",
      ].join("\n"),
    );

    expect(resume.email).toBe("jordan@example.com");
    expect(resume.phone).toContain("415");
    expect(resume.sections.summary).toContain("five years");
    expect(resume.sections.skills).toContain("Figma");
    expect(resume.sections.experience).toContain("onboarding");
    expect(resume.sections.education).toContain("B.A.");
    expect(resume.sections.projects).toContain("Accessibility");
    expect(resume.sections.certifications).toContain("UX Practitioner");
  });

  it("handles absent sections without failure", () => {
    const resume = parseResumeText("Jordan Lee\njordan@example.com\nA short profile.");
    expect(resume.sections.skills).toBe("");
    expect(resume.sections.experience).toBe("");
    expect(resume.phone).toBeNull();
  });

  it("extracts inline section content", () => {
    const resume = parseResumeText("Skills: Python, Java\nExperience: Built reliable data services.");
    expect(resume.sections.skills).toBe("Python, Java");
    expect(resume.sections.experience).toBe("Built reliable data services.");
  });

  it("rejects an empty or whitespace-only resume", () => {
    expect(() => parseResumeText("  \n\t")).toThrow("No readable text");
  });
});
