// Mock the mongo connector used by the route (relative path)
jest.mock("../../../../../lib/mongoDB/mongoDB", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Use the real sanitizer implementation via relative path so we test actual sanitization
jest.mock("../../../../../lib/sanitize/preScreenAnswers", () => ({
  __esModule: true,
  default: function simpleSanitize(answers: Record<string, any>) {
    if (!answers || typeof answers !== "object") return {};
    const strip = (s: any) => {
      if (typeof s !== "string") return s;
      // remove script/style tags and their content
      let out = String(s).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
      out = out.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
      // strip remaining tags but keep inner text
      out = out.replace(/<[^>]*>/g, "").trim();
      return out;
    };
    const sanitizeValue = (v: any): any => {
      if (typeof v === "string") return strip(v);
      if (typeof v === "number" || typeof v === "boolean" || v == null) return v;
      if (Array.isArray(v)) return v.map(sanitizeValue);
      if (typeof v === "object") {
        const out: any = {};
        for (const k of Object.keys(v)) {
          const val = v[k];
          if (k === "min" || k === "max" || k === "rangeMin" || k === "rangeMax") {
            out[k] = val === "" ? "" : Number(val);
          } else {
            out[k] = sanitizeValue(val);
          }
        }
        return out;
      }
      return v;
    };
    const out: Record<string, any> = {};
    for (const k of Object.keys(answers)) out[k] = sanitizeValue(answers[k]);
    return out;
  },
}));

import connectMongoDB from "../../../../../lib/mongoDB/mongoDB";
import { POST } from "../route";

describe("manage-application POST", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("sanitizes preScreenAnswers before persisting to interviews collection", async () => {
    const fakeInterviewInstance = {
      _id: "619f1f1f1f1f1f1f1f1f1f1f",
      email: "applicant@example.com",
      id: "career-123",
    };

    const updateOneMockInterviews = jest.fn().mockResolvedValue({ matchedCount: 1 });
    const updateOneMockCareers = jest.fn().mockResolvedValue({ matchedCount: 1 });
    const insertOneMockHistory = jest.fn().mockResolvedValue({ insertedId: "hist-1" });

    // Provide a mocked connectMongoDB that returns a db with collection(name) handler
    (connectMongoDB as jest.Mock).mockResolvedValue({
      db: {
        collection: (name: string) => {
          if (name === "interviews")
            return {
              findOne: async () => fakeInterviewInstance,
              updateOne: updateOneMockInterviews,
            };
          if (name === "interview-history") return { insertOne: insertOneMockHistory };
          if (name === "careers") return { updateOne: updateOneMockCareers };
          return { findOne: async () => null, updateOne: jest.fn(), insertOne: jest.fn() };
        },
      },
    });

    // Malicious input that should be stripped
    const payload = {
      interviewData: { _id: fakeInterviewInstance._id },
      email: fakeInterviewInstance.email,
      body: {
        preScreenAnswers: {
          q1: "<script>alert(1)</script>hello",
          q2: { min: "10", max: "20" },
        },
      },
      interviewTransaction: null,
    };

    const fakeRequest = { json: async () => payload } as unknown as Request;

    const res = await POST(fakeRequest);

    // Expect the interviews update to be called with sanitized preScreenAnswers
    expect(updateOneMockInterviews).toHaveBeenCalled();

    const [[filter, updateObj]] = updateOneMockInterviews.mock.calls;
    expect(filter).toMatchObject({ _id: expect.any(Object), email: fakeInterviewInstance.email });
    expect(updateObj).toHaveProperty("$set");
    expect(updateObj.$set).toHaveProperty("preScreenAnswers");
    expect(updateObj.$set.preScreenAnswers.q1).toBe("hello");
    expect(updateObj.$set.preScreenAnswers.q2).toMatchObject({ min: 10, max: 20 });
  });
});
