import { FileSearch, Sparkles } from "lucide-react";

export function LoadingScreen({ withAI }: { withAI: boolean }) {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e8efe8] text-[#64836b]">
        {withAI ? <Sparkles aria-hidden="true" className="h-6 w-6" /> : <FileSearch aria-hidden="true" className="h-6 w-6" />}
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-[#253a2c]">Taking a closer look</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#78837a]">
        Reading the resume locally, comparing the job details, and putting together your alignment snapshot.
      </p>
      <div
        className="loading-bar mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-[#e7ece6]"
        aria-label="Analysis in progress"
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      />
      <p className="mt-4 text-xs text-[#8c958d]">
        {withAI ? "Your resume text will be sent to Puter for the AI feedback you requested." : "Your resume stays in this browser."}
      </p>
    </main>
  );
}
