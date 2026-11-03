import {
  ArrowLeft,
  Check,
  CircleHelp,
  FileCheck2,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import type { AnalysisResult, JobDetails, ParsedResume } from "../types";
import { ScoreGauge } from "./ScoreGauge";

type Props = {
  analysis: AnalysisResult;
  resume: ParsedResume;
  job: JobDetails;
  aiRecommendations: string[];
  aiError: string | null;
  aiLoading: boolean;
  onRetryAI: () => void;
  onStartOver: () => void;
};

export function AnalysisResults({
  analysis,
  resume,
  job,
  aiRecommendations,
  aiError,
  aiLoading,
  onRetryAI,
  onStartOver,
}: Props) {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 lg:px-12">
      <button
        type="button"
        onClick={onStartOver}
        className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#68756b] hover:text-[#294b36]"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        New analysis
      </button>

      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#68836c]">Your alignment snapshot</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#203629] sm:text-4xl">
            Your resume, through the lens of {job.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#748076]">
            A practical starting point for tailoring your application—not a prediction of an employer&apos;s decision.
          </p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_1.95fr]" aria-label="Score summary">
        <article className="flex items-center gap-5 rounded-2xl border border-[#e1e6df] bg-white p-5 shadow-[0_6px_24px_rgba(27,48,33,0.035)] sm:p-7">
          <ScoreGauge score={analysis.overallScore} />
          <div>
            <p className="text-lg font-semibold text-[#253a2c]">Overall estimate</p>
            <p className="mt-1 text-sm leading-5 text-[#778178]">
              A weighted view of the evidence provided in your resume and job details.
            </p>
          </div>
        </article>
        <div className="grid gap-3 sm:grid-cols-2">
          {analysis.metrics.map((item) => (
            <article key={item.key} className="rounded-2xl border border-[#e1e6df] bg-white p-4 shadow-[0_6px_24px_rgba(27,48,33,0.025)]">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-[#324238]">{item.label}</h2>
                <span className="rounded-full bg-[#f0f3ef] px-2 py-1 text-[10px] font-medium text-[#788379]">
                  {item.weight}% weight
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#294433]">
                {item.score === null ? "N/A" : `${item.score}%`}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf0ec]" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-[#78917c]"
                  style={{ width: `${item.score ?? 0}%` }}
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-[#7b857c]">{item.explanation}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-4 flex gap-2 rounded-xl bg-[#edf2ed] px-4 py-3 text-xs leading-5 text-[#627064]">
        <CircleHelp aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        This is an estimate based on transparent text comparisons, not a score from an actual applicant tracking system.
        Criteria with no supplied requirements are excluded from the overall score; active weights are proportionally
        normalized.
      </p>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf3ed] text-[#62816a]">
              <FileCheck2 aria-hidden="true" className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-semibold text-[#293b30]">Skills side by side</h2>
              <p className="mt-0.5 text-xs text-[#818a82]">Only direct wording is treated as an exact match.</p>
            </div>
          </div>
          {analysis.skills.matching.length === 0 &&
          analysis.skills.missing.length === 0 &&
          analysis.skills.partial.length === 0 ? (
            <EmptyList message="No required skills were supplied for comparison." />
          ) : (
            <div className="space-y-4">
              <SkillGroup
                title="Found in resume"
                items={analysis.skills.matching}
                status="matching"
                empty="No exact skill matches found."
              />
              <SkillGroup
                title="Possible overlap · verify"
                items={analysis.skills.partial}
                status="partial"
                empty="No partial wording overlaps found."
              />
              <SkillGroup
                title="Not found in resume"
                items={analysis.skills.missing}
                status="missing"
                empty="All listed skills were found in the resume text."
              />
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f1e9] text-[#99844c]">
              <Sparkles aria-hidden="true" className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-semibold text-[#293b30]">Keywords to notice</h2>
              <p className="mt-0.5 text-xs text-[#818a82]">Distinct role and job-detail terms, compared against your resume.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.skills.keywords.length ? (
              analysis.skills.keywords.slice(0, 24).map((keyword) => {
                const found = normalizeForDisplay(resume.fullText).includes(` ${keyword} `);
                return (
                  <span
                    key={keyword}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      found
                        ? "border-[#dce7dc] bg-[#f1f6f0] text-[#536e58]"
                        : "border-[#ece5d9] bg-[#faf7f0] text-[#8b7954]"
                    }`}
                  >
                    {keyword}
                  </span>
                );
              })
            ) : (
              <EmptyList message="No job description keywords were available to compare." />
            )}
          </div>
          {analysis.skills.keywords.length > 24 && (
            <p className="mt-3 text-[11px] text-[#899188]">
              Showing the first 24 of {analysis.skills.keywords.length} terms, starting with the role title.
            </p>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#899188]">
            <CircleHelp aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            A missing keyword does not mean you lack that skill. Add terminology only when it accurately describes your experience.
          </p>
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f5efe8] text-[#a47b4e]">
              <Lightbulb aria-hidden="true" className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-semibold text-[#293b30]">Ways to make your story clearer</h2>
              <p className="mt-0.5 text-xs text-[#818a82]">Practical ideas grounded in the content you shared.</p>
            </div>
          </div>
          {aiError && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0ded5] bg-[#fff9f5] p-3.5">
              <p className="flex items-start gap-2 text-xs leading-5 text-[#965a46]" role="alert">
                <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {aiError}
              </p>
              <button
                type="button"
                onClick={onRetryAI}
                disabled={aiLoading}
                className="shrink-0 rounded-lg border border-[#e7cdbf] px-3 py-2 text-xs font-semibold text-[#85503e] hover:bg-[#fff1e9] disabled:cursor-wait disabled:opacity-60"
              >
                {aiLoading ? "Retrying…" : "Retry AI feedback"}
              </button>
            </div>
          )}
          {aiLoading && (
            <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#f7f5eb] px-3.5 py-3 text-xs text-[#8c794b]" role="status">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#d9d0b1] border-t-[#8c794b]" />
              Waiting for Puter AI feedback…
            </p>
          )}
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={`local-${index}`} className="flex gap-3 text-sm leading-6 text-[#5b685e]">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eef3ed] text-[#608067]">
                  <Check aria-hidden="true" className="h-3 w-3" />
                </span>
                {recommendation}
              </li>
            ))}
            {aiRecommendations.map((recommendation, index) => (
              <li key={`ai-${index}`} className="flex gap-3 text-sm leading-6 text-[#5b685e]">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#f6f0df] text-[#a18745]">
                  <Sparkles aria-hidden="true" className="h-3 w-3" />
                </span>
                {recommendation}
              </li>
            ))}
          </ul>
          {aiRecommendations.length > 0 && (
            <p className="mt-4 text-xs leading-5 text-[#899188]">
              AI suggestions are generated by Puter.js. Verify every suggestion before using it.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-[#e1e6df] bg-white p-5 sm:p-6">
          <h2 className="font-semibold text-[#293b30]">What we could read</h2>
          <p className="mt-1 text-xs leading-5 text-[#818a82]">
            Extracted in your browser. Review section detection before acting on the score.
          </p>
          <dl className="mt-5 space-y-3">
            <DataRow label="Email" value={resume.email} />
            <DataRow label="Phone" value={resume.phone} />
            <DataRow label="Summary" value={resume.sections.summary} />
            <DataRow label="Skills" value={resume.sections.skills} />
            <DataRow label="Experience" value={resume.sections.experience} />
            <DataRow label="Education" value={resume.sections.education} />
            <DataRow label="Projects" value={resume.sections.projects} />
            <DataRow label="Certifications" value={resume.sections.certifications} />
          </dl>
          <p className="mt-4 border-t border-[#edf0ec] pt-3 text-[11px] leading-5 text-[#899188]">
            We don&apos;t save or upload your resume. If you opted into AI feedback, the extracted resume text and job details
            were sent to Puter for that request.
          </p>
        </article>
      </section>
    </main>
  );
}

function SkillGroup({
  title,
  items,
  status,
  empty,
}: {
  title: string;
  items: string[];
  status: "matching" | "partial" | "missing";
  empty: string;
}) {
  const styles = {
    matching: "border-[#dce7dc] bg-[#f1f6f0] text-[#536e58]",
    partial: "border-[#eee5d3] bg-[#fbf7ee] text-[#8b7954]",
    missing: "border-[#efe0dc] bg-[#fbf2ef] text-[#986355]",
  };
  const Icon = status === "missing" ? X : Check;
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-[#69756b]">{title}</h3>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs ${styles[status]}`}>
              <Icon aria-hidden="true" className="h-3 w-3" />
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#9aa19a]">{empty}</p>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b border-[#f0f2ef] pb-2.5 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#929b92]">{label}</dt>
      <dd className="mt-1 line-clamp-3 break-words text-xs leading-5 text-[#58665a]">
        {value || <span className="italic text-[#a2a9a2]">Not detected</span>}
      </dd>
    </div>
  );
}

function EmptyList({ message }: { message: string }) {
  return <p className="flex items-center gap-2 text-sm text-[#8a948b]">{message}</p>;
}

function normalizeForDisplay(text: string): string {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}+#.]+/gu, " ").replace(/\s+/g, " ").trim()} `;
}
