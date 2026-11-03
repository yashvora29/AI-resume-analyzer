import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDocument } from "pdfjs-dist";
import * as mammoth from "mammoth";
import { extractResumeText } from "./fileReaders";

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: vi.fn(),
}));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "pdf-worker" }));
vi.mock("mammoth", () => ({ extractRawText: vi.fn() }));

function mockPdfDocument(text: string, pageCount = 1) {
  const document = {
    numPages: pageCount,
    getPage: vi.fn().mockResolvedValue({
      getTextContent: vi.fn().mockResolvedValue({
        items: text ? [{ str: text }] : [],
      }),
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(getDocument).mockReturnValue({
    promise: Promise.resolve(document),
  } as unknown as ReturnType<typeof getDocument>);
  return document;
}

function makeFile(contents: string, name: string): File {
  const file = new File([contents], name);
  Object.defineProperty(file, "arrayBuffer", {
    value: async () => new TextEncoder().encode(contents).buffer,
  });
  return file;
}

describe("extractResumeText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts PDF text and releases the PDF document", async () => {
    const document = mockPdfDocument("A useful resume");
    const text = await extractResumeText(makeFile("pdf bytes", "resume.pdf"));
    expect(text).toBe("A useful resume");
    expect(document.destroy).toHaveBeenCalledOnce();
  });

  it("extracts DOCX text", async () => {
    vi.mocked(mammoth.extractRawText).mockResolvedValue({
      value: "DOCX resume text",
      messages: [],
    });
    await expect(
      extractResumeText(makeFile("docx bytes", "resume.docx")),
    ).resolves.toBe("DOCX resume text");
  });

  it("reports corrupt documents and scanned PDFs clearly", async () => {
    vi.mocked(getDocument).mockImplementation(() => {
      throw new Error("invalid document");
    });
    await expect(
      extractResumeText(makeFile("bad", "broken.pdf")),
    ).rejects.toThrow("damaged, encrypted, or image-only");

    mockPdfDocument("");
    await expect(
      extractResumeText(makeFile("image-only", "scan.pdf")),
    ).rejects.toThrow("No readable text");
  });

  it("preserves the page limit error", async () => {
    mockPdfDocument("content", 101);
    await expect(
      extractResumeText(makeFile("pdf bytes", "long.pdf")),
    ).rejects.toThrow("more than 100 pages");
  });

  it("rejects unsupported extensions instead of decoding them as text", async () => {
    await expect(
      extractResumeText(makeFile("plain text", "resume.doc")),
    ).rejects.toThrow("Unsupported file type");
  });
});
