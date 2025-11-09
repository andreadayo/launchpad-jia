import { validateStepForData, canGoToStep } from "../CareerForm";

describe("careerFormUtils", () => {
  test("validateStepForData - step 1 requires title and description", () => {
    expect(validateStepForData({ jobTitle: "Dev", description: "a" }, 1)).toBe(true);
    expect(validateStepForData({ jobTitle: "", description: "a" }, 1)).toBe(false);
    expect(validateStepForData({ jobTitle: "Dev", description: "" }, 1)).toBe(false);
  });

  test("validateStepForData - step 2 requires cvScreeningSetting", () => {
    expect(validateStepForData({ cvScreeningSetting: "Good Fit" }, 2)).toBe(true);
    expect(validateStepForData({ cvScreeningSetting: "" }, 2)).toBe(false);
  });

  test("validateStepForData - step 3 requires aiScreeningSetting", () => {
    expect(validateStepForData({ aiScreeningSetting: "Good Fit" }, 3)).toBe(true);
    expect(validateStepForData({ aiScreeningSetting: "" }, 3)).toBe(false);
  });

  test("validateStepForData - step 4 requires at least one question", () => {
    expect(
      validateStepForData(
        { jobTitle: "Dev", description: "a", questions: [{ questions: ["q"] }] },
        4
      )
    ).toBe(true);
    expect(
      validateStepForData({ jobTitle: "Dev", description: "a", questions: [{ questions: [] }] }, 4)
    ).toBe(false);
  });

  test("canGoToStep - cannot jump to step 3 if step 2 invalid", () => {
    const data = { jobTitle: "Dev", description: "a", cvScreeningSetting: "" };
    expect(canGoToStep(data, 3)).toBe(false);
    expect(canGoToStep({ ...data, cvScreeningSetting: "Good Fit" }, 3)).toBe(true);
  });
});
