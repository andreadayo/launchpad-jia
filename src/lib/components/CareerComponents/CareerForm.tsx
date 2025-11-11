"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import InterviewQuestionGeneratorV2 from "./InterviewQuestionGeneratorV2";
import RichTextEditor from "@/lib/components/CareerComponents/RichTextEditor";
import CustomDropdown from "@/lib/components/CareerComponents/CustomDropdown";
import CollapsibleLayeredCard from "@/lib/components/CareerComponents/CollapsibleLayeredCard";
import Step1CareerInfo from "@/lib/components/CareerComponents/steps/Step1CareerInfo";
import Step2CVReview from "@/lib/components/CareerComponents/steps/Step2CVReview";
import Step3AIInterview from "@/lib/components/CareerComponents/steps/Step3AIInterview";
import Step4ReviewList from "@/lib/components/CareerComponents/steps/Step4ReviewList";
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
      // require an AI screening selection and at least 5 total questions across groups
      if (!data.aiScreeningSetting) return false;
      if (!Array.isArray(data.questions)) return false;
      let totalQuestions = 0;
      for (const g of data.questions) {
        if (g && Array.isArray((g as any).questions)) totalQuestions += (g as any).questions.length;
      }
      return totalQuestions >= 5;
    case 4:
      // overall minimal validity: jobTitle, description, and at least 5 total interview questions
      if (!data.jobTitle || !data.description) return false;
      if (!Array.isArray(data.questions)) return false;
      let total = 0;
      for (const q of data.questions) {
        if (q && Array.isArray((q as any).questions)) total += (q as any).questions.length;
      }
      return !!(
        data.jobTitle.trim().length > 0 &&
        data.description.trim().length > 0 &&
        total >= 5
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

// Structured tips per step
const tipsByStep = {
  1: [
    {
      part1: "Use clear, standard job titles",
      part2:
        "for better searchability (e.g., “Software Engineer” instead of “Code Ninja” or “Tech Rockstar”).",
    },
    {
      part1: "Avoid abbreviations",
      part2:
        "or internal role codes that applicants may not understand (e.g., use “QA Engineer” instead of “QE II” or “QA-TL”).",
    },
    {
      part1: "Keep it concise",
      part2:
        "- job titles should be no more than a few words (2-4 max), avoiding fluff or marketing terms.",
    },
  ],
  2: [
    {
      part1: "Add a Secret Prompt",
      part2: "to fine-tune how Jia scores and evaluates submitted CVs.",
    },
    {
      part1: "Add Pre-Screening questions",
      part2:
        "to collect key details such as notice period, work setup, or salary expectations to guide your review and candidate discussions.",
    },
  ],
  3: [
    {
      part1: "Add a Secret Prompt",
      part2: "to fine-tune how Jia scores and evaluates the interview responses.",
    },
    {
      part1: "Use “Generate Questions”",
      part2:
        "to quickly create tailored interview questions, then refine or mix them with your own for balanced results.",
    },
  ],
};

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
  const [employmentType, setEmploymentType] = useState(career?.employmentType || "");
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
  const [preScreeningQuestions, setPreScreeningQuestions] = useState<any[]>(
    career?.preScreeningQuestions || []
  );
  const [provinceList, setProvinceList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState("");
  const [isSavingCareer, setIsSavingCareer] = useState(false);
  const [isPublishingCareer, setIsPublishingCareer] = useState(false);
  const savingCareerRef = useRef(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<string | null>(career?._id || null);
  const steps = ["Career Info", "CV Review", "AI Interview", "Review"];

  // Validation errors keyed by field name
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev || !(key in prev)) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSetDescription = (text: string) => {
    setDescription(text);
    if (errors.description) clearError("description");
  };

  // Zod schemas per step
  const step1Schema = z.object({
    jobTitle: z.string().min(1, "This is a required field."),
    description: z.string().min(1, "This is a required field."),
    employmentType: z.string().min(1, "This is a required field."),
    workSetup: z.string().min(1, "This is a required field."),
    country: z.string().min(1, "This is a required field."),
    province: z.string().min(1, "This is a required field."),
    city: z.string().min(1, "This is a required field."),
    minimumSalary: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z.number({ invalid_type_error: "Minimum salary is required" }).nonnegative()
    ),
    maximumSalary: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z.number({ invalid_type_error: "Maximum salary is required" }).nonnegative()
    ),
  });

  // Ensure min <= max
  const step1SchemaWithRefine = step1Schema.refine(
    (data: any) => data.minimumSalary <= data.maximumSalary,
    {
      message: "Minimum salary cannot be greater than maximum salary",
      path: ["minimumSalary"],
    }
  );

  const step2Schema = z.object({
    cvScreeningSetting: z.string().min(1, "Please select a CV screening setting"),
  });

  const step3Schema = z.object({
    aiScreeningSetting: z.string().min(1, "Please select an AI screening setting"),
    questions: z.array(z.any()).refine(
      (qs) => {
        if (!Array.isArray(qs)) return false;
        // count total questions across all groups
        let total = 0;
        for (const g of qs) {
          if (g && Array.isArray(g.questions)) total += g.questions.length;
        }
        return total >= 5;
      },
      {
        message: "Add at least 5 interview questions (total across all groups)",
      }
    ),
  });

  function buildDataForStep(step: number) {
    switch (step) {
      case 1:
        return {
          jobTitle,
          description,
          employmentType,
          workSetup,
          country,
          province,
          city,
          minimumSalary,
          maximumSalary,
        };
      case 2:
        return { cvScreeningSetting };
      case 3:
        return { aiScreeningSetting, questions };
      case 4:
        return { jobTitle, description, questions };
      default:
        return {};
    }
  }

  // Validate current step using Zod schemas and populate `errors` map
  function validateStepWithZod(step: number) {
    // reset previous errors
    setErrors({});
    let result: any;
    try {
      if (step === 1) result = step1SchemaWithRefine.safeParse(buildDataForStep(step));
      else if (step === 2) result = step2Schema.safeParse(buildDataForStep(step));
      else if (step === 3) result = step3Schema.safeParse(buildDataForStep(step));
      else result = { success: true } as const;
    } catch (e) {
      result = { success: false, error: e } as any;
    }

    if (result && result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Record<string, string> = {};
    const issues = (result as any).error?.issues || [];
    for (const issue of issues) {
      const path =
        Array.isArray(issue.path) && issue.path.length > 0 ? String(issue.path[0]) : "questions";
      newErrors[path] = issue.message;
    }
    setErrors(newErrors);
    return false;
  }

  // Can navigate to a given step only if all previous steps are valid
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
      preScreeningQuestions,
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
        preScreeningQuestions,
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
      preScreeningQuestions,
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

  const handleSaveAndContinue = async () => {
    // Always allow clicking the button. Validate with zod and surface field errors.
    const ok = validateStepWithZod(currentStep);
    if (!ok) {
      // don't progress; errors state is set by validator
      // scroll first error into view
      const firstKey = Object.keys(errors || {})[0];
      if (firstKey) {
        const el = document.querySelector(`[data-field="${firstKey}"]`);
        if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // clear errors and save+move forward
    setErrors({});
    const saved = await saveDraft("inactive");
    if (saved) setCurrentStep((s) => Math.min(steps.length, s + 1));
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
          setIsPublishingCareer(true);
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
          setIsPublishingCareer(false);
        }
      } else {
        // no draft yet — fall back to full add flow (will redirect)
        confirmSaveCareer("active");
      }
    } else {
      // edit mode
      setIsPublishingCareer(true);
      try {
        await updateCareer("active");
      } finally {
        setIsPublishingCareer(false);
      }
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
        preScreeningQuestions,
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
      const provinces = philippineCitiesAndProvinces.provinces;
      setProvinceList(provinces);

      // If editing an existing career, populate province and city from the career values.
      if (career?.province) {
        setProvince(career.province);
        // Find province key to filter cities
        const provinceObj = provinces.find(
          (p) => p.name === career.province || p.key === career.province
        );
        const cities = provinceObj
          ? philippineCitiesAndProvinces.cities.filter((city) => city.province === provinceObj.key)
          : [];
        setCityList(cities);
        setCity(career?.location || (cities[0] ? cities[0].name : ""));
      } else {
        // New form: leave province and city empty so placeholder shows; no default selection
        setProvince("");
        setCityList([]);
        setCity("");
      }
    };
    parseProvinces();
  }, [career]);

  function validateStep(step: number): boolean {
    // reuse the shared validation logic with the data for the given step
    const data = buildDataForStep(step);
    return validateStepForData(data, step);
  }

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
            disabled={isSavingCareer}
            style={{
              background: isSavingCareer ? "#D5D7DA" : "black",
              color: "#fff",
              borderRadius: "60px",
              padding: "8px 16px",
            }}
            onClick={() => {
              if (currentStep < steps.length) handleSaveAndContinue();
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
            width: currentStep === 4 ? "100%" : "60%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* Render step-specific blocks */}
          {currentStep === 1 && (
            <Step1CareerInfo
              jobTitle={jobTitle}
              setJobTitle={(v) => {
                setJobTitle(v);
                if (errors.jobTitle) clearError("jobTitle");
              }}
              description={description}
              setDescription={handleSetDescription}
              employmentType={employmentType}
              setEmploymentType={(v) => setEmploymentType(v)}
              workSetup={workSetup}
              setWorkSetup={(v) => setWorkSetup(v)}
              country={country}
              setCountry={(v) => setCountry(v)}
              province={province}
              setProvince={(v) => setProvince(v)}
              city={city}
              setCity={(v) => setCity(v)}
              provinceList={provinceList}
              cityList={cityList}
              onProvinceSelect={(prov) => {
                setProvince(prov);
                if (errors.province) clearError("province");
                const provinceObj = provinceList.find((p) => p.name === prov);
                const cities = provinceObj
                  ? philippineCitiesAndProvinces.cities.filter(
                      (city) => city.province === provinceObj.key
                    )
                  : [];
                setCityList(cities);
                setCity(cities[0] ? cities[0].name : "");
              }}
              salaryNegotiable={salaryNegotiable}
              setSalaryNegotiable={(v) => setSalaryNegotiable(v)}
              minimumSalary={minimumSalary}
              setMinimumSalary={(v) => setMinimumSalary(v)}
              maximumSalary={maximumSalary}
              setMaximumSalary={(v) => setMaximumSalary(v)}
              errors={errors}
              clearError={clearError}
              employmentTypeOptions={employmentTypeOptions}
              workSetupOptions={workSetupOptions}
            />
          )}

          {currentStep === 2 && (
            <Step2CVReview
              cvScreeningSetting={cvScreeningSetting}
              setCvScreeningSetting={(s) => setCvScreeningSetting(s)}
              errors={errors}
              clearError={clearError}
              screeningSettingList={screeningSettingList}
              preScreeningQuestions={preScreeningQuestions}
              setPreScreeningQuestions={setPreScreeningQuestions}
            />
          )}

          {currentStep === 3 && (
            <Step3AIInterview
              aiScreeningSetting={aiScreeningSetting}
              setAiScreeningSetting={(s) => setAiScreeningSetting(s)}
              errors={errors}
              clearError={clearError}
              requireVideo={requireVideo}
              setRequireVideo={(b) => setRequireVideo(b)}
              questions={questions}
              setQuestions={(q) => setQuestions(q)}
              jobTitle={jobTitle}
              description={description}
              screeningSettingList={screeningSettingList}
            />
          )}
        </div>

        {/* Right Side */}
        {currentStep !== 4 && (
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
                <div className="layered-card-content">
                  {(tipsByStep[currentStep] || []).map((tip, i) => (
                    <div className="career-tip" key={i}>
                      <span className="career-tip-part1">{tip.part1}</span>{" "}
                      {tip.part2 && <span className="career-tip-part2">{tip.part2}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 4: Review */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {currentStep === 4 && (
          <>
            {/* STEP 1: Review */}
            <CollapsibleLayeredCard
              title={<span>Career Details & Team Access</span>}
              defaultExpanded={true}
              showEdit={true}
              onEdit={() => setCurrentStep(1)}
            >
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
            </CollapsibleLayeredCard>

            {/* STEP 2: Review */}
            <CollapsibleLayeredCard
              title={<span>CV Review & Pre-Screening Questions</span>}
              defaultExpanded={true}
              showEdit={true}
              onEdit={() => setCurrentStep(2)}
            >
              <div>
                <strong>CV Screening:</strong> {cvScreeningSetting}
              </div>
              <div style={{ marginTop: 12 }}>
                <strong>Pre-Screening Questions</strong>
                {preScreeningQuestions && preScreeningQuestions.length > 0 ? (
                  <ol style={{ marginLeft: 16, marginTop: 8 }}>
                    {preScreeningQuestions.map((pq: any, i: number) => (
                      <li key={pq.id || i} style={{ marginBottom: 6 }}>
                        <div style={{ fontWeight: 600 }}>{pq.text || pq.question || pq.title}</div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>
                          {pq.type === "dropdown" && Array.isArray(pq.options) ? (
                            <div>Options: {pq.options.join(", ")}</div>
                          ) : pq.type === "range" ? (
                            <div>
                              Range: {pq.rangeMin ?? ""} - {pq.rangeMax ?? ""}
                            </div>
                          ) : pq.type === "checkboxes" ? (
                            <div>
                              {Array.isArray(pq.options) && pq.options.length > 0 ? (
                                <div>
                                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Options</div>
                                  <ul style={{ marginLeft: 16, marginTop: 6 }}>
                                    {pq.options.map((opt: any, oi: number) => {
                                      const label =
                                        typeof opt === "string"
                                          ? opt
                                          : (opt?.label ??
                                            opt?.text ??
                                            opt?.value ??
                                            JSON.stringify(opt));
                                      return (
                                        <li key={oi} style={{ marginBottom: 4 }}>
                                          {label}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                  <div style={{ marginTop: 6 }}>
                                    Selected:{" "}
                                    {typeof pq.minChecked !== "undefined" ? pq.minChecked : 0} to{" "}
                                    {typeof pq.maxChecked !== "undefined"
                                      ? pq.maxChecked
                                      : (pq.options?.length ?? 0)}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ color: "#9CA3AF" }}>No options yet</div>
                              )}
                            </div>
                          ) : pq.type === "short" ? (
                            <div>Short answer</div>
                          ) : pq.type === "long" ? (
                            <div>Long answer</div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div style={{ color: "#6b7280", marginTop: 8 }}>
                    No pre-screening questions added
                  </div>
                )}
              </div>
            </CollapsibleLayeredCard>

            {/* STEP 3: Review */}
            <CollapsibleLayeredCard
              title={<span>AI Interview Setup</span>}
              defaultExpanded={true}
              showEdit={true}
              onEdit={() => setCurrentStep(3)}
            >
              <div>
                <strong>AI Screening:</strong> {aiScreeningSetting}
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
            </CollapsibleLayeredCard>
          </>
        )}
      </div>

      {showSaveModal && (
        <CareerActionModal action={showSaveModal} onAction={(action) => saveCareer(action)} />
      )}
      {(isSavingCareer || isPublishingCareer) && (
        <FullScreenLoadingAnimation
          title={
            isPublishingCareer
              ? formType === "add"
                ? "Publishing career..."
                : "Publishing updates..."
              : formType === "add"
                ? "Saving career..."
                : "Updating career..."
          }
          subtext={
            isPublishingCareer
              ? `Please wait while we are ${formType === "add" ? "publishing" : "publishing updates for"} the career`
              : `Please wait while we are ${formType === "add" ? "saving" : "updating"} the career`
          }
        />
      )}
      {/* Navigation handled by top controls */}
    </div>
  );
}
