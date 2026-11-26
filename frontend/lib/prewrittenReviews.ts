
export type PRReviewComment = {
  id: string;
  priority: "P1" | "P2" | "P3";
  title: string;
  path: string;
  lineStart: number;
  lineEnd?: number;
  body: string;
  requestedChange: string;
};

export type PreparedPRReview = {
  title: string;
  verdict: "REQUEST_CHANGES" | "COMMENT" | "APPROVE";
  mergeRisk: string;
  summary: string;
  comments: PRReviewComment[];
  checks: {
    name: string;
    status: string;
    detail: string;
  }[];
  integrationNote: string;
  finalRecommendation: string;
};

export const PREWRITTEN_REVIEWS: Record<string, PreparedPRReview> = {
  "asthasuman26/document_processing_bot:5": {
    title: "Restrict comment extraction to document annotations",
    verdict: "REQUEST_CHANGES",
    mergeRisk: "MODERATE–HIGH",

    summary:
      "The annotation-based extraction approach is useful, but the supplied PDF comparisons reveal significant false-positive extraction and a backward-compatibility regression. The implementation should retain annotation-based extraction while adding semantic filtering, printed-text fallback, safer resource handling and broader regression coverage.",

    comments: [
      {
        id: "C1",
        priority: "P1",
        title: "Filter annotations before treating them as reviewer comments",
        path: "backend/pdf_processing/extract_drawing_comments.py",
        lineStart: 24,
        lineEnd: 35,
        body:
          "This loop accepts every annotation containing non-empty text. Engineering drawings can contain CAD-generated labels, dimensions and other annotation objects that are not reviewer observations. The supplied comparisons show 1,219 entries instead of 65 for input.pdf and 3,885 instead of 5 for the earthing-layout PDF. This creates a substantial false-positive risk in downstream CRS generation.",
        requestedChange:
          "Introduce annotation-type-aware classification. Accept validated reviewer-comment types, handle popup relationships and reject unrelated drawing annotations by default. Validate the change against the supplied engineering PDF fixtures."
      },
      {
        id: "C2",
        priority: "P1",
        title: "Preserve extraction of printed reviewer comments",
        path: "backend/pdf_processing/extract_drawing_comments.py",
        lineStart: 24,
        lineEnd: 35,
        body:
          "Replacing the previous text extraction path with annotation-only extraction causes printed reviewer comments to disappear when they are stored as ordinary page text. In the supplied comparison, Comment printed.pdf returned 12 entries with the existing implementation and zero with this implementation.",
        requestedChange:
          "Retain the existing printed-text extraction mechanism as a complementary or fallback source. Apply classification and source-aware deduplication so ordinary drawing labels are not reintroduced."
      },
      {
        id: "C3",
        priority: "P2",
        title: "Handle flattened PDF annotations",
        path: "backend/pdf_processing/extract_drawing_comments.py",
        lineStart: 24,
        lineEnd: 26,
        body:
          "Flattened PDFs may retain the visible appearance of reviewer comments while no longer exposing the corresponding interactive annotation objects. In that situation, page.annots() may not provide the original comment.",
        requestedChange:
          "Provide a selective text-based or OCR fallback for flattened documents, or explicitly document the limitation and add a regression fixture."
      },
      {
        id: "C4",
        priority: "P2",
        title: "Preserve useful annotation metadata",
        path: "backend/pdf_processing/extract_drawing_comments.py",
        lineStart: 31,
        lineEnd: 34,
        body:
          "The current result retains only the page reference and comment text. Useful metadata such as annotation type, author, coordinates and creation date is discarded, reducing traceability when several reviewers comment on the same drawing.",
        requestedChange:
          "Preserve available annotation metadata as optional output fields, subject to compatibility with the downstream CRS schema. Do not fabricate missing metadata."
      },
      {
        id: "C5",
        priority: "P2",
        title: "Guarantee PDF document cleanup on extraction errors",
        path: "backend/pdf_processing/extract_drawing_comments.py",
        lineStart: 21,
        lineEnd: 36,
        body:
          "The document is closed only after the extraction loop completes normally. An exception while iterating pages or reading malformed annotation metadata can bypass doc.close().",
        requestedChange:
          "Use a context manager around fitz.open() so document cleanup is guaranteed, and handle malformed annotation data safely."
      },
      {
        id: "C6",
        priority: "P2",
        title: "Expand regression coverage for real PDF behaviours",
        path: "tests/test_extract_drawing_comments.py",
        lineStart: 1,
        body:
          "The PR description reports two passing tests for annotation extraction and ignoring plain page text. Those tests do not establish protection against the false-positive and printed-comment regressions shown in the supplied PDF comparisons.",
        requestedChange:
          "Add fixtures and assertions for input.pdf, the earthing-layout PDF and Comment printed.pdf. Also cover empty annotations, popup relationships, flattened documents, malformed metadata and duplicate extraction sources. Assert semantic correctness, not only entry counts."
      },
      {
        id: "C7",
        priority: "P3",
        title: "Preserve meaningful multiline comment formatting",
        path: "backend/pdf_processing/extract_drawing_comments.py",
        lineStart: 4,
        lineEnd: 8,
        body:
          "Collapsing every whitespace sequence into one space also removes paragraph and line-break boundaries. Multiline engineering instructions may lose meaningful structure.",
        requestedChange:
          "Normalize unsafe whitespace while preserving meaningful line breaks. Add coverage for multiline, Unicode and multilingual reviewer comments."
      }
    ],

    checks: [
      {
        name: "Unit tests",
        status: "Reported passing",
        detail: "The PR description reports two unittest cases passing."
      },
      {
        name: "Compilation",
        status: "Reported passing",
        detail: "The PR description reports compileall completed successfully."
      },
      {
        name: "PDF comparison",
        status: "Regression evidence supplied",
        detail: "input.pdf: 65 → 1,219; earthing-layout PDF: 5 → 3,885; Comment printed.pdf: 12 → 0."
      }
    ],

    integrationNote:
      "The actual PR changed-file listing places the extractor at backend/pdf_processing/extract_drawing_comments.py. The earlier concern about a root-level duplicate should not be treated as a confirmed defect for this PR.",

    finalRecommendation:
      "Request changes before merging. Preserve the annotation-based improvement, but resolve the false-positive extraction and printed-comment regression first. Add regression tests for the supplied PDF fixtures, then address metadata preservation and resource safety."
  }
};
