export function validateStepForData(data: any, step: number): boolean {
  if (!data) return false;
  switch (step) {
    case 1:
      return Boolean(
        (data.jobTitle || "").toString().trim() && (data.description || "").toString().trim()
      );
    case 2:
      return Boolean((data.cvScreeningSetting || "").toString().trim());
    case 3:
      return Boolean((data.aiScreeningSetting || "").toString().trim());
    case 4:
      if (!Array.isArray(data.questions)) return false;
      return data.questions.some((q: any) =>
        Array.isArray(q.questions) ? q.questions.length > 0 : false
      );
    default:
      return true;
  }
}

export function canGoToStep(data: any, targetStep: number): boolean {
  for (let s = 1; s < targetStep; s++) {
    if (!validateStepForData(data, s)) return false;
  }
  return true;
}
