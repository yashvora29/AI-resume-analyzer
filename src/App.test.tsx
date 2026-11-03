import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { extractResumeText } from "./lib/fileReaders";

vi.mock("./lib/fileReaders", () => ({
  extractResumeText: vi.fn(),
}));

const resumeText = [
  "Taylor Example",
  "taylor@example.com",
  "SUMMARY",
  "Product designer who turns research into thoughtful interfaces.",
  "SKILLS",
  "Figma, user research",
  "EXPERIENCE",
  "Led user research for customer products.",
  "EDUCATION",
  "Bachelor of Design",
].join("\n");

describe("resume analysis workflow", () => {
  beforeEach(() => vi.mocked(extractResumeText).mockResolvedValue(resumeText));

  it("reports unsupported uploads and missing job fields", async () => {
    const user = userEvent.setup();
    render(<App />);
    const fileInput = document.querySelector<HTMLInputElement>("#resume-file")!;
    fireEvent.change(fileInput, {
      target: { files: [new File(["text"], "resume.txt", { type: "text/plain" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Unsupported file type");

    fireEvent.change(fileInput, {
      target: { files: [new File(["resume"], "resume.pdf", { type: "application/pdf" })] },
    });
    await user.click(screen.getByRole("button", { name: /see my alignment/i }));
    expect(screen.getByRole("alert")).toHaveTextContent("Add the job title");
    expect(extractResumeText).not.toHaveBeenCalled();
  });

  it("completes local analysis and shows a transparent results dashboard", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.upload(
      document.querySelector<HTMLInputElement>("#resume-file")!,
      new File(["pdf bytes"], "resume.pdf", { type: "application/pdf" }),
    );
    await user.type(document.querySelector<HTMLInputElement>("#job-title")!, "Product Designer");
    await user.type(
      document.querySelector<HTMLTextAreaElement>("#job-description")!,
      "Design accessible products and collaborate with research teams.",
    );
    await user.type(document.querySelector<HTMLTextAreaElement>("#required-skills")!, "Figma, user research");
    await user.click(screen.getByRole("button", { name: /see my alignment/i }));

    expect(await screen.findByRole("heading", { name: /your resume, through the lens of Product Designer/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /estimated resume alignment score/i })).toBeInTheDocument();
    expect(screen.getByText("Figma", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText(/not a score from an actual applicant tracking system/i)).toBeInTheDocument();
    expect(extractResumeText).toHaveBeenCalled();
  });

  it("shows a clear error when the uploaded resume has no readable text", async () => {
    vi.mocked(extractResumeText).mockResolvedValue("  \n ");
    render(<App />);
    fireEvent.change(document.querySelector<HTMLInputElement>("#resume-file")!, {
      target: { files: [new File(["pdf bytes"], "resume.pdf", { type: "application/pdf" })] },
    });
    await userEvent.type(document.querySelector<HTMLInputElement>("#job-title")!, "Product Designer");
    await userEvent.type(
      document.querySelector<HTMLTextAreaElement>("#job-description")!,
      "Design accessible products and collaborate with research teams.",
    );
    await userEvent.click(screen.getByRole("button", { name: /see my alignment/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("No readable text"));
  });
});
