import type {
  AnalysisResult,
  JobDetails,
  ParsedResume,
  ScoreMetric,
  SkillComparison,
} from "../types";

export const SCORE_WEIGHTS = {
  skills: 35,
  experience: 25,
  education: 15,
  structure: 10,
  keywords: 15,
} as const;

const stopWords = new Set(
  "a an and are as at be by for from in is it of on or that the their this to with will you your we our".split(" "),
);

function normalizeText(text: string): string {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}+#.]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}

function words(text: string): string[] {
  return normalizeText(text)
    .trim()
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function coverageScore(terms: string[], evidence: string): number | null {
  const distinctTerms = unique(terms);
  if (!distinctTerms.length) return null;
  const normalizedEvidence = normalizeText(evidence);
  const matched = distinctTerms.filter((term) => normalizedEvidence.includes(` ${term} `)).length;
  return Math.round((matched / distinctTerms.length) * 100);
}

function splitSkills(requiredSkills: string): string[] {
  return unique(
    requiredSkills
      .split(/[\n,;|]+/)
      .map((skill) => skill.replace(/^[\s•*\-\d.)]+|[\s,;]+$/g, "").trim())
      .filter(Boolean),
  );
}

function compareSkills(requiredSkills: string[], resumeText: string): SkillComparison {
  const evidence = normalizeText(resumeText);
  const matching: string[] = [];
  const missing: string[] = [];
  const partial: string[] = [];

  for (const skill of requiredSkills) {
    const normalizedSkill = normalizeText(skill).trim();
    if (evidence.includes(` ${normalizedSkill} `)) {
      matching.push(skill);
      continue;
    }

    const skillTokens = unique(words(skill));
    const sharedTokens = skillTokens.filter((token) => evidence.includes(` ${token} `));
    if (skillTokens.length > 1 && sharedTokens.length / skillTokens.length >= 0.5) {
      partial.push(skill);
    } else {
      missing.push(skill);
    }
  }

  return { matching, missing, partial, keywords: [] };
}

function sectionStructure(resume: ParsedResume): number {
  const hasContact = Boolean(
    resume.email || resume.phone || /\bcontact(?: information)?\b/i.test(resume.fullText),
  );
  const hasSummary = Boolean(resume.sections.summary);
  const hasSkills = Boolean(resume.sections.skills);
  const hasExperience = Boolean(resume.sections.experience);
  const hasEducation = Boolean(resume.sections.education);
  const hasProjects = Boolean(resume.sections.projects);
  const hasCertifications = Boolean(resume.sections.certifications);
  const detected = [
    hasContact,
    hasSummary,
    hasSkills,
    hasExperience,
    hasEducation,
    hasProjects,
    hasCertifications,
  ].filter(Boolean).length;
  return Math.round((detected / 7) * 100);
}

function metric(
  key: ScoreMetric["key"],
  label: string,
  score: number | null,
  explanation: string,
): ScoreMetric {
  return { key, label, score, weight: SCORE_WEIGHTS[key], explanation };
}

export function analyzeResume(resume: ParsedResume, job: JobDetails): AnalysisResult {
  const requiredSkills = splitSkills(job.requiredSkills);
  const skills = compareSkills(requiredSkills, resume.fullText);
  const experienceTerms = words(`${job.requiredExperience} ${job.responsibilities}`);
  const educationTerms = words(job.education);
  const jobKeywords = unique(
    words(
      `${job.title} ${job.description} ${job.responsibilities} ${job.requiredSkills} ${job.requiredExperience} ${job.education}`,
    ),
  );
  skills.keywords = jobKeywords;

  const skillScore =
    requiredSkills.length === 0
      ? null
      : Math.round(
          ((skills.matching.length + skills.partial.length * 0.5) / requiredSkills.length) * 100,
        );
  const experienceScore =
    experienceTerms.length === 0
      ? null
      : coverageScore(experienceTerms, resume.sections.experience);
  const educationScore = educationTerms.length
    ? coverageScore(educationTerms, resume.sections.education)
    : null;
  const structureScore = sectionStructure(resume);
  const keywordScore = coverageScore(jobKeywords, resume.fullText);

  const metrics = [
    metric(
      "skills",
      "Skills match",
      skillScore,
      requiredSkills.length
        ? `${skills.matching.length} exact match${skills.matching.length === 1 ? "" : "es"} and ${skills.partial.length} possible partial overlap${skills.partial.length === 1 ? "" : "s"} across ${requiredSkills.length} listed requirements. Partial overlaps are not confirmation of a skill.`
        : "Add required skills to the job details to evaluate this criterion.",
    ),
    metric(
      "experience",
      "Experience relevance",
      experienceScore,
      experienceTerms.length
        ? `Share of distinct job experience and responsibility terms found in the resume's experience section.`
        : "No experience requirements were provided; this criterion is excluded.",
    ),
    metric(
      "education",
      "Education relevance",
      educationScore,
      educationTerms.length
        ? "Share of distinct education requirement terms found in the resume's education section."
        : "No education requirement was provided; this criterion is excluded.",
    ),
    metric(
      "structure",
      "Resume structure",
      structureScore,
      `${Math.round((structureScore / 100) * 7)} of 7 common sections detected: contact, summary, skills, experience, education, projects, and certifications.`,
    ),
    metric(
      "keywords",
      "Keyword coverage",
      keywordScore,
      `Share of distinct, non-common job-description terms found anywhere in the resume (${jobKeywords.length} terms considered).`,
    ),
  ];

  const activeMetrics = metrics.filter(
    (item): item is ScoreMetric & { score: number } => item.score !== null,
  );
  const activeWeight = activeMetrics.reduce((total, item) => total + item.weight, 0);
  const overallScore =
    activeWeight === 0
      ? 0
      : Math.round(
          activeMetrics.reduce((total, item) => total + item.score * item.weight, 0) /
            activeWeight,
        );

  return {
    overallScore,
    metrics,
    skills,
    recommendations: buildRecommendations(resume, job, skills),
  };
}

function buildRecommendations(
  resume: ParsedResume,
  job: JobDetails,
  skills: SkillComparison,
): string[] {
  const recommendations: string[] = [];
  if (!resume.sections.summary) {
    recommendations.push(
      `Add a short professional summary that connects your verified experience to the ${job.title} role.`,
    );
  }
  if (skills.missing.length) {
    recommendations.push(
      `Review the listed requirements (${skills.missing.slice(0, 4).join(", ")}). Include any only if you genuinely have that experience.`,
    );
  }
  if (skills.partial.length) {
    recommendations.push(
      `Clarify the context for possible overlaps (${skills.partial.slice(0, 3).join(", ")}); the current resume wording doesn't confirm an exact match.`,
    );
  }
  if (!resume.sections.experience) {
    recommendations.push("Add a clearly labeled experience section if you have relevant work, internship, or volunteer experience.");
  } else if (job.responsibilities.trim()) {
    recommendations.push(
      "Where accurate, revise experience bullets to show the actions, scope, and outcomes that relate to this role's responsibilities.",
    );
  }
  if (!resume.sections.projects && job.requiredSkills.trim()) {
    recommendations.push(
      "If you have relevant work samples, add a projects section that shows how you used the skills this role asks for.",
    );
  }
  if (!resume.sections.education && job.education.trim()) {
    recommendations.push("Add your relevant education details if they are missing from the resume.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Your resume includes the main sections and listed skills; review each bullet for clear, verifiable impact.");
  }
  return recommendations;
}
