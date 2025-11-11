import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";
import CustomDropdown from "./CustomDropdown";

export default function PreScreeningQuestions({
  questions,
  setQuestions,
  error,
}: {
  questions: any[];
  setQuestions: Dispatch<SetStateAction<any[]>>;
  error?: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [type, setType] = useState<
    "dropdown" | "range" | "short answer" | "long answer" | "checkboxes"
  >("dropdown");
  const [options, setOptions] = useState<string[]>([]);
  const [rangeMin, setRangeMin] = useState<number | "">("");
  const [rangeMax, setRangeMax] = useState<number | "">("");
  const [minChecked, setMinChecked] = useState<number | "">("");
  const [maxChecked, setMaxChecked] = useState<number | "">("");
  const [modalError, setModalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // list used by the small type selector dropdown
  const questionTypeList = [
    { name: "short answer", icon: "las la-user" },
    { name: "long answer", icon: "las la-align-left" },
    { name: "dropdown", icon: "las la-chevron-circle-down" },
    { name: "checkboxes", icon: "la la-check-circle" },
    { name: "range", icon: "las la-sort-numeric-down" },
  ];

  function displayText(q: any) {
    return q?.text || q?.question || q?.title || "";
  }

  // open modal for adding
  function openAddModal() {
    setEditingId(null);
    setText("");
    setType("dropdown");
    setOptions([]);
    setRangeMin("");
    setRangeMax("");
    setMinChecked("");
    setMaxChecked("");
    setShowModal(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function openEditModal(q: any) {
    setEditingId(q.id);
    setText(q.text || q.question || q.title || "");
    setType(q.type || "dropdown");
    setOptions(Array.isArray(q.options) ? q.options.slice() : []);
    setRangeMin(q.rangeMin ?? "");
    setRangeMax(q.rangeMax ?? "");
    setMinChecked(q.minChecked ?? "");
    setMaxChecked(q.maxChecked ?? "");
    setShowModal(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function closeModal() {
    setShowModal(false);
  }

  function addOrUpdateQuestion() {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    if (type === "dropdown" && (!options || options.length === 0)) {
      setModalError("Please add at least one option");
      return;
    }
    // validate checkboxes min/max relative to options (user-visible error, do not auto-correct)
    if (type === "checkboxes") {
      const len = Array.isArray(options) ? options.length : 0;
      const minN = minChecked === "" ? 0 : Number(minChecked);
      const maxN = maxChecked === "" ? len : Number(maxChecked);

      if (isNaN(minN) || isNaN(maxN)) {
        setModalError("Min and Max must be valid numbers");
        return;
      }

      if (len === 0) {
        if (minN !== 0 || maxN !== 0) {
          setModalError("With no options, Min and Max must both be 0");
          return;
        }
      } else {
        if (minN < 0 || maxN < 0 || minN > maxN || maxN > len) {
          setModalError(
            `Invalid range: require 0 \u2264 min \u2264 max \u2264 number of options (${len})`
          );
          return;
        }
      }
      // passed validation — clear any previous error
      setModalError(null);

      const minToSave = minN;
      const maxToSave = maxN;

      if (editingId) {
        const updated = [...(questions || [])];
        const qi = updated.findIndex((it: any) => it.id === editingId);
        if (qi !== -1) {
          const newItem: any = {
            ...updated[qi],
            text: trimmed,
            type,
            options: options.slice(),
            minChecked: minToSave,
            maxChecked: maxToSave,
          };
          updated[qi] = newItem;
          setQuestions(updated);
        }
      } else {
        const q: any = {
          id: `q_${Date.now()}`,
          text: trimmed,
          type,
          options: options.slice(),
          minChecked: minToSave,
          maxChecked: maxToSave,
        };
        setQuestions([...(questions || []), q]);
      }
    } else {
      // non-checkbox types: clear any modal error and proceed
      setModalError(null);

      if (editingId) {
        const updated = [...(questions || [])];
        const qi = updated.findIndex((it: any) => it.id === editingId);
        if (qi !== -1) {
          const newItem: any = {
            ...updated[qi],
            text: trimmed,
            type,
          };
          if (type === "range") {
            newItem.rangeMin = rangeMin;
            newItem.rangeMax = rangeMax;
          }
          if (type === "dropdown") newItem.options = options.slice();
          updated[qi] = newItem;
          setQuestions(updated);
        }
      } else {
        const q: any = {
          id: `q_${Date.now()}`,
          text: trimmed,
          type,
        };
        if (type === "range") {
          q.rangeMin = rangeMin;
          q.rangeMax = rangeMax;
        }
        if (type === "dropdown") q.options = options.slice();
        setQuestions([...(questions || []), q]);
      }
    }

    closeModal();
  }

  // Helpers to coerce min/max to valid bounds relative to options length
  function normalizeMinChecked(minVal: number | "", optionsArr: string[]) {
    const len = Array.isArray(optionsArr) ? optionsArr.length : 0;
    if (len === 0) return 0;
    if (minVal === "" || minVal === null || minVal === undefined) return 0;
    const n = Number(minVal);
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(n, len));
  }

  function normalizeMaxChecked(maxVal: number | "", minVal: number | "", optionsArr: string[]) {
    const len = Array.isArray(optionsArr) ? optionsArr.length : 0;
    if (len === 0) return 0;
    let m: number;
    if (maxVal === "" || maxVal === null || maxVal === undefined) m = len;
    else m = Number(maxVal);
    if (isNaN(m)) m = len;
    const minN = normalizeMinChecked(minVal, optionsArr);
    m = Math.max(minN, Math.min(m, len));
    return m;
  }

  function deleteQuestion(id: string) {
    setQuestions((s: any[]) => (s || []).filter((q) => q.id !== id));
  }

  function updateQuestionType(id: string, newType: string) {
    const updated = [...(questions || [])];
    const qi = updated.findIndex((q: any) => q.id === id);
    if (qi === -1) return;
    const item = { ...(updated[qi] || {}) } as any;
    item.type = newType;
    // initialize type-specific fields when switching
    if (newType === "dropdown") {
      if (!Array.isArray(item.options)) item.options = [];
      delete item.rangeMin;
      delete item.rangeMax;
      delete item.minChecked;
      delete item.maxChecked;
    } else if (newType === "checkboxes") {
      if (!Array.isArray(item.options)) item.options = [];
      if (typeof item.minChecked === "undefined") item.minChecked = 0;
      if (typeof item.maxChecked === "undefined") item.maxChecked = item.options.length || 0;
      delete item.rangeMin;
      delete item.rangeMax;
    } else if (newType === "range") {
      item.rangeMin = typeof item.rangeMin !== "undefined" ? item.rangeMin : "";
      item.rangeMax = typeof item.rangeMax !== "undefined" ? item.rangeMax : "";
      delete item.options;
      delete item.minChecked;
      delete item.maxChecked;
    } else if (newType === "short answer" || newType === "long answer") {
      // simple text types — clear extras
      delete item.options;
      delete item.rangeMin;
      delete item.rangeMax;
      delete item.minChecked;
      delete item.maxChecked;
    }
    updated[qi] = item;
    setQuestions(updated);
  }

  function moveQuestionUp(id: string) {
    const updated = [...(questions || [])];
    const idx = updated.findIndex((q: any) => q.id === id);
    if (idx <= 0) return;
    const [item] = updated.splice(idx, 1);
    updated.splice(idx - 1, 0, item);
    setQuestions(updated);
  }

  function moveQuestionDown(id: string) {
    const updated = [...(questions || [])];
    const idx = updated.findIndex((q: any) => q.id === id);
    if (idx === -1 || idx >= updated.length - 1) return;
    const [item] = updated.splice(idx, 1);
    updated.splice(idx + 1, 0, item);
    setQuestions(updated);
  }

  function onDragStart(e: any, id: string) {
    e.dataTransfer.setData("question", id);
    // mark this drag as a question drag so other components can ignore option drags
    try {
      e.dataTransfer.setData("dragType", "question");
    } catch (err) {
      // some browsers may restrict types, ignore silently
    }
    // also set a small global marker (robust across browsers) while dragging
    try {
      (window as any).__LP_DRAG = "question";
    } catch (err) {
      /* ignore */
    }
  }

  function onDragEnd(_: any) {
    try {
      (window as any).__LP_DRAG = null;
    } catch (err) {
      /* ignore */
    }
  }

  function onDrop(e: any, toIndex: number) {
    const id = e.dataTransfer.getData("question");
    if (!id) return;
    const fromIndex = (questions || []).findIndex((q: any) => q.id === id);
    if (fromIndex === -1) return;
    const updated = [...(questions || [])];
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    setQuestions(updated);
  }

  function addOptionToQuestion(questionId: string, value: string) {
    const updated = [...(questions || [])];
    const idx = updated.findIndex((q: any) => q.id === questionId);
    if (idx === -1) return;
    const opts = Array.isArray(updated[idx].options) ? updated[idx].options.slice() : [];
    opts.push(value);
    updated[idx].options = opts;
    setQuestions(updated);
  }

  function deleteOptionFromQuestion(questionId: string, optIndex: number) {
    const updated = [...(questions || [])];
    const idx = updated.findIndex((q: any) => q.id === questionId);
    if (idx === -1) return;
    const opts = Array.isArray(updated[idx].options) ? updated[idx].options.slice() : [];
    opts.splice(optIndex, 1);
    updated[idx].options = opts;
    setQuestions(updated);
  }

  // keep newOptionInputs declaration later in file (already present)

  function moveOption(questionId: string, from: number, to: number) {
    const updated = [...(questions || [])];
    const idx = updated.findIndex((q: any) => q.id === questionId);
    if (idx === -1) return;
    const opts = Array.isArray(updated[idx].options) ? updated[idx].options.slice() : [];
    if (from < 0 || from >= opts.length || to < 0 || to >= opts.length) return;
    const [item] = opts.splice(from, 1);
    opts.splice(to, 0, item);
    updated[idx].options = opts;
    setQuestions(updated);
  }

  // option drag handlers (drag handle on each option)
  function onOptionDragStart(e: any, questionId: string, optionIndex: number) {
    e.dataTransfer.setData("option", JSON.stringify({ questionId, index: optionIndex }));
    // mark this drag as an option drag so parent/question components can ignore it
    try {
      e.dataTransfer.setData("dragType", "option");
    } catch (err) {
      // ignore
    }
    try {
      (window as any).__LP_DRAG = "option";
    } catch (err) {
      /* ignore */
    }
  }

  function onOptionDragEnd(_: any) {
    try {
      (window as any).__LP_DRAG = null;
    } catch (err) {
      /* ignore */
    }
  }

  function onOptionDrop(e: any, questionId: string, toIndex: number) {
    e.preventDefault();
    const payload = e.dataTransfer.getData("option");
    if (!payload) return;
    try {
      const parsed = JSON.parse(payload);
      if (parsed.questionId !== questionId) return; // only allow reorder within same question
      const from = Number(parsed.index);
      if (isNaN(from)) return;
      // reuse moveOption logic
      moveOption(questionId, from, toIndex);
    } catch (err) {
      console.warn("option drop parse error", err);
    }
  }

  // refs for option inputs so we can focus newly-added option inputs
  const optionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const modalOptionRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function focusOptionInput(questionId: string, index: number) {
    setTimeout(() => {
      const el = optionInputRefs.current[`${questionId}_${index}`];
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  }

  function focusModalOption(index: number) {
    setTimeout(() => {
      const el = modalOptionRefs.current[index];
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  }

  return (
    <div className="layered-card-outer">
      <div className="layered-card-middle">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                paddingLeft: 12,
                fontSize: 16,
                color: "#181D27",
                fontWeight: 700,
              }}
            >
              2. Pre-Screening Questions{" "}
              <span style={{ fontWeight: "400", color: "#717680" }}>(optional)</span>
            </span>
            <div
              style={{
                borderRadius: "50%",
                width: 26,
                height: 22,
                border: "1px solid #D5D9EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                backgroundColor: "#F8F9FC",
                color: "#181D27",
                fontWeight: 700,
              }}
            >
              {(questions || []).length}
            </div>
          </div>
          <button
            className="button-primary"
            onClick={openAddModal}
            style={{
              background: "black",
              color: "#fff",
              borderRadius: "60px",
              padding: "8px 16px",
            }}
          >
            <i className="la la-plus"></i> Add custom
          </button>
        </div>

        {/* Content */}
        <div className="layered-card-content">
          {error && (
            <div style={{ color: "#ef4444", marginTop: 8, fontSize: 13 }} data-field="prescreening">
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(questions || []).map((q: any, idx: number) => (
              <div
                key={q.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  // If this is an option drag, don't show the question-level indicator
                  const globalDrag = (window as any).__LP_DRAG;
                  if (globalDrag === "option") return;
                  const dragType = e.dataTransfer.getData("dragType");
                  const hasOptionPayload = !!e.dataTransfer.getData("option");
                  if (dragType === "option" || hasOptionPayload) return;

                  const target = e.currentTarget as HTMLElement;
                  const bounding = target.getBoundingClientRect();
                  const offset = bounding.y + bounding.height / 2;

                  // show a thin gradient line at top or bottom using background-image (avoids border-image bleed)
                  const gradient =
                    "linear-gradient(90deg, #9fcaed 0%, #ceb6da 33%, #ebacc9 66%, #fccec0 100%)";
                  target.style.backgroundRepeat = "no-repeat";
                  target.style.backgroundImage = gradient;
                  target.style.backgroundSize = "100% 3px";
                  if (e.clientY - offset > 0) {
                    target.style.backgroundPosition = "bottom";
                  } else {
                    target.style.backgroundPosition = "top";
                  }
                  // ensure native borders don't interfere
                  target.style.borderTop = "none";
                  target.style.borderBottom = "none";
                }}
                onDragLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  // clear gradient indicator
                  target.style.backgroundImage = "";
                  target.style.backgroundSize = "";
                  target.style.backgroundPosition = "";
                  target.style.borderTop = "none";
                  target.style.borderBottom = "none";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  // If this is an option drag, ignore at the question level
                  const globalDrag = (window as any).__LP_DRAG;
                  if (globalDrag === "option") return;
                  const dragType = e.dataTransfer.getData("dragType");
                  const hasOptionPayload = !!e.dataTransfer.getData("option");
                  if (dragType === "option" || hasOptionPayload) return;

                  const target = e.currentTarget as HTMLElement;
                  // clear any gradient indicator
                  target.style.backgroundImage = "";
                  target.style.backgroundSize = "";
                  target.style.backgroundPosition = "";
                  target.style.borderTop = "none";
                  target.style.borderBottom = "none";

                  const bounding = target.getBoundingClientRect();
                  const offset = bounding.y + bounding.height / 2;
                  const insertIndex = e.clientY - offset > 0 ? idx + 1 : idx;

                  onDrop(e, insertIndex);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* Question drag handle */}
                <i
                  className="la la-grip-vertical"
                  title="Drag to reorder question"
                  draggable
                  onDragStart={(e) => onDragStart(e, q.id)}
                  onDragEnd={(e) => onDragEnd(e)}
                  style={{ fontSize: 18, color: "#A4A7AE", cursor: "grab", padding: 6 }}
                />
                {/*  Question content */}
                <div
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    background: "#fff",
                    border: "1px solid #E6E7EA",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      background: "#F8F9FC",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    {/* Question text */}
                    <div style={{ flex: 1, fontWeight: 700 }}>{displayText(q)}</div>
                    {/* Question type dropdown */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <CustomDropdown
                        onSelectSetting={(typeName: string) => updateQuestionType(q.id, typeName)}
                        screeningSetting={q.type}
                        settingList={questionTypeList}
                        placeholder="Select type"
                        fitContent={true}
                        invalid={false}
                      />
                    </div>
                  </div>

                  {/* Options for dropdown/checkboxes */}
                  <div style={{ flex: 1, color: "#6b7280", marginTop: 8, padding: "12px 16px" }}>
                    {(q.type === "dropdown" || q.type === "checkboxes") && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {Array.isArray(q.options) && q.options.length > 0 ? (
                            q.options.map((opt: string, oi: number) => (
                              <div
                                key={oi}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  const target = e.currentTarget as HTMLElement;
                                  const bounding = target.getBoundingClientRect();
                                  const offset = bounding.y + bounding.height / 2;

                                  // show a thin gradient indicator for option drop using background-image
                                  const optGradient =
                                    "linear-gradient(90deg, #9fcaed 0%, #ceb6da 33%, #ebacc9 66%, #fccec0 100%)";
                                  target.style.backgroundRepeat = "no-repeat";
                                  target.style.backgroundImage = optGradient;
                                  target.style.backgroundSize = "100% 2px";
                                  if (e.clientY - offset > 0) {
                                    target.style.backgroundPosition = "bottom";
                                  } else {
                                    target.style.backgroundPosition = "top";
                                  }
                                  target.style.borderTop = "none";
                                  target.style.borderBottom = "none";
                                }}
                                onDragLeave={(e) => {
                                  const t = e.currentTarget as HTMLElement;
                                  t.style.backgroundImage = "";
                                  t.style.backgroundSize = "";
                                  t.style.backgroundPosition = "";
                                  t.style.borderTop = "none";
                                  t.style.borderBottom = "none";
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const target = e.currentTarget as HTMLElement;
                                  // clear gradient indicator
                                  target.style.backgroundImage = "";
                                  target.style.backgroundSize = "";
                                  target.style.backgroundPosition = "";
                                  target.style.borderTop = "none";
                                  target.style.borderBottom = "none";

                                  const bounding = target.getBoundingClientRect();
                                  const offset = bounding.y + bounding.height / 2;
                                  const insertIndex = e.clientY - offset > 0 ? oi + 1 : oi;

                                  onOptionDrop(e, q.id, insertIndex);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 24,
                                  width: "100%",
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    borderRadius: 6,
                                    border: "1px solid #E9EAEB",
                                  }}
                                >
                                  <div
                                    draggable
                                    onDragStart={(e) => onOptionDragStart(e, q.id, oi)}
                                    onDragEnd={(e) => onOptionDragEnd(e)}
                                    style={{
                                      width: 36,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 500,
                                      color: "#181D27",
                                      borderRight: "1px solid #E9EAEB",
                                    }}
                                  >
                                    {oi + 1}
                                  </div>
                                  <input
                                    ref={(el) => {
                                      optionInputRefs.current[`${q.id}_${oi}`] = el;
                                    }}
                                    value={opt}
                                    onChange={(e) => {
                                      const updated = [...(questions || [])];
                                      const qi = updated.findIndex((it: any) => it.id === q.id);
                                      if (qi !== -1) {
                                        const opts = Array.isArray(updated[qi].options)
                                          ? updated[qi].options.slice()
                                          : [];
                                        opts[oi] = e.target.value;
                                        updated[qi].options = opts;
                                        setQuestions(updated);
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: 8,
                                      borderRadius: 6,
                                      border: "none",
                                      fontWeight: 500,
                                    }}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    title="Delete option"
                                    onClick={() => deleteOptionFromQuestion(q.id, oi)}
                                    style={{
                                      width: 32,
                                      height: 32,
                                      color: "#535862",
                                      background: "transparent",
                                      cursor: "pointer",
                                      border: "1px solid #9CA3AF",
                                      borderRadius: "50%",
                                    }}
                                  >
                                    <i className="las la-times"></i>
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ color: "#9CA3AF" }}>No options yet</div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 6,
                          }}
                        >
                          <button
                            onClick={() => {
                              const len = Array.isArray(q.options) ? q.options.length : 0;
                              addOptionToQuestion(q.id, "");
                              focusOptionInput(q.id, len);
                            }}
                            style={{
                              padding: "8px 12px",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: "#535862",
                              fontWeight: 500,
                            }}
                          >
                            <i className="la la-plus" style={{ marginRight: 8 }} />
                            Add Option
                          </button>
                        </div>
                      </div>
                    )}
                    {q.type === "checkboxes" && (
                      <div style={{ marginTop: 8, color: "#374151", marginBottom: 8 }}>
                        {/* Divider */}
                        <div
                          style={{
                            width: "100%",
                            height: 1,
                            background: "#E6E7EA",
                            marginBottom: 16,
                          }}
                        ></div>

                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: 12, color: "#6b7280" }}>Min checked</label>
                            <div style={{ position: "relative" }}>
                              <input
                                type="number"
                                className={`form-control`}
                                value={typeof q.minChecked !== "undefined" ? q.minChecked : ""}
                                onChange={(e) => {
                                  const v =
                                    e.target.value === "" ? undefined : Number(e.target.value);
                                  const updated = [...(questions || [])];
                                  const qi = updated.findIndex((it: any) => it.id === q.id);
                                  if (qi !== -1) {
                                    updated[qi].minChecked = v;
                                    setQuestions(updated);
                                  }
                                }}
                                style={{ paddingLeft: "12px", width: 120 }}
                              />
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: 12, color: "#6b7280" }}>Max checked</label>
                            <div style={{ position: "relative" }}>
                              <input
                                type="number"
                                className={`form-control`}
                                value={typeof q.maxChecked !== "undefined" ? q.maxChecked : ""}
                                onChange={(e) => {
                                  const v =
                                    e.target.value === "" ? undefined : Number(e.target.value);
                                  const updated = [...(questions || [])];
                                  const qi = updated.findIndex((it: any) => it.id === q.id);
                                  if (qi !== -1) {
                                    updated[qi].maxChecked = v;
                                    setQuestions(updated);
                                  }
                                }}
                                style={{ paddingLeft: "12px", width: 120 }}
                              />
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 8, color: "#6b7280" }}>
                          <small>
                            Leave blank for no constraint. Max will default to number of options
                            when empty.
                          </small>
                        </div>
                      </div>
                    )}
                    {q.type === "range" && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <label>Min</label>

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
                              className={`form-control`}
                              value={q.rangeMin ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                const updated = [...(questions || [])];
                                const qi = updated.findIndex((it: any) => it.id === q.id);
                                if (qi !== -1)
                                  updated[qi].rangeMin = val === "" ? undefined : Number(val);
                                setQuestions(updated);
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
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <label>Max</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type="number"
                              className={`form-control`}
                              value={q.rangeMax ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                const updated = [...(questions || [])];
                                const qi = updated.findIndex((it: any) => it.id === q.id);
                                if (qi !== -1)
                                  updated[qi].rangeMax = val === "" ? undefined : Number(val);
                                setQuestions(updated);
                              }}
                              style={{ width: "100%", paddingLeft: "12px" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  {q.type !== "short answer" && q.type !== "long answer" && (
                    <div
                      style={{ width: "95%", height: 1, background: "#E6E7EA", margin: "auto" }}
                    ></div>
                  )}

                  {/* Edit/Delete Buttons */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      padding: 16,
                    }}
                  >
                    <button
                      style={{
                        width: "max-content",
                        background: "#fff",
                        border: "1px solid #FDA29B",
                        borderRadius: 60,
                        padding: "6px 12px",
                        cursor: "pointer",
                        color: "#B32318",
                        fontWeight: 500,
                      }}
                      onClick={() => deleteQuestion(q.id)}
                    >
                      <i className="la la-trash" style={{ marginRight: 6 }} />
                      Delete Question
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.4)",
                zIndex: 2000,
              }}
            >
              <div
                style={{
                  width: 760,
                  maxWidth: "95%",
                  background: "#fff",
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: "0 10px 30px rgba(16,24,40,0.2)",
                  maxHeight: "80vh",
                  overflow: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{editingId ? "Edit" : "Add"} Question</h3>
                  <button
                    aria-label="Close"
                    onClick={closeModal}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 20,
                      cursor: "pointer",
                    }}
                  >
                    X
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                  <label id="prescreening-modal-title">Question</label>
                  <textarea
                    ref={textareaRef}
                    aria-labelledby="prescreening-modal-title"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    style={{ width: "100%", padding: 8 }}
                  />

                  <label>Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="dropdown">Dropdown</option>
                    <option value="range">Range</option>
                    <option value="short answer">Short answer</option>
                    <option value="long answer">Long answer</option>
                    <option value="long answer">Long answer</option>
                    <option value="checkboxes">Checkboxes</option>
                  </select>

                  {(type === "dropdown" || type === "checkboxes") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {options.map((opt, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <input
                              ref={(el) => {
                                modalOptionRefs.current[i] = el;
                              }}
                              value={opt}
                              onChange={(e) =>
                                setOptions((prev) => {
                                  const copy = prev.slice();
                                  copy[i] = e.target.value;
                                  return copy;
                                })
                              }
                              style={{
                                flex: 1,
                                padding: 8,
                                borderRadius: 6,
                                border: "1px solid #E9EAEB",
                              }}
                            />
                            <button
                              onClick={() => setOptions((s) => s.filter((_, idx) => idx !== i))}
                              style={{
                                color: "#B42318",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                        <button
                          onClick={() => {
                            setOptions((s) => {
                              const newArr = [...s, ""];
                              setTimeout(() => focusModalOption(newArr.length - 1), 60);
                              return newArr;
                            });
                          }}
                          style={{ padding: "8px 12px", borderRadius: 60 }}
                        >
                          Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  {type === "checkboxes" && (
                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label>Min checked</label>
                        <input
                          type="number"
                          value={minChecked}
                          onChange={(e) =>
                            setMinChecked(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          style={{ width: 120 }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label>Max checked</label>
                        <input
                          type="number"
                          value={maxChecked}
                          onChange={(e) =>
                            setMaxChecked(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          style={{ width: 120 }}
                        />
                      </div>
                    </div>
                  )}

                  {type === "range" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label>Min</label>
                        <input
                          type="number"
                          value={rangeMin}
                          onChange={(e) =>
                            setRangeMin(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <label>Max</label>
                        <input
                          type="number"
                          value={rangeMax}
                          onChange={(e) =>
                            setRangeMax(e.target.value === "" ? "" : Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {modalError && (
                    <div style={{ color: "#ef4444", marginTop: 6, fontSize: 13 }}>{modalError}</div>
                  )}

                  <div
                    style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}
                  >
                    <button onClick={closeModal} style={{ padding: "8px 12px", borderRadius: 60 }}>
                      Cancel
                    </button>
                    <button
                      className="button-primary"
                      onClick={addOrUpdateQuestion}
                      style={{ padding: "8px 12px", borderRadius: 60 }}
                    >
                      {editingId ? "Save" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
