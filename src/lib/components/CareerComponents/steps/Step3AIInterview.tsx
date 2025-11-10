import React from "react";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";
import InterviewQuestionGeneratorV2 from "@/lib/components/CareerComponents/InterviewQuestionGeneratorV2";

type Props = {
  aiScreeningSetting: string;
  setAiScreeningSetting: (s: string) => void;
  errors: Record<string, string>;
  clearError: (k: string) => void;
  requireVideo: boolean;
  setRequireVideo: (b: boolean) => void;
  questions: any[];
  setQuestions: (q: any[]) => void;
  jobTitle: string;
  description: string;
  screeningSettingList: { name: string; icon?: string }[];
};

export default function Step3AIInterview({
  aiScreeningSetting,
  setAiScreeningSetting,
  errors,
  clearError,
  requireVideo,
  setRequireVideo,
  questions,
  setQuestions,
  jobTitle,
  description,
  screeningSettingList,
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
              1. AI Interview Settings
            </span>
          </div>
          <div className="layered-card-content">
            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
              AI Interview Screening
            </span>
            <span>Jia automatically endorses candidates who meet the chosen criteria.</span>
            <div data-field="aiScreeningSetting">
              <CustomDropdown
                onSelectSetting={(setting) => {
                  setAiScreeningSetting(setting);
                  if (errors.aiScreeningSetting) clearError("aiScreeningSetting");
                }}
                screeningSetting={aiScreeningSetting}
                settingList={screeningSettingList}
                invalid={!!errors.aiScreeningSetting}
              />
            </div>
            {errors.aiScreeningSetting && (
              <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.aiScreeningSetting}</div>
            )}

            <div style={{ width: "100%", height: 1, backgroundColor: "#E9EAEB" }} />

            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
              Require Video on Interview
            </span>
            <span>
              Require candidates to keep their camera on. Recordings will appear on their analysis
              page.
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <i className="la la-video" style={{ color: "#414651", fontSize: 20 }}></i>
                <span>Require Video Interview</span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8 }}
              >
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={requireVideo}
                    onChange={() => setRequireVideo(!requireVideo)}
                  />
                  <span className="slider round"></span>
                </label>
                <span>{requireVideo ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InterviewQuestionGeneratorV2
        questions={questions}
        setQuestions={(questions) => setQuestions(questions)}
        jobTitle={jobTitle}
        description={description}
        error={errors.questions}
      />
    </>
  );
}
