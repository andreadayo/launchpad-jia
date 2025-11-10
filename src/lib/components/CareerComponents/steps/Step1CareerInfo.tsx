import React from "react";
import RichTextEditor from "@/lib/components/CareerComponents/RichTextEditor";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";

type Props = {
  jobTitle: string;
  setJobTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  employmentType: string;
  setEmploymentType: (v: string) => void;
  workSetup: string;
  setWorkSetup: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  provinceList: any[];
  cityList: any[];
  onProvinceSelect: (province: string) => void;
  salaryNegotiable: boolean;
  setSalaryNegotiable: (v: boolean) => void;
  minimumSalary: string;
  setMinimumSalary: (v: string) => void;
  maximumSalary: string;
  setMaximumSalary: (v: string) => void;
  errors: Record<string, string>;
  clearError: (k: string) => void;
  employmentTypeOptions: { name: string }[];
  workSetupOptions: { name: string }[];
};

export default function Step1CareerInfo({
  jobTitle,
  setJobTitle,
  description,
  setDescription,
  employmentType,
  setEmploymentType,
  workSetup,
  setWorkSetup,
  country,
  setCountry,
  province,
  setProvince,
  city,
  setCity,
  provinceList,
  cityList,
  onProvinceSelect,
  salaryNegotiable,
  setSalaryNegotiable,
  minimumSalary,
  setMinimumSalary,
  maximumSalary,
  setMaximumSalary,
  errors,
  clearError,
  employmentTypeOptions,
  workSetupOptions,
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
              1. Career Information
            </span>
          </div>
          <div className="layered-card-content">
            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
              Basic Information
            </span>
            <span>Job Title</span>
            <input
              data-field="jobTitle"
              value={jobTitle}
              className={`form-control ${errors.jobTitle ? "is-invalid" : ""}`}
              placeholder="Enter job title"
              onChange={(e) => {
                const v = e.target.value || "";
                setJobTitle(v);
                if (errors.jobTitle) clearError("jobTitle");
              }}
            />
            {errors.jobTitle && (
              <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.jobTitle}</div>
            )}

            {/* Work Setting */}
            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Work Setting</span>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Employment Type</span>
                <div data-field="employmentType">
                  <CustomDropdown
                    onSelectSetting={(employmentType) => {
                      setEmploymentType(employmentType);
                      if (errors.employmentType) clearError("employmentType");
                    }}
                    screeningSetting={employmentType}
                    settingList={employmentTypeOptions}
                    placeholder="Choose employment type"
                    invalid={!!errors.employmentType}
                  />
                </div>
                {errors.employmentType && (
                  <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.employmentType}</div>
                )}
              </div>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Arrangement</span>
                <div data-field="workSetup">
                  <CustomDropdown
                    onSelectSetting={(setting) => {
                      setWorkSetup(setting);
                      if (errors.workSetup) clearError("workSetup");
                    }}
                    screeningSetting={workSetup}
                    settingList={workSetupOptions}
                    placeholder="Choose work arrangement"
                    invalid={!!errors.workSetup}
                  />
                </div>
                {errors.workSetup && (
                  <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.workSetup}</div>
                )}
              </div>
            </div>

            {/* Location */}
            <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Location</span>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Country</span>
                <div data-field="country">
                  <CustomDropdown
                    onSelectSetting={(setting) => {
                      setCountry(setting);
                      if (errors.country) clearError("country");
                    }}
                    screeningSetting={country}
                    settingList={[]}
                    placeholder="Select Country"
                    invalid={!!errors.country}
                  />
                </div>
                {errors.country && (
                  <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.country}</div>
                )}
              </div>
              <div
                style={{
                  minWidth: "fit-content",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span>State / Province</span>
                <div data-field="province">
                  <CustomDropdown
                    onSelectSetting={(p) => {
                      onProvinceSelect(p);
                    }}
                    screeningSetting={province}
                    settingList={provinceList}
                    placeholder="Select State / Province"
                    invalid={!!errors.province}
                    fitContent={true}
                  />
                </div>
                {errors.province && (
                  <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.province}</div>
                )}
              </div>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>City</span>
                <div data-field="city">
                  <CustomDropdown
                    onSelectSetting={(c) => {
                      setCity(c);
                      if (errors.city) clearError("city");
                    }}
                    screeningSetting={city}
                    settingList={cityList}
                    placeholder="Select City"
                    invalid={!!errors.city}
                  />
                </div>
                {errors.city && <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.city}</div>}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Salary</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 8,
                  minWidth: "130px",
                }}
              >
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={salaryNegotiable}
                    onChange={() => setSalaryNegotiable(!salaryNegotiable)}
                  />
                  <span className="slider round"></span>
                </label>
                <span>{salaryNegotiable ? "Negotiable" : "Fixed"}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Minimum Salary</span>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6c757d",
                      fontSize: "16px",
                      pointerEvents: "none",
                    }}
                  >
                    P
                  </span>
                  <input
                    type="number"
                    className={`form-control ${errors.minimumSalary ? "is-invalid" : ""}`}
                    placeholder="0"
                    min={0}
                    value={minimumSalary}
                    data-field="minimumSalary"
                    onChange={(e) => {
                      const v = e.target.value || "";
                      setMinimumSalary(v);
                      if (errors.minimumSalary) clearError("minimumSalary");
                    }}
                    style={{ paddingLeft: "28px" }}
                  />
                </div>
                {errors.minimumSalary && (
                  <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.minimumSalary}</div>
                )}
              </div>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                <span>Maximum Salary</span>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6c757d",
                      fontSize: "16px",
                      pointerEvents: "none",
                    }}
                  >
                    P
                  </span>
                  <input
                    type="number"
                    className={`form-control ${errors.maximumSalary ? "is-invalid" : ""}`}
                    placeholder="0"
                    min={0}
                    value={maximumSalary}
                    data-field="maximumSalary"
                    onChange={(e) => {
                      const v = e.target.value || "";
                      setMaximumSalary(v);
                      if (errors.maximumSalary) clearError("maximumSalary");
                    }}
                    style={{ paddingLeft: "28px" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "30px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#6c757d",
                      fontSize: "16px",
                      pointerEvents: "none",
                    }}
                  >
                    PHP
                  </span>
                </div>
                {errors.maximumSalary && (
                  <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.maximumSalary}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: Description */}
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
              2. Description
            </span>
          </div>
          <div className="layered-card-content">
            <div
              data-field="description"
              style={
                errors.description ? { border: "1px solid #ef4444", borderRadius: 6 } : undefined
              }
            >
              <RichTextEditor setText={setDescription} text={description} />
            </div>
            {errors.description && (
              <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.description}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
