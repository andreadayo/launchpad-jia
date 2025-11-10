import React from "react";
import CollapsibleLayeredCard from "@/lib/components/CareerComponents/CollapsibleLayeredCard";

type Props = {
  jobTitle: string;
  description: string;
  cvScreeningSetting: string;
  aiScreeningSetting: string;
  employmentType: string;
  workSetup: string;
  workSetupRemarks: string;
  salaryNegotiable: boolean;
  minimumSalary: string;
  maximumSalary: string;
  country: string;
  province: string;
  city: string;
  questions: any[];
  onEditStep: (step: number) => void;
};

export default function Step4ReviewList({
  jobTitle,
  description,
  cvScreeningSetting,
  aiScreeningSetting,
  employmentType,
  workSetup,
  workSetupRemarks,
  salaryNegotiable,
  minimumSalary,
  maximumSalary,
  country,
  province,
  city,
  questions,
  onEditStep,
}: Props) {
  return (
    <>
      <CollapsibleLayeredCard
        title={<span>Career Details & Team Access</span>}
        defaultExpanded={true}
        showEdit={true}
        onEdit={() => onEditStep(1)}
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

      <CollapsibleLayeredCard
        title={<span>CV Review & Pre-Screening Questions</span>}
        defaultExpanded={true}
        showEdit={true}
        onEdit={() => onEditStep(2)}
      >
        <div>
          <strong>CV Screening:</strong> {cvScreeningSetting}
        </div>
      </CollapsibleLayeredCard>

      <CollapsibleLayeredCard
        title={<span>AI Interview Setup</span>}
        defaultExpanded={true}
        showEdit={true}
        onEdit={() => onEditStep(3)}
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
  );
}
