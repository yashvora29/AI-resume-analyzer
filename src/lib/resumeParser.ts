import type { ParsedResume, ResumeSections } from "../types";

const sectionTitles: Record<keyof ResumeSections, string[]> = {
  summary: ["summary", "professional summary", "profile", "objective", "about"],
  skills: ["skills", "technical skills", "core competencies", "competencies"],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "work history",
  ],
  education: ["education", "academic background", "qualifications"],
  projects: ["projects", "selected projects", "personal projects"],
  certifications: ["certifications", "certificates", "licenses"],
};

const headingToSection = new Map<string, keyof ResumeSections>(
  Object.entries(sectionTitles).flatMap(([section, titles]) =>
    titles.map((title) => [title, section as keyof ResumeSections]),
  ),
);

function identifyHeading(
  line: string,
): { section: keyof ResumeSections; content: string } | null {
  const normalized = line
    .trim()
    .toLowerCase()
    .replace(/^[\s#\-*]+|[\s:#\-*]+$/g, "")
    .replace(/\s+/g, " ");
  const exactSection = headingToSection.get(normalized);
  if (exactSection) return { section: exactSection, content: "" };

  const inlineHeading = line.match(/^(.+?)\s*[:\-–]\s*(.+)$/u);
  if (!inlineHeading?.[1] || !inlineHeading[2]) return null;
  const inlineSection = headingToSection.get(
    inlineHeading[1].trim().toLowerCase().replace(/\s+/g, " "),
  );
  return inlineSection ? { section: inlineSection, content: inlineHeading[2].trim() } : null;
}

export function parseResumeText(text: string): ParsedResume {
  const normalizedText = text.replace(/\r\n?/g, "\n").trim();
  if (!normalizedText) {
    throw new Error("No readable text was found in the resume.");
  }

  const sections: ResumeSections = {
    summary: "",
    skills: "",
    experience: "",
    education: "",
    projects: "",
    certifications: "",
  };
  let activeSection: keyof ResumeSections | null = null;
  const collected = new Map<keyof ResumeSections, string[]>();

  for (const line of normalizedText.split("\n")) {
    const heading = identifyHeading(line);
    if (heading) {
      activeSection = heading.section;
      if (!collected.has(heading.section)) collected.set(heading.section, []);
      if (heading.content) collected.get(heading.section)?.push(heading.content);
      continue;
    }

    if (activeSection && line.trim()) {
      collected.get(activeSection)?.push(line.trim());
    }
  }

  for (const [section, lines] of collected) {
    sections[section] = lines.join("\n");
  }

  const email = normalizedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = normalizedText.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{3,4}/)?.[0] ?? null;

  return { fullText: normalizedText, email, phone, sections };
}
