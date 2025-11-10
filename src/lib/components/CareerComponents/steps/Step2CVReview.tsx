import React from "react";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";
import PreScreeningQuestions from "@/lib/components/CareerComponents/PreScreeningQuestions";

type Props = {
  cvScreeningSetting: string;
  setCvScreeningSetting: (s: string) => void;
  errors: Record<string, string>;
  clearError: (k: string) => void;
  screeningSettingList: { name: string; icon?: string }[];
  preScreeningQuestions?: any[];
  setPreScreeningQuestions?: (q: any[]) => void;
};

export default function Step2CVReview({
  cvScreeningSetting,
  setCvScreeningSetting,
  errors,
  clearError,
  screeningSettingList,
  preScreeningQuestions,
  setPreScreeningQuestions,
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
              setQuestions={setPreScreeningQuestions || (() => {})}
              error={errors.prescreening}
            />
          </div>
        </div>
      </div>
    </>
  );
}
