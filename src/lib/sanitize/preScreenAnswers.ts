import sanitizeHtml from "sanitize-html";

// Strip all HTML tags from a string
function stripTags(input?: string) {
  return sanitizeHtml(input || "", { allowedTags: [], allowedAttributes: {} }).trim();
}

function sanitizeValue(val: any): any {
  if (typeof val === "string") return stripTags(val);
  if (typeof val === "number" || typeof val === "boolean" || val == null) return val;
  if (Array.isArray(val)) return val.map((v) => sanitizeValue(v));
  if (typeof val === "object") {
    // special-case range objects with min/max
    const out: any = Array.isArray(val) ? [] : {};
    for (const k of Object.keys(val)) {
      const v = (val as any)[k];
      if (k === "min" || k === "max" || k === "rangeMin" || k === "rangeMax") {
        // coerce numeric inputs to numbers or leave empty string if blank
        out[k] = v === "" ? "" : Number(v);
      } else {
        out[k] = sanitizeValue(v);
      }
    }
    return out;
  }
  return val;
}

export function sanitizePreScreenAnswers(answers: Record<string, any>) {
  if (!answers || typeof answers !== "object") return {};
  const cleaned: Record<string, any> = {};
  for (const k of Object.keys(answers)) {
    cleaned[k] = sanitizeValue(answers[k]);
  }
  return cleaned;
}

export default sanitizePreScreenAnswers;
