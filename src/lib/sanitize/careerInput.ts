import sanitizeHtml from "sanitize-html";
import { z } from "zod";

export const CareerInputSchema = z.object({
  orgID: z.string().min(1).optional(),
  jobTitle: z.string().min(1).optional(),
  description: z.string().optional(),
  questions: z.array(z.any()).optional(),
  location: z.string().optional(),
  workSetup: z.string().optional(),
  workSetupRemarks: z.string().optional(),
  lastEditedBy: z.string().optional(),
  createdBy: z.string().optional(),
  status: z.string().optional(),
  cvScreeningSetting: z.any().optional(),
  screeningSetting: z.any().optional(),
  aiScreeningSetting: z.any().optional(),
  requireVideo: z.union([z.boolean(), z.string(), z.number()]).optional(),
  salaryNegotiable: z.union([z.boolean(), z.string(), z.number()]).optional(),
  minimumSalary: z.number().optional(),
  maximumSalary: z.number().optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  employmentType: z.string().optional(),
  preScreeningQuestions: z.array(z.any()).optional(),
});

// sanitize-html configuration: conservative allowlist for description field
const SANITIZE_CFG: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
    "pre",
    "code",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
  },
  transformTags: {
    // Remove javascript: hrefs and other suspicious attributes
    a: (tagName, attribs) => {
      const href = attribs.href || "";
      if (href.trim().toLowerCase().startsWith("javascript:")) {
        return { tagName: "a", attribs: { href: "" } };
      }
      return { tagName, attribs };
    },
  },
};

// Helper: strip all HTML tags (for plain text fields)
function stripTags(input?: string) {
  return sanitizeHtml(input || "", { allowedTags: [], allowedAttributes: {} }).trim();
}

function sanitizeParsed(parsed: any) {
  const sanitized: any = { ...parsed };

  // Sanitize description allowing a small set of HTML
  if (parsed.description) sanitized.description = sanitizeHtml(parsed.description, SANITIZE_CFG);

  // jobTitle and other plain text fields: strip tags
  const plainTextFields = [
    "jobTitle",
    "location",
    "workSetup",
    "workSetupRemarks",
    "lastEditedBy",
    "createdBy",
    "country",
    "province",
    "employmentType",
  ];
  for (const f of plainTextFields) {
    if (typeof parsed[f] !== "undefined") sanitized[f] = stripTags(parsed[f]);
  }

  // Questions / preScreeningQuestions: sanitize question text and options
  const sanitizeQuestion = (q: any) => {
    if (!q || typeof q !== "object") return q;
    const out: any = { ...q };
    if (typeof q.question === "string") out.question = stripTags(q.question);
    if (Array.isArray(q.options)) {
      out.options = q.options.map((opt: any) => (typeof opt === "string" ? stripTags(opt) : opt));
    }
    // Ensure numeric ranges are numbers if present
    if (typeof q.rangeMin !== "undefined") out.rangeMin = Number(q.rangeMin);
    if (typeof q.rangeMax !== "undefined") out.rangeMax = Number(q.rangeMax);
    return out;
  };

  if (Array.isArray(parsed.questions)) sanitized.questions = parsed.questions.map(sanitizeQuestion);
  if (Array.isArray(parsed.preScreeningQuestions))
    sanitized.preScreeningQuestions = parsed.preScreeningQuestions.map(sanitizeQuestion);

  // Ensure booleans are properly typed
  if (typeof parsed.requireVideo !== "undefined")
    sanitized.requireVideo = Boolean(parsed.requireVideo);
  if (typeof parsed.salaryNegotiable !== "undefined")
    sanitized.salaryNegotiable = Boolean(parsed.salaryNegotiable);

  return sanitized;
}

export function validateAndSanitizeCareer(input: any) {
  const parsed = CareerInputSchema.parse(input);
  return sanitizeParsed(parsed);
}

// Partial validator for updates: accepts a partial career payload and sanitizes present fields
export function validateAndSanitizeCareerPartial(input: any) {
  const parsed = CareerInputSchema.partial().parse(input);
  return sanitizeParsed(parsed);
}
