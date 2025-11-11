import React from "react";
import CollapsibleLayeredCard from "@/lib/components/CareerComponents/CollapsibleLayeredCard";

type Props = {
  formData?: any;
  jobTitle?: string;
  description?: string;
  cvScreeningSetting?: string;
  aiScreeningSetting?: string;
  employmentType?: string;
  workSetup?: string;
  workSetupRemarks?: string;
  salaryNegotiable?: boolean;
  minimumSalary?: string | number | null;
  maximumSalary?: string | number | null;
  country?: string;
  province?: string;
  city?: string;
  questions?: any[];
  preScreeningQuestions?: any[];
  requireVideo?: boolean;
  onEditStep?: (step: number) => void;
  isEditing?: boolean;
  setFormData?: (d: any) => void;
};

export default function Step4ReviewList(props: Props) {
  const { formData, onEditStep } = props;

  // normalize values: prefer `formData` when provided, otherwise use individual props
  const jobTitle = formData?.jobTitle ?? props.jobTitle ?? "";
  const description = formData?.description ?? props.description ?? "";
  const cvScreeningSetting =
    formData?.cvScreeningSetting ?? props.cvScreeningSetting ?? formData?.screeningSetting ?? "";
  const aiScreeningSetting =
    formData?.aiScreeningSetting ?? props.aiScreeningSetting ?? formData?.screeningSetting ?? "";
  const employmentType = formData?.employmentType ?? props.employmentType ?? "";
  const workSetup = formData?.workSetup ?? props.workSetup ?? "";
  const workSetupRemarks = formData?.workSetupRemarks ?? props.workSetupRemarks ?? "";
  const salaryNegotiable =
    typeof formData?.salaryNegotiable !== "undefined"
      ? formData.salaryNegotiable
      : (props.salaryNegotiable ?? false);
  const minimumSalary = formData?.minimumSalary ?? props.minimumSalary ?? "";
  const maximumSalary = formData?.maximumSalary ?? props.maximumSalary ?? "";
  const country = formData?.country ?? props.country ?? "";
  const province = formData?.province ?? props.province ?? "";
  const city = formData?.location ?? formData?.city ?? props.city ?? "";
  const questions = formData?.questions ?? props.questions ?? [];
  const preScreeningQuestions =
    formData?.preScreeningQuestions ?? props.preScreeningQuestions ?? [];
  const requireVideo =
    typeof formData?.requireVideo !== "undefined"
      ? formData.requireVideo
      : (props.requireVideo ?? true);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* STEP 1: Career Details & Team Access */}
      <CollapsibleLayeredCard
        title={<span>Career Details & Team Access</span>}
        defaultExpanded={true}
        showEdit={true}
        onEdit={() => onEditStep && onEditStep(1)}
      >
        {/* Row 1 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Job Title</h4>
            <span>{jobTitle}</span>
          </div>
        </div>

        {/* Row 2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Employment Type</h4>
            <span>{employmentType}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Work Arrangement</h4>
            <span>{workSetup}</span>
          </div>
        </div>

        {/* Row 3 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Country</h4>
            <span>{country}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>State / Province</h4>
            <span>{province}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>City</h4>
            <span>{city}</span>
          </div>
        </div>

        {/* Row 4 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Minimum Salary</h4>
            <span>{minimumSalary}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Maximum Salary</h4>
            <span>{maximumSalary}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Negotiable?</h4>
            <span>{salaryNegotiable ? "Yes" : "No"}</span>
          </div>
        </div>

        {/* Row 5 */}
        <div
          style={{
            padding: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>Job Description</h4>
            <div dangerouslySetInnerHTML={{ __html: description }} />
          </div>
        </div>
      </CollapsibleLayeredCard>

      {/* STEP 2: CV Review & Pre-Screening Questions */}
      <CollapsibleLayeredCard
        title={<span>CV Review & Pre-Screening Questions</span>}
        defaultExpanded={true}
        showEdit={true}
        onEdit={() => onEditStep && onEditStep(2)}
      >
        {/* Row 1 */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>CV Screening</h4>
            <span>Automatically endorse candidates who are {cvScreeningSetting}</span>
          </div>
        </div>

        {/* Row 2 */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>
              Pre-Screening Questions ({preScreeningQuestions?.length ?? 0})
            </h4>
            {preScreeningQuestions && preScreeningQuestions.length > 0 ? (
              <ol style={{ marginLeft: 16, marginTop: 8 }}>
                {preScreeningQuestions.map((pq: any, i: number) => (
                  <li key={pq.id || i} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 600 }}>{pq.text || pq.question || pq.title}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      {pq.type === "dropdown" && Array.isArray(pq.options) ? (
                        <div>
                          {Array.isArray(pq.options) && pq.options.length > 0 ? (
                            <div>
                              <ul style={{ marginTop: 6 }}>
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
                            </div>
                          ) : (
                            <div style={{ color: "#9CA3AF" }}>No options yet</div>
                          )}
                        </div>
                      ) : pq.type === "range" ? (
                        <div>
                          Preferred: {pq.rangeMin ?? ""} - {pq.rangeMax ?? ""}
                        </div>
                      ) : pq.type === "checkboxes" ? (
                        <div>
                          {Array.isArray(pq.options) && pq.options.length > 0 ? (
                            <div>
                              <ul style={{ marginTop: 6 }}>
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
                                Selected: {typeof pq.minChecked !== "undefined" ? pq.minChecked : 0}{" "}
                                to{" "}
                                {typeof pq.maxChecked !== "undefined"
                                  ? pq.maxChecked
                                  : (pq.options?.length ?? 0)}
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: "#9CA3AF" }}>No options yet</div>
                          )}
                        </div>
                      ) : pq.type === "short answer" ? (
                        <div>Short answer</div>
                      ) : pq.type === "long answer" ? (
                        <div>Long answer</div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div style={{ color: "#6b7280", marginTop: 8 }}>No pre-screening questions added</div>
            )}
          </div>
        </div>
      </CollapsibleLayeredCard>

      {/* STEP 3: AI Interview Setup */}
      <CollapsibleLayeredCard
        title={<span>AI Interview Setup </span>}
        defaultExpanded={true}
        showEdit={true}
        onEdit={() => onEditStep && onEditStep(3)}
      >
        {/* Row 1 */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h4 style={{ fontSize: 14 }}>AI Interview Screening</h4>
            <span>Automatically endorse candidates who are {aiScreeningSetting}</span>
          </div>
        </div>

        {/* Row 2 */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: 14 }}>Require Video On Interview</h4>
            <span>{requireVideo ? "Yes" : "No"}</span>
          </div>
        </div>

        {/* Row 3 */}
        <div style={{ marginTop: 12, padding: 12 }}>
          <h4 style={{ fontSize: 14 }}>
            Interview Questions (
            {questions.reduce(
              (acc, g) => acc + (Array.isArray(g.questions) ? g.questions.length : 0),
              0
            )}
            )
          </h4>
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
    </div>
  );
}
