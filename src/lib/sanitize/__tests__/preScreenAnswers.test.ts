import { sanitizePreScreenAnswers } from "../preScreenAnswers";

describe("sanitizePreScreenAnswers", () => {
  test("strips script tags and HTML from strings", () => {
    const input = { q1: "<p>Hello</p><script>alert(1)</script>" };
    const out = sanitizePreScreenAnswers(input);
    expect(out.q1).toBe("Hello");
  });

  test("sanitizes checkbox arrays", () => {
    const input = { q2: ["<b>Yes</b>", "<script>bad</script>"] };
    const out = sanitizePreScreenAnswers(input);
    expect(Array.isArray(out.q2)).toBe(true);
    expect(out.q2[0]).toBe("Yes");
    expect(out.q2[1]).toBe("");
  });

  test("coerces range min/max to numbers", () => {
    const input = { q3: { min: "1", max: "5" } };
    const out = sanitizePreScreenAnswers(input);
    expect(typeof out.q3.min).toBe("number");
    expect(typeof out.q3.max).toBe("number");
    expect(out.q3.min).toBe(1);
    expect(out.q3.max).toBe(5);
  });

  test("handles nested objects and arrays", () => {
    const input = { q4: { notes: "<i>note</i>", items: ["<b>a</b>"] } };
    const out = sanitizePreScreenAnswers(input);
    expect(out.q4.notes).toBe("note");
    expect(out.q4.items[0]).toBe("a");
  });
});
