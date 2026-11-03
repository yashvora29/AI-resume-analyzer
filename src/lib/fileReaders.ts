import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { TextItem } from "pdfjs-dist/types/src/display/api";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as mammoth from "mammoth";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_PDF_PAGES = 100;
const MAX_EXTRACTED_CHARACTERS = 100_000;

class ResumeReadError extends Error {}

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  try {
    if (extension === ".pdf") return await extractPdfText(file);
    if (extension === ".docx") return await extractDocxText(file);
  } catch (error) {
    if (error instanceof ResumeReadError) throw error;
    throw new Error("We couldn't read this file. It may be damaged, encrypted, or image-only.");
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX resume.");
}

async function extractPdfText(file: File): Promise<string> {
  const document = await getDocument({ data: await file.arrayBuffer() }).promise;
  try {
    if (document.numPages > MAX_PDF_PAGES) {
      throw new ResumeReadError("This resume has more than 100 pages. Choose a shorter document.");
    }

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .filter((item): item is TextItem => "str" in item)
          .map((item) => item.str)
          .join(" "),
      );
    }
    return ensureReadableText(pages.join("\n"));
  } finally {
    await document.destroy();
  }
}

async function extractDocxText(file: File): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return ensureReadableText(result.value);
}

function ensureReadableText(text: string): string {
  const readableText = text.trim();
  if (!readableText) {
    throw new ResumeReadError("No readable text was found in the resume. Scanned images need OCR and aren't supported yet.");
  }
  if (readableText.length > MAX_EXTRACTED_CHARACTERS) {
    return readableText.slice(0, MAX_EXTRACTED_CHARACTERS);
  }
  return readableText;
}
