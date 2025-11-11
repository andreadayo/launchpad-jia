import { validateAndSanitizeCareer, validateAndSanitizeCareerPartial } from "../careerInput";

describe("careerInput sanitizer", () => {
  test("strips script tags and javascript: hrefs from description", () => {
    const input = {
      description: '<p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)">click</a>',
    };
    const out = validateAndSanitizeCareer(input as any);
    expect(out.description).toContain("<p>Hello</p>");
    expect(out.description).not.toContain("script");
    expect(out.description).not.toContain("javascript:");
  });

  test("allows safe formatting tags in description", () => {
    const input = { description: "<p>Hi <strong>bold</strong></p>" };
    const out = validateAndSanitizeCareer(input as any);
    expect(out.description).toBe("<p>Hi <strong>bold</strong></p>");
  });

  test("strips HTML from plain text fields like jobTitle", () => {
    const input = { jobTitle: "<b>Developer</b><img src=x onerror=alert(1)>" };
    const out = validateAndSanitizeCareer(input as any);
    expect(out.jobTitle).toBe("Developer");
  });

  test("sanitizes questions and options", () => {
    const input = {
      questions: [
        {
          question: "<i>What?</i>",
          options: ["<b>Yes</b>", "<script>bad</script>"],
          rangeMin: "1",
          rangeMax: "5",
        },
      ],
    };
    const out = validateAndSanitizeCareer(input as any);
    expect(Array.isArray(out.questions)).toBe(true);
    expect(out.questions[0].question).toBe("What?");
    expect(out.questions[0].options[0]).toBe("Yes");
    // script-only option becomes empty string after stripping
    expect(out.questions[0].options[1]).toBe("");
    expect(typeof out.questions[0].rangeMin).toBe("number");
    expect(typeof out.questions[0].rangeMax).toBe("number");
  });

  test("partial validator works on partial payloads", () => {
    const out = validateAndSanitizeCareerPartial({ jobTitle: "<b>Dev</b>" } as any);
    expect(out.jobTitle).toBe("Dev");
  });
});
