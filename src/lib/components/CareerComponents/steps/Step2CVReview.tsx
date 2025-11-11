import React, { Dispatch, SetStateAction } from "react";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";
import PreScreeningQuestions from "@/lib/components/CareerComponents/PreScreeningQuestions";

const suggested: any[] = [
  {
    id: "s_1",
    title: "Notice Period",
    text: "How long is your notice period?",
    type: "dropdown",
    options: ["Immediately", "< 30 days", "> 30 days"],
  },
  {
    id: "s_2",
    title: "Work Setup",
    text: "Are you willing to report to the office when required?",
    type: "dropdown",
    options: [
      "At most 1-2x a week",
      "At most 3-4x a week",
      "Open to fully onsite work",
      "Only open to fully remote work",
    ],
  },
  {
    id: "s_3",
    title: "Asking Salary",
    text: "How much is your expected monthly salary?",
    type: "range",
    rangeMin: 40000,
    rangeMax: 60000,
  },
];

type Props = {
  cvScreeningSetting: string;
  setCvScreeningSetting: (s: string) => void;
  errors: Record<string, string>;
  clearError: (k: string) => void;
  screeningSettingList: { name: string; icon?: string }[];
  preScreeningQuestions?: any[];
  setPreScreeningQuestions?: Dispatch<SetStateAction<any[]>>;
  suggestionSectionTitle?: string;
};

export default function Step2CVReview({
  cvScreeningSetting,
  setCvScreeningSetting,
  errors,
  clearError,
  screeningSettingList,
  preScreeningQuestions,
  setPreScreeningQuestions,
  suggestionSectionTitle,
}: Props) {
  return (
    <>
      <div className="layered-card-outer">
        <div className="layered-card-middle">
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
            <span
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 16,
                color: "#181D27",
                fontWeight: 700,
              }}
            >
              1. CV Review Settings
            </span>
          </div>
          <div className="layered-card-content">
            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>CV Screening</span>
            <span>Jia automatically endorses candidates who meet the chosen criteria.</span>
            <div data-field="cvScreeningSetting">
              <CustomDropdown
                onSelectSetting={(setting) => {
                  setCvScreeningSetting(setting);
                  if (errors.cvScreeningSetting) clearError("cvScreeningSetting");
                }}
                screeningSetting={cvScreeningSetting}
                settingList={screeningSettingList}
                invalid={!!errors.cvScreeningSetting}
              />
            </div>
            {errors.cvScreeningSetting && (
              <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.cvScreeningSetting}</div>
            )}
          </div>
        </div>
      </div>

      <div className="layered-card-outer">
        <div className="layered-card-middle">
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
            <span
              style={{
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 16,
                color: "#181D27",
                fontWeight: 700,
              }}
            >
              2. Pre-Screening Questions (optional)
            </span>
          </div>
          <div className="layered-card-content">
            <PreScreeningQuestions
              questions={preScreeningQuestions || []}
              setQuestions={(setPreScreeningQuestions as any) || (() => {})}
              error={errors.prescreening}
            />
          </div>
        </div>
      </div>

      <div className="layered-card-outer" style={{ marginTop: 12 }}>
        <div className="layered-card-middle">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "100%",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                background: "#181D27",
                borderRadius: "60px",
              }}
            >
              <i className="la la-lightbulb" style={{ fontSize: 18, color: "#FFFFFF" }} />
            </div>
            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
              Suggested Pre-Screening Questions
            </span>
          </div>
          {suggestionSectionTitle ? (
            <div style={{ marginTop: 8, color: "#374151", fontWeight: 600 }}>
              {suggestionSectionTitle}
            </div>
          ) : null}
        </div>

        <div className="layered-card-content">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {suggested.map((s) => {
              const already = (preScreeningQuestions || []).some((q) => {
                try {
                  const qText = q && q.text ? String(q.text).trim().toLowerCase() : "";
                  const sText = String(s.text).trim().toLowerCase();
                  const sameType = q && q.type ? q.type === s.type : true;
                  return qText === sText && sameType;
                } catch (e) {
                  return false;
                }
              });

              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #E6E7EA",
                    background: "#fff",
                  }}
                >
                  <div>
                    {s.title ? (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#374151",
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        {s.title}
                      </div>
                    ) : null}

                    <div style={{ fontWeight: 700, color: already ? "#6b7280" : undefined }}>
                      {s.text}
                    </div>
                  </div>
                  <div>
                    <button
                      className="button-primary"
                      disabled={already}
                      onClick={() => {
                        if (already) return;
                        const q: any = {
                          id: `q_suggest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          text: s.text,
                          type: s.type,
                        };
                        // preserve title if present
                        if (s.title) q.title = s.title;
                        if (s.type === "dropdown") q.options = (s.options || []).slice();
                        if (s.type === "range") {
                          q.rangeMin = s.rangeMin;
                          q.rangeMax = s.rangeMax;
                        }
                        if (setPreScreeningQuestions)
                          setPreScreeningQuestions((p) => [...(p || []), q]);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 60,
                        opacity: already ? 0.5 : 1,
                        cursor: already ? "not-allowed" : "pointer",
                      }}
                    >
                      {already ? "Added" : "Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
