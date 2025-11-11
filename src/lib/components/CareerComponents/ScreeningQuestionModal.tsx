"use client";
import { useState } from "react";
import CustomDropdown from "./CustomDropdown";

export default function ScreeningQuestionModal({
  questionToEdit,
  action = "add",
  onAction,
  onClose,
}: {
  questionToEdit?: { id?: string | number; question?: string; type?: string };
  action?: "add" | "edit";
  onAction: (action: string, question?: string, type?: string, id?: string | number) => void;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState(questionToEdit?.question ?? "");
  const [type, setType] = useState<string>(questionToEdit?.type ?? "dropdown");

  const questionTypeList = [
    { name: "dropdown", label: "Dropdown", icon: "la la-list" },
    { name: "range", label: "Range", icon: "la la-sliders" },
    { name: "short answer", label: "Short answer", icon: "la la-font" },
    { name: "long answer", label: "Long answer", icon: "la la-align-left" },
    { name: "checkboxes", label: "Checkboxes", icon: "la la-check-square" },
  ];

  const title = action === "edit" ? "Edit Screening Question" : "Add Screening Question";
  const buttonText = action === "edit" ? "Save Changes" : "Add Question";

  const actions = {
    add: {
      icon: "la-pencil-alt",
      color: "#181D27",
      iconColor: "#039855",
      iconBgColor: "#D1FADF",
    },
    edit: {
      icon: "la-pencil-alt",
      color: "#181D27",
      iconColor: "#DC6803",
      iconBgColor: "#FEF0C7",
    },
  } as any;

  return (
    <div
      className="modal show fade-in-bottom"
      style={{
        display: "block",
        background: "rgba(0,0,0,0.45)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1050,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
        }}
      >
        <div
          className="modal-content"
          style={{
            // Allow children (dropdown menus) to overflow so they aren't clipped by the modal
            overflow: "visible",
            height: "fit-content",
            width: "fit-content",
            background: "#fff",
            border: `1.5px solid #E9EAEB`,
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(30,32,60,0.18)",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                border: "1px solid #E9EAEB",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: actions[action]?.iconBgColor,
              }}
            >
              <i
                className={`la ${actions[action]?.icon}`}
                style={{ fontSize: 24, color: actions[action]?.iconColor }}
              />
            </div>
            <h3 className="modal-title">{title}</h3>

            <textarea
              className="interview-question-input"
              placeholder="Enter your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ textAlign: "left", width: "100%", fontSize: 13, color: "#374151" }}>
                Type
              </label>
              {/* raise z-index for the dropdown wrapper so its menu renders above other elements */}
              <div style={{ display: "flex", zIndex: 9999 }}>
                <CustomDropdown
                  onSelectSetting={(name: string) => setType(name)}
                  screeningSetting={type}
                  settingList={questionTypeList}
                  placeholder="Select type"
                  fitContent={true}
                  invalid={false}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 16,
                width: "100%",
              }}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                style={{
                  display: "flex",
                  width: "50%",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: 8,
                  backgroundColor: "#FFFFFF",
                  borderRadius: "60px",
                  border: "1px solid #D5D7DA",
                  cursor: "pointer",
                  padding: "10px 0px",
                }}
              >
                Cancel
              </button>
              <button
                disabled={!question?.trim()}
                onClick={(e) => {
                  e.preventDefault();
                  onAction(action, question.trim(), type, questionToEdit?.id);
                }}
                style={{
                  display: "flex",
                  width: "50%",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  gap: 8,
                  backgroundColor: !question?.trim() ? "#D5D7DA" : actions[action]?.color,
                  color: "#FFFFFF",
                  borderRadius: "60px",
                  border: "1px solid #D5D7DA",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
