import { describe, expect, it } from "vitest";
import {
  MAX_RESUME_BYTES,
  validateJobDetails,
  validateResumeFile,
} from "./validation";
import type { JobDetails } from "../types";

const validJob: JobDetails = {
  title: "Product Designer",
  description: "Design useful products for a growing customer platform.",
  responsibilities: "",
  requiredSkills: "",
  requiredExperience: "",
  education: "",
};

describe("validateResumeFile", () => {
  it("accepts supported PDF and DOCX files", () => {
    expect(validateResumeFile(new File(["resume"], "resume.pdf", { type: "application/pdf" })).valid).toBe(true);
    expect(
      validateResumeFile(
        new File(["resume"], "resume.docx", {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ).valid,
    ).toBe(true);
  });

  it.each([
    [new File([], "empty.pdf", { type: "application/pdf" }), "empty"],
    [new File(["resume"], "resume.doc", { type: "application/msword" }), "Unsupported"],
    [new File(["resume"], "resume.pdf", { type: "text/plain" }), "does not match"],
    [new File([new Uint8Array(MAX_RESUME_BYTES + 1)], "large.pdf", { type: "application/pdf" }), "5 MB"],
  ])("rejects invalid file input", (file, message) => {
    const result = validateResumeFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain(message);
  });
});

describe("validateJobDetails", () => {
  it("requires a title and a minimally useful description", () => {
    expect(validateJobDetails({ ...validJob, title: "" })).toMatchObject({ valid: false });
    expect(validateJobDetails({ ...validJob, description: "" })).toMatchObject({ valid: false });
    const shortDescription = validateJobDetails({ ...validJob, description: "Too short" });
    expect(shortDescription.valid).toBe(false);
    if (!shortDescription.valid) expect(shortDescription.error).toContain("at least 20 characters");
  });

  it("accepts omitted optional job fields", () => {
    expect(validateJobDetails(validJob)).toEqual({ valid: true, value: validJob });
  });

  it("rejects oversized job detail fields", () => {
    expect(
      validateJobDetails({ ...validJob, responsibilities: "x".repeat(10_001) }),
    ).toMatchObject({ valid: false });
    const result = validateJobDetails({ ...validJob, responsibilities: "x".repeat(10_001) });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("10,000 characters or fewer");
  });
});
