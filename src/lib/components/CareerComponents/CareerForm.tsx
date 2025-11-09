"use client";

import { useEffect, useRef, useState } from "react";
import InterviewQuestionGeneratorV2 from "./InterviewQuestionGeneratorV2";
import RichTextEditor from "@/lib/components/CareerComponents/RichTextEditor";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";
import philippineCitiesAndProvinces from "../../../../public/philippines-locations.json";
import { candidateActionToast, errorToast } from "@/lib/Utils";
import { useAppContext } from "@/lib/context/AppContext";
import axios from "axios";
import CareerActionModal from "./CareerActionModal";
import FullScreenLoadingAnimation from "./FullScreenLoadingAnimation";

export type CareerFormData = {
  jobTitle?: string;
  description?: string;
  cvScreeningSetting?: string | null;
  aiScreeningSetting?: string | null;
  questions?: any[];
  workSetup?: string | null;
};

export function validateStepForData(data: CareerFormData, step: number): boolean {
  switch (step) {
    case 1:
      return !!(
        data.jobTitle &&
        data.jobTitle.trim().length > 0 &&
        data.description &&
        data.description.trim().length > 0
      );
    case 2:
      return !!data.cvScreeningSetting;
    case 3:
      // require an AI screening selection and at least one generated/added question
      const hasAnyQuestion =
        Array.isArray(data.questions) &&
        data.questions.some((g) => Array.isArray(g.questions) && g.questions.length > 0);
      return !!data.aiScreeningSetting && hasAnyQuestion;
    case 4:
      // overall minimal validity: jobTitle, description, at least one question group with questions
      const hasQuestion =
        Array.isArray(data.questions) &&
        data.questions.some((q) => Array.isArray(q.questions) && q.questions.length > 0);
      return !!(
        data.jobTitle &&
        data.jobTitle.trim().length > 0 &&
        data.description &&
        data.description.trim().length > 0 &&
        hasQuestion
      );
    default:
      return false;
  }
}

export function canGoToStep(data: CareerFormData, targetStep: number): boolean {
  // allow navigating to a step only if all previous steps validate
  for (let s = 1; s < targetStep; s++) {
    if (!validateStepForData(data, s)) return false;
  }
  return true;
}
// Setting List icons
const screeningSettingList = [
  {
    name: "Good Fit and above",
    icon: "la la-check",
  },
  {
    name: "Only Strong Fit",
    icon: "la la-check-double",
  },
  {
    name: "No Automatic Promotion",
    icon: "la la-times",
  },
];
const workSetupOptions = [
  {
    name: "Fully Remote",
  },
  {
    name: "Onsite",
  },
  {
    name: "Hybrid",
  },
];

const employmentTypeOptions = [
  {
    name: "Full-Time",
  },
  {
    name: "Part-Time",
  },
];

export default function CareerForm({
  career,
  formType,
  setShowEditModal,
}: {
  career?: any;
  formType: string;
  setShowEditModal?: (show: boolean) => void;
}) {
  const { user, orgID } = useAppContext();
  const [jobTitle, setJobTitle] = useState(career?.jobTitle || "");
  const [description, setDescription] = useState(career?.description || "");
  const [workSetup, setWorkSetup] = useState(career?.workSetup || "");
  const [workSetupRemarks, setWorkSetupRemarks] = useState(career?.workSetupRemarks || "");
  const [cvScreeningSetting, setCvScreeningSetting] = useState(
    career?.cvScreeningSetting || career?.screeningSetting || "Good Fit and above"
  );
  const [aiScreeningSetting, setAiScreeningSetting] = useState(
    career?.aiScreeningSetting || career?.screeningSetting || "Good Fit and above"
  );
  const [employmentType, setEmploymentType] = useState(career?.employmentType || "Full-Time");
  const [requireVideo, setRequireVideo] = useState(career?.requireVideo || true);
  const [salaryNegotiable, setSalaryNegotiable] = useState(career?.salaryNegotiable || true);
  const [minimumSalary, setMinimumSalary] = useState(career?.minimumSalary || "");
  const [maximumSalary, setMaximumSalary] = useState(career?.maximumSalary || "");
  const [questions, setQuestions] = useState(
    career?.questions || [
      {
        id: 1,
        category: "CV Validation / Experience",
        questionCountToAsk: null,
        questions: [],
      },
      {
        id: 2,
        category: "Technical",
        questionCountToAsk: null,
        questions: [],
      },
      {
        id: 3,
        category: "Behavioral",
        questionCountToAsk: null,
        questions: [],
      },
      {
        id: 4,
        category: "Analytical",
        questionCountToAsk: null,
        questions: [],
      },
      {
        id: 5,
        category: "Others",
        questionCountToAsk: null,
        questions: [],
      },
    ]
  );
  const [country, setCountry] = useState(career?.country || "Philippines");
  const [province, setProvince] = useState(career?.province || "");
  const [city, setCity] = useState(career?.location || "");
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState("");
  const [isSavingCareer, setIsSavingCareer] = useState(false);
  const savingCareerRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<string | null>(career?._id || null);
  const steps = ["Career Info", "CV Review", "AI Interview", "Review"];

  const validateStep = (step: number) => {
    const data: CareerFormData = {
      jobTitle,
      description,
      cvScreeningSetting,
      aiScreeningSetting,
      questions,
      workSetup,
    };
    return validateStepForData(data, step);
  };

  const canGoTo = (step: number) => {
    const data: CareerFormData = {
      jobTitle,
      description,
      cvScreeningSetting,
      aiScreeningSetting,
      questions,
      workSetup,
    };
    return canGoToStep(data, step);
  };

  const isFormValid = () => {
    return (
      jobTitle?.trim().length > 0 &&
      description?.trim().length > 0 &&
      questions.some((q) => q.questions.length > 0) &&
      workSetup?.trim().length > 0
    );
  };

  const updateCareer = async (status: string) => {
    if (
      Number(minimumSalary) &&
      Number(maximumSalary) &&
      Number(minimumSalary) > Number(maximumSalary)
    ) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return;
    }
    let userInfoSlice = {
      image: user.image,
      name: user.name,
      email: user.email,
    };
    const updatedCareer = {
      _id: career._id,
      jobTitle,
      description,
      workSetup,
      workSetupRemarks,
      questions,
      lastEditedBy: userInfoSlice,
      status,
      updatedAt: Date.now(),
      cvScreeningSetting,
      aiScreeningSetting,
      requireVideo,
      salaryNegotiable,
      minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
      maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
      country,
      province,
      // Backwards compatibility
      location: city,
      employmentType,
    };
    try {
      setIsSavingCareer(true);
      const response = await axios.post("/api/update-career", updatedCareer);
      if (response.status === 200) {
        candidateActionToast(
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginLeft: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Career updated</span>
          </div>,
          1300,
          <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>
        );
        setTimeout(() => {
          window.location.href = `/recruiter-dashboard/careers/manage/${career._id}`;
        }, 1300);
      }
    } catch (error) {
      console.error(error);
      errorToast("Failed to update career", 1300);
    } finally {
      setIsSavingCareer(false);
    }
  };

  const confirmSaveCareer = (status: string) => {
    if (
      Number(minimumSalary) &&
      Number(maximumSalary) &&
      Number(minimumSalary) > Number(maximumSalary)
    ) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return;
    }

    setShowSaveModal(status);
  };

  const buildPayload = (status: string) => {
    let userInfoSlice = {
      image: user.image,
      name: user.name,
      email: user.email,
    };

    if (formType === "add") {
      return {
        jobTitle,
        description,
        workSetup,
        workSetupRemarks,
        questions,
        lastEditedBy: userInfoSlice,
        createdBy: userInfoSlice,
        cvScreeningSetting,
        aiScreeningSetting,
        orgID,
        requireVideo,
        salaryNegotiable,
        minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
        maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
        country,
        province,
        location: city,
        status,
        employmentType,
      };
    }

    // update
    return {
      _id: career?._id,
      jobTitle,
      description,
      workSetup,
      workSetupRemarks,
      questions,
      lastEditedBy: userInfoSlice,
      status,
      updatedAt: Date.now(),
      cvScreeningSetting,
      aiScreeningSetting,
      requireVideo,
      salaryNegotiable,
      minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
      maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
      country,
      province,
      location: city,
      employmentType,
    };
  };

  const saveDraft = async (status: string) => {
    if (
      Number(minimumSalary) &&
      Number(maximumSalary) &&
      Number(minimumSalary) > Number(maximumSalary)
    ) {
      errorToast("Minimum salary cannot be greater than maximum salary", 1300);
      return false;
    }

    setIsSavingCareer(true);
    try {
      // prepare payload
      const payload = buildPayload(status);

      // If creating a new career and we don't yet have a draftId, create it
      if (formType === "add" && !draftId) {
        const res = await axios.post("/api/add-career", payload);
        // add-career returns the created career object under res.data.career
        const returnedCareer = res?.data?.career;
        const returnedId =
          returnedCareer?.id ||
          returnedCareer?._id ||
          res?.data?._id ||
          res?.data?.insertedId ||
          res?.data?.id ||
          null;
        if (returnedId) setDraftId(String(returnedId));
        if (res.status === 200) {
          candidateActionToast(
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Draft saved</span>
            </div>,
            1200,
            <i className="la la-check-circle" style={{ color: "#039855", fontSize: 24 }}></i>
          );
          return true;
        }
      } else {
        // Otherwise, update existing draft (use draftId if present, otherwise career._id)
        const idToUse = draftId || career?._id;
        if (idToUse) {
          // If idToUse looks like a 24-char hex string, treat as Mongo _id; otherwise send as legacy `id`.
          const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(idToUse));
          if (isObjectId) (payload as any)._id = idToUse;
          else (payload as any).id = idToUse;
          const res = await axios.post("/api/update-career", payload);
          if (res.status === 200) {
            candidateActionToast(
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Draft saved</span>
              </div>,
              1200,
              <i className="la la-check-circle" style={{ color: "#039855", fontSize: 24 }}></i>
            );
            // ensure we keep track of id
            if (!draftId) setDraftId(String(idToUse));
            return true;
          }
        } else {
          // As a last resort, create a new draft
          const res = await axios.post("/api/add-career", payload);
          const returnedCareer = res?.data?.career;
          const returnedId =
            returnedCareer?.id ||
            returnedCareer?._id ||
            res?.data?._id ||
            res?.data?.insertedId ||
            res?.data?.id ||
            null;
          if (returnedId) setDraftId(String(returnedId));
          if (res.status === 200) {
            candidateActionToast(
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>Draft saved</span>
              </div>,
              1200,
              <i className="la la-check-circle" style={{ color: "#039855", fontSize: 24 }}></i>
            );
            return true;
          }
        }
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to save draft", 1300);
    } finally {
      setIsSavingCareer(false);
    }
    return false;
  };

  const saveAndContinue = async () => {
    if (!validateStep(currentStep)) return;
    const saved = await saveDraft("inactive");
    if (saved) {
      setCurrentStep((s) => Math.min(steps.length, s + 1));
    }
  };

  const publishNow = async () => {
    // On final step, publish the career. If we have a draftId, update it to active; otherwise create/publish.
    if (formType === "add") {
      if (draftId) {
        try {
          const payload = buildPayload("active");
          // attach identifier as _id (Mongo) or id (legacy guid) depending on shape
          const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(draftId));
          if (isObjectId) (payload as any)._id = draftId;
          else (payload as any).id = draftId;
          setIsSavingCareer(true);
          const res = await axios.post("/api/update-career", payload);
          if (res.status === 200) {
            // redirect to manage page for the career (prefer using draftId)
            window.location.href = `/recruiter-dashboard/careers/manage/${draftId}`;
          }
        } catch (err) {
          // surface server error details when available
          console.error("Publish error:", err);
          const serverMsg = err?.response?.data?.error || err?.message || "Failed to publish draft";
          errorToast(typeof serverMsg === "string" ? serverMsg : "Failed to publish draft", 2500);
        } finally {
          setIsSavingCareer(false);
        }
      } else {
        // no draft yet — fall back to full add flow (will redirect)
        confirmSaveCareer("active");
      }
    } else {
      // edit mode
      updateCareer("active");
    }
  };

  const saveCareer = async (status: string) => {
    setShowSaveModal("");
    if (!status) {
      return;
    }

    if (!savingCareerRef.current) {
      setIsSavingCareer(true);
      savingCareerRef.current = true;
      let userInfoSlice = {
        image: user.image,
        name: user.name,
        email: user.email,
      };
      const career = {
        jobTitle,
        description,
        workSetup,
        workSetupRemarks,
        questions,
        lastEditedBy: userInfoSlice,
        createdBy: userInfoSlice,
        cvScreeningSetting,
        aiScreeningSetting,
        orgID,
        requireVideo,
        salaryNegotiable,
        minimumSalary: isNaN(Number(minimumSalary)) ? null : Number(minimumSalary),
        maximumSalary: isNaN(Number(maximumSalary)) ? null : Number(maximumSalary),
        country,
        province,
        // Backwards compatibility
        location: city,
        status,
        employmentType,
      };

      try {
        const response = await axios.post("/api/add-career", career);
        if (response.status === 200) {
          candidateActionToast(
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginLeft: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: "#181D27" }}>
                Career added {status === "active" ? "and published" : ""}
              </span>
            </div>,
            1300,
            <i className="la la-check-circle" style={{ color: "#039855", fontSize: 32 }}></i>
          );
          setTimeout(() => {
            window.location.href = `/recruiter-dashboard/careers`;
          }, 1300);
        }
      } catch (error) {
        errorToast("Failed to add career", 1300);
      } finally {
        savingCareerRef.current = false;
        setIsSavingCareer(false);
      }
    }
  };

  useEffect(() => {
    const parseProvinces = () => {
      setProvinceList(philippineCitiesAndProvinces.provinces);
      const defaultProvince = philippineCitiesAndProvinces.provinces[0];
      if (!career?.province) {
        setProvince(defaultProvince.name);
      }
      const cities = philippineCitiesAndProvinces.cities.filter(
        (city) => city.province === defaultProvince.key
      );
      setCityList(cities);
      if (!career?.location) {
        setCity(cities[0].name);
      }
    };
    parseProvinces();
  }, [career]);

  return (
    <div className="col">
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {steps.map((s, idx) => {
          const stepIndex = idx + 1;
          const allowed = canGoTo(stepIndex);
          return (
            <div
              key={s}
              onClick={() => {
                if (allowed) setCurrentStep(stepIndex);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                cursor: allowed ? "pointer" : "not-allowed",
                background: currentStep === stepIndex ? "#111827" : "#F3F4F6",
                color: currentStep === stepIndex ? "#fff" : "#374151",
                fontWeight: currentStep === stepIndex ? 700 : 500,
                opacity: allowed ? 1 : 0.5,
              }}
            >
              {stepIndex}. {s}
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 550, color: "#111827" }}>
          {formType === "add" ? "Add new career" : "Edit Career Details"}
        </h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            disabled={!validateStep(currentStep) || isSavingCareer}
            style={{
              width: "fit-content",
              color: "#414651",
              background: "#fff",
              border: "1px solid #D5D7DA",
              padding: "8px 16px",
              borderRadius: "60px",
              cursor: !validateStep(currentStep) || isSavingCareer ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              // Save as Unpublished (draft)
              saveDraft("inactive");
            }}
          >
            Save as Unpublished
          </button>

          <button
            className="button-primary"
            disabled={!validateStep(currentStep) || isSavingCareer}
            style={{
              background: !validateStep(currentStep) || isSavingCareer ? "#D5D7DA" : "black",
              color: "#fff",
              borderRadius: "60px",
              padding: "8px 16px",
            }}
            onClick={() => {
              if (currentStep < steps.length) saveAndContinue();
              else publishNow();
            }}
          >
            {currentStep < steps.length ? "Save and continue" : "Publish"}
          </button>

          {formType !== "add" && (
            <button
              style={{
                width: "fit-content",
                color: "#414651",
                background: "#fff",
                border: "1px solid #D5D7DA",
                padding: "8px 16px",
                borderRadius: "60px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={() => {
                setShowEditModal?.(false);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          gap: 16,
          alignItems: "flex-start",
          marginTop: 16,
        }}
      >
        {/* Left Side */}
        <div
          style={{
            width: "60%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Render step-specific blocks */}
          {currentStep === 1 && (
            <>
              {/* STEP 1: Career Information */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
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
                      value={jobTitle}
                      className="form-control"
                      placeholder="Enter job title"
                      onChange={(e) => setJobTitle(e.target.value || "")}
                    />

                    {/* Work Setting */}
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                      Work Setting
                    </span>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
                        <span>Employment Type</span>
                        <CustomDropdown
                          onSelectSetting={(employmentType) => setEmploymentType(employmentType)}
                          screeningSetting={employmentType}
                          settingList={employmentTypeOptions}
                          placeholder="Choose employment type"
                        />
                      </div>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
                        <span>Arrangement</span>
                        <CustomDropdown
                          onSelectSetting={(setting) => setWorkSetup(setting)}
                          screeningSetting={workSetup}
                          settingList={workSetupOptions}
                          placeholder="Choose work arrangement"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                      Location
                    </span>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
                        <span>Country</span>
                        <CustomDropdown
                          onSelectSetting={(setting) => setCountry(setting)}
                          screeningSetting={country}
                          settingList={[]}
                          placeholder="Select Country"
                        />
                      </div>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
                        <span>State / Province</span>
                        <CustomDropdown
                          onSelectSetting={(province) => {
                            setProvince(province);
                            const provinceObj = provinceList.find((p) => p.name === province);
                            const cities = philippineCitiesAndProvinces.cities.filter(
                              (city) => city.province === provinceObj.key
                            );
                            setCityList(cities);
                            setCity(cities[0].name);
                          }}
                          screeningSetting={province}
                          settingList={provinceList}
                          placeholder="Select State / Province"
                        />
                      </div>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
                        <span>City</span>
                        <CustomDropdown
                          onSelectSetting={(city) => setCity(city)}
                          screeningSetting={city}
                          settingList={cityList}
                          placeholder="Select City"
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                        Salary
                      </span>
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
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
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
                            className="form-control"
                            style={{ paddingLeft: "28px" }}
                            placeholder="0"
                            min={0}
                            value={minimumSalary}
                            onChange={(e) => setMinimumSalary(e.target.value || "")}
                          />
                        </div>
                      </div>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
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
                            className="form-control"
                            style={{ paddingLeft: "28px" }}
                            placeholder="0"
                            min={0}
                            value={maximumSalary}
                            onChange={(e) => setMaximumSalary(e.target.value || "")}
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 1: Description */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
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
                    <RichTextEditor setText={setDescription} text={description} />
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* STEP 2: CV Review Settings */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
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
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                      CV Screening
                    </span>
                    <span>Jia automatically endorses candidates who meet the chosen criteria.</span>
                    <CustomDropdown
                      onSelectSetting={(setting) => setCvScreeningSetting(setting)}
                      screeningSetting={cvScreeningSetting}
                      settingList={screeningSettingList}
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: Pre-Screening Questions (optional) */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
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
                    <span>No pre-screening questions added yet. </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              {/* STEP 3: AI Interview Settings */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
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
                    <CustomDropdown
                      onSelectSetting={(setting) => setAiScreeningSetting(setting)}
                      screeningSetting={aiScreeningSetting}
                      settingList={screeningSettingList}
                    />

                    <div style={{ width: "100%", height: 1, backgroundColor: "#E9EAEB" }} />

                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                      Require Video on Interview
                    </span>
                    <span>
                      Require candidates to keep their camera on. Recordings will appear on their
                      analysis page.
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
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
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
              />
            </>
          )}

          {currentStep === 4 && (
            <>
              {/* STEP 4: Review */}
              <div className="layered-card-outer">
                <div className="layered-card-middle">
                  <div
                    style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontSize: 16,
                        color: "#181D27",
                        fontWeight: 700,
                      }}
                    >
                      Review your inputs
                    </span>
                  </div>
                  <div className="layered-card-content">
                    <h4>{jobTitle}</h4>
                    <div dangerouslySetInnerHTML={{ __html: description }} />
                    <hr />
                    <div>
                      <strong>CV Screening:</strong> {cvScreeningSetting}
                    </div>
                    <div>
                      <strong>AI Screening:</strong> {aiScreeningSetting}
                    </div>
                    <div>
                      <strong>Employment:</strong> {employmentType}
                    </div>
                    <div>
                      <strong>Work Arrangement:</strong> {workSetup}{" "}
                      {workSetupRemarks ? ` - ${workSetupRemarks}` : ""}
                    </div>
                    <div>
                      <strong>Salary:</strong> {salaryNegotiable ? "Negotiable" : "Fixed"}{" "}
                      {minimumSalary ? ` | Min: ${minimumSalary}` : ""}{" "}
                      {maximumSalary ? ` | Max: ${maximumSalary}` : ""}
                    </div>
                    <div>
                      <strong>Location:</strong> {country} / {province} / {city}
                    </div>
                    <div>
                      <strong>Question groups:</strong> {questions.length}
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <strong>Interview Questions</strong>
                      {questions.map((g) => (
                        <div key={g.id} style={{ marginTop: 8 }}>
                          <div style={{ fontWeight: 700 }}>{g.category}</div>
                          {Array.isArray(g.questions) && g.questions.length > 0 ? (
                            <ol style={{ marginLeft: 16 }}>
                              {g.questions.map((q: any, i: number) => (
                                <li key={i} style={{ marginBottom: 6 }}>
                                  {typeof q === "string"
                                    ? q
                                    : q?.question || q?.text || q?.prompt || JSON.stringify(q)}
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <div style={{ color: "#6b7280" }}>No questions added</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* (Step-specific blocks above) */}
        </div>

        {/* Right Side */}
        <div
          style={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div className="layered-card-outer">
            <div className="layered-card-middle">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>Tips</span>
              </div>
              <div className="layered-card-content">{/* Tips */}</div>
            </div>
          </div>
        </div>
      </div>
      {showSaveModal && (
        <CareerActionModal action={showSaveModal} onAction={(action) => saveCareer(action)} />
      )}
      {isSavingCareer && (
        <FullScreenLoadingAnimation
          title={formType === "add" ? "Saving career..." : "Updating career..."}
          subtext={`Please wait while we are ${formType === "add" ? "saving" : "updating"} the career`}
        />
      )}
      {/* Navigation handled by top controls */}
    </div>
  );
}
