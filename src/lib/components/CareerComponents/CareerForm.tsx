"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
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
    questions: z
      .array(z.any())
      .refine(
        (qs) =>
          Array.isArray(qs) &&
          qs.some((g: any) => Array.isArray(g.questions) && g.questions.length > 0),
        {
          message: "Add at least one interview question",
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

  function validateStepWithZod(step: number) {
    setErrors({});
    let result;
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

    // map zod errors to simple field messages
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
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                      Work Setting
                    </span>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
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
                          <div style={{ color: "#ef4444", marginTop: 6 }}>
                            {errors.employmentType}
                          </div>
                        )}
                      </div>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
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
                    <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                      Location
                    </span>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
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
                            onSelectSetting={(province) => {
                              setProvince(province);
                              if (errors.province) clearError("province");
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
                            invalid={!!errors.province}
                            fitContent={true}
                          />
                        </div>
                        {errors.province && (
                          <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.province}</div>
                        )}
                      </div>
                      <div
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                      >
                        <span>City</span>
                        <div data-field="city">
                          <CustomDropdown
                            onSelectSetting={(city) => {
                              setCity(city);
                              if (errors.city) clearError("city");
                            }}
                            screeningSetting={city}
                            settingList={cityList}
                            placeholder="Select City"
                            invalid={!!errors.city}
                          />
                        </div>
                        {errors.city && (
                          <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.city}</div>
                        )}
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
                          <div style={{ color: "#ef4444", marginTop: 6 }}>
                            {errors.minimumSalary}
                          </div>
                        )}
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
                          <div style={{ color: "#ef4444", marginTop: 6 }}>
                            {errors.maximumSalary}
                          </div>
                        )}
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
                    <div
                      data-field="description"
                      style={
                        errors.description
                          ? { border: "1px solid #ef4444", borderRadius: 6 }
                          : undefined
                      }
                    >
                      <RichTextEditor setText={handleSetDescription} text={description} />
                    </div>
                    {errors.description && (
                      <div style={{ color: "#ef4444", marginTop: 6 }}>{errors.description}</div>
                    )}
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
                      <div style={{ color: "#ef4444", marginTop: 6 }}>
                        {errors.cvScreeningSetting}
                      </div>
                    )}
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
                      <div style={{ color: "#ef4444", marginTop: 6 }}>
                        {errors.aiScreeningSetting}
                      </div>
                    )}

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
                error={errors.questions}
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
