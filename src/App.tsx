import { ArrowRight, BriefcaseBusiness, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AnalysisResults } from "./components/AnalysisResults";
import { JobDetailsForm } from "./components/JobDetailsForm";
import { LoadingScreen } from "./components/LoadingScreen";
import { ResumeUpload } from "./components/ResumeUpload";
import { parseResumeText } from "./lib/resumeParser";
import { analyzeResume } from "./lib/scoring";
import { validateJobDetails, validateResumeFile } from "./lib/validation";
import type { AnalysisResult, JobDetails, ParsedResume } from "./types";

const emptyJob: JobDetails = {
  title: "",
  description: "",
  responsibilities: "",
  requiredSkills: "",
  requiredExperience: "",
  education: "",
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [job, setJob] = useState<JobDetails>(emptyJob);
  const [formError, setFormError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [completedJob, setCompletedJob] = useState<JobDetails | null>(null);

  function selectFile(candidate: File | null) {
    setFileError(null);
    if (!candidate) {
      setFile(null);
      return;
    }
    const validation = validateResumeFile(candidate);
    if (!validation.valid) {
      setFile(null);
      setFileError(validation.error);
      return;
    }
    setFile(validation.value);
  }

  async function runAI(resume: ParsedResume, jobDetails: JobDetails, result: AnalysisResult) {
    setAiLoading(true);
    setAiError(null);
    try {
      const { generateAIRecommendations } = await import("./services/puterAI");
      const response = await generateAIRecommendations(resume, jobDetails, result.skills);
      if (!response.ok) {
        const detail = response.error.toLowerCase();
        setAiError(
          detail.includes("429") || detail.includes("rate")
            ? "Puter is rate-limiting AI requests. Your local analysis is complete; wait a moment and retry."
            : "AI feedback is unavailable right now. Your local analysis is complete; check your Puter sign-in or try again later.",
        );
        return;
      }
      setAiRecommendations(response.recommendations);
    } catch {
      setAiError(
        "AI feedback is unavailable right now. Your local analysis is complete; check your Puter sign-in or try again later.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFileError(null);

    if (!file) {
      setFileError("Choose a PDF or DOCX resume to continue.");
      return;
    }
    const jobValidation = validateJobDetails(job);
    if (!jobValidation.valid) {
      setFormError(jobValidation.error);
      return;
    }

    setBusy(true);
    setAiError(null);
    setAiRecommendations([]);
    try {
      const { extractResumeText } = await import("./lib/fileReaders");
      const text = await extractResumeText(file);
      const parsed = parseResumeText(text);
      const result = analyzeResume(parsed, jobValidation.value);
      setParsedResume(parsed);
      setAnalysis(result);
      setCompletedJob(jobValidation.value);
      if (useAI) await runAI(parsed, jobValidation.value, result);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong while reading the resume. Please try another file.",
      );
      setAnalysis(null);
      setParsedResume(null);
      setCompletedJob(null);
    } finally {
      setBusy(false);
    }
  }

  async function retryAI() {
    if (!parsedResume || !completedJob || !analysis) return;
    await runAI(parsedResume, completedJob, analysis);
  }

  function startOver() {
    setFile(null);
    setFileError(null);
    setJob(emptyJob);
    setFormError(null);
    setUseAI(false);
    setAiError(null);
    setAiRecommendations([]);
    setParsedResume(null);
    setAnalysis(null);
    setCompletedJob(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <header className="border-b border-[#e6e9e4] bg-[#fbfcfa]">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="/" className="inline-flex items-center gap-2.5" aria-label="Resume Studio home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#294837] text-white">
              <BriefcaseBusiness aria-hidden="true" className="h-[17px] w-[17px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[-0.02em] text-[#24392c]">resume studio</span>
              <span className="block text-[10px] tracking-wide text-[#849087]">make your next move clearer</span>
            </span>
          </a>
          {analysis ? (
            <button type="button" onClick={startOver} className="rounded-full border border-[#dce2dc] bg-white px-4 py-2 text-xs font-medium text-[#526258] hover:bg-[#f2f5f1]">
              Start a new analysis
            </button>
          ) : (
            <a href="#how-it-works" className="hidden text-sm font-medium text-[#68756b] hover:text-[#294b36] sm:inline">
              How it works
            </a>
          )}
        </div>
      </header>

      {busy ? (
        <LoadingScreen withAI={useAI} />
      ) : analysis && parsedResume && completedJob ? (
        <AnalysisResults
          analysis={analysis}
          resume={parsedResume}
          job={completedJob}
          aiRecommendations={aiRecommendations}
          aiError={aiError}
          aiLoading={aiLoading}
          onRetryAI={retryAI}
          onStartOver={startOver}
        />
      ) : (
        <main className="mx-auto max-w-7xl px-5 pb-20 pt-9 sm:px-8 sm:pt-14 lg:px-12">
          <section className="relative overflow-hidden rounded-[26px] bg-[#eaf0e9] px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
            <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border border-[#dbe5d9] sm:right-6 sm:top-[-180px] sm:h-[440px] sm:w-[440px]" />
            <div className="pointer-events-none absolute right-8 top-12 h-36 w-36 rounded-full border border-[#dbe5d9] sm:right-28 sm:top-16 sm:h-56 sm:w-56" />
            <div className="relative max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d9e3d8] bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64806a] sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#709177]" />
                A thoughtful application starts here
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-[#203629] sm:text-5xl lg:text-[58px]">
                Tell your story with a little more <span className="font-serif font-normal italic text-[#61816a]">clarity.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#68766b] sm:text-base sm:leading-7">
                See what your resume already says well, where it aligns with a role, and what you could make clearer—without inventing a thing.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#718074]">
                <span className="inline-flex items-center gap-1.5"><LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" /> Private by default</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" /> Evidence-based scoring</span>
                <span className="inline-flex items-center gap-1.5"><Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Optional AI guidance</span>
              </div>
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto mt-8 grid max-w-6xl gap-5 lg:grid-cols-[0.92fr_1.08fr]"
          >
            <div className="rounded-2xl border border-[#e1e6df] bg-white p-5 shadow-[0_8px_32px_rgba(27,48,33,0.04)] sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#849188]">Step 01</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#263a2d]">Bring your resume</h2>
                </div>
                <span className="rounded-full bg-[#f2f5f1] px-3 py-1.5 text-[10px] font-medium text-[#718074]">Stays in your browser</span>
              </div>
              <ResumeUpload file={file} error={fileError} disabled={busy} onSelect={selectFile} />
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e8ebe6] bg-[#fafbf9] p-3.5">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(event) => setUseAI(event.target.checked)}
                  disabled={busy}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#54745e]"
                />
                <span>
                  <span className="block text-xs font-semibold text-[#4c5d50]">Also ask AI for personalized suggestions</span>
                  <span className="mt-1 block text-[11px] leading-5 text-[#899289]">
                    With your permission, your resume text and job details go to Puter.js. Puter may require you to sign in, and its AI usage is subject to Puter&apos;s terms.
                  </span>
                </span>
              </label>
            </div>

            <div className="rounded-2xl border border-[#e1e6df] bg-white p-5 shadow-[0_8px_32px_rgba(27,48,33,0.04)] sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#849188]">Step 02</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#263a2d]">Add the role details</h2>
                </div>
                <span className="rounded-full bg-[#f2f5f1] px-3 py-1.5 text-[10px] font-medium text-[#718074]">Core details required</span>
              </div>
              <JobDetailsForm value={job} disabled={busy} onChange={setJob} />
              {formError && (
                <p className="mt-4 rounded-lg bg-[#fff3f0] px-3.5 py-3 text-sm text-[#a34438]" role="alert">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#294837] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e3b2b] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-56"
              >
                See my alignment
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
              <p className="mt-3 text-[11px] leading-5 text-[#929990]">
                Nothing is uploaded or saved. Analysis runs in this tab.
              </p>
            </div>
          </form>

          <section id="how-it-works" className="mx-auto mt-12 max-w-6xl">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#849188]">A little more context</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#293b30]">What happens after you begin</h2>
              </div>
              <p className="max-w-sm text-xs leading-5 text-[#818a82]">Use the results as an editing guide, never as a verdict on your potential.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Read", "Resume text is extracted locally from the PDF or DOCX you selected."],
                ["02", "Compare", "Clear, fixed weights compare skills, experience, education, structure, and keywords."],
                ["03", "Improve", "Get practical next steps. AI feedback is optional, separate, and never invents your story."],
              ].map(([number, title, description]) => (
                <article key={number} className="rounded-xl border border-[#e3e7e1] bg-[#fbfcfa] p-4">
                  <span className="text-[10px] font-semibold tracking-[0.14em] text-[#94a095]">{number}</span>
                  <h3 className="mt-2 text-sm font-semibold text-[#425147]">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#849087]">{description}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      <footer className="border-t border-[#e6e9e4] px-5 py-5 text-center text-[11px] text-[#919990]">
        Resume Studio · A private workspace for a clearer next step
      </footer>
    </div>
  );
}
