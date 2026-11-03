import { FileText, FileUp, ShieldCheck, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

type Props = {
  file: File | null;
  error: string | null;
  disabled: boolean;
  onSelect: (file: File | null) => void;
};

export function ResumeUpload({ file, error, disabled, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function chooseFile(candidate?: File) {
    if (candidate) onSelect(candidate);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <section aria-labelledby="resume-upload-heading">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="resume-upload-heading" className="text-sm font-semibold text-[#26372e]">
          Your resume <span className="text-[#b4503d]">*</span>
        </h2>
        <span className="text-xs text-[#818a83]">PDF or DOCX · 5 MB max</span>
      </div>
      <label
        htmlFor="resume-file"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-6 text-center transition-colors ${
          dragging
            ? "border-[#527964] bg-[#edf4ee]"
            : error
              ? "border-[#cb695a] bg-[#fff9f7]"
              : "border-[#cfd6cf] bg-[#fafbf9] hover:border-[#819b88] hover:bg-[#f4f7f3]"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        {file ? (
          <>
            <FileText aria-hidden="true" className="mb-2 h-7 w-7 text-[#597e65]" />
            <span className="max-w-full truncate text-sm font-medium text-[#2c4334]">{file.name}</span>
            <span className="mt-1 text-xs text-[#78837a]">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</span>
          </>
        ) : (
          <>
            <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#e8eee8]">
              <FileUp aria-hidden="true" className="h-5 w-5 text-[#527964]" />
            </span>
            <span className="text-sm font-semibold text-[#35463a]">Choose a file or drag it here</span>
            <span className="mt-1 text-xs text-[#818a83]">Your resume is read in this browser</span>
          </>
        )}
        <input
          ref={inputRef}
          id="resume-file"
          name="resume"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => chooseFile(event.currentTarget.files?.[0])}
          aria-describedby={error ? "resume-file-error" : "resume-file-help"}
        />
      </label>
      {file && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#6b746c] hover:text-[#a34438]"
          onClick={() => {
            onSelect(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          disabled={disabled}
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
          Remove file
        </button>
      )}
      {error ? (
        <p id="resume-file-error" className="mt-2 text-sm text-[#a34438]" role="alert">
          {error}
        </p>
      ) : (
        <p id="resume-file-help" className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-[#818a83]">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          We don&apos;t store your file. AI analysis is optional and requires your consent.
        </p>
      )}
    </section>
  );
}
