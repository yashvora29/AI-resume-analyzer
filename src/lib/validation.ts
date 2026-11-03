import type { JobDetails } from "../types";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const MAX_JOB_TEXT_LENGTH = 10_000;

export type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; error: string };

const acceptedMimeTypes = new Map([
  [".pdf", "application/pdf"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
]);

export function validateResumeFile(file: File): ValidationResult<File> {
  if (file.size === 0) {
    return { valid: false, error: "That file is empty. Choose a resume with content." };
  }

  if (file.size > MAX_RESUME_BYTES) {
    return { valid: false, error: "The file is larger than 5 MB. Choose a smaller resume." };
  }

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const expectedType = acceptedMimeTypes.get(extension);
  if (!expectedType) {
    return { valid: false, error: "Unsupported file type. Upload a PDF or DOCX resume." };
  }

  if (file.type && file.type !== expectedType) {
    return { valid: false, error: "The file type does not match its extension. Check the file and try again." };
  }

  return { valid: true, value: file };
}

export function validateJobDetails(job: JobDetails): ValidationResult<JobDetails> {
  if (!job.title.trim()) {
    return { valid: false, error: "Add the job title to continue." };
  }

  if (job.title.trim().length > 120) {
    return { valid: false, error: "Keep the job title under 120 characters." };
  }

  if (!job.description.trim()) {
    return { valid: false, error: "Add the job description to continue." };
  }

  if (job.description.trim().length < 20) {
    return { valid: false, error: "Add a little more detail to the job description (at least 20 characters)." };
  }

  const textFields = [
    job.description,
    job.responsibilities,
    job.requiredSkills,
    job.requiredExperience,
    job.education,
  ];
  if (textFields.some((value) => value.length > MAX_JOB_TEXT_LENGTH)) {
    return { valid: false, error: "Each job detail field must be 10,000 characters or fewer." };
  }

  return { valid: true, value: job };
}
