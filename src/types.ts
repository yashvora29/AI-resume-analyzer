export type JobDetails = {
  title: string;
  description: string;
  responsibilities: string;
  requiredSkills: string;
  requiredExperience: string;
  education: string;
};

export type ResumeSections = {
  summary: string;
  skills: string;
  experience: string;
  education: string;
  projects: string;
  certifications: string;
};

export type ParsedResume = {
  fullText: string;
  email: string | null;
  phone: string | null;
  sections: ResumeSections;
};

export type ScoreMetric = {
  key: "skills" | "experience" | "education" | "structure" | "keywords";
  label: string;
  weight: number;
  score: number | null;
  explanation: string;
};

export type SkillComparison = {
  matching: string[];
  missing: string[];
  partial: string[];
  keywords: string[];
};

export type AnalysisResult = {
  overallScore: number;
  metrics: ScoreMetric[];
  skills: SkillComparison;
  recommendations: string[];
};
