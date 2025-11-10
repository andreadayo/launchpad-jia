import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";

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
  const [type, setType] = useState<"dropdown" | "range">("dropdown");
  const [options, setOptions] = useState<string[]>([]);
  const [rangeMin, setRangeMin] = useState<number | "">("");
  const [rangeMax, setRangeMax] = useState<number | "">("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    setShowModal(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function closeModal() {
    setShowModal(false);
  }

  function addOrUpdateQuestion() {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    if (type === "dropdown" && (!options || options.length === 0)) return;

    if (editingId) {
      const updated = [...(questions || [])];
      const qi = updated.findIndex((it: any) => it.id === editingId);
      if (qi !== -1) {
        updated[qi] = {
          ...updated[qi],
          text: trimmed,
          type,
          options: type === "dropdown" ? options : undefined,
          rangeMin: type === "range" ? rangeMin : undefined,
          rangeMax: type === "range" ? rangeMax : undefined,
        };
        setQuestions(updated);
      }
    } else {
      const q = {
        id: `q_${Date.now()}`,
        text: trimmed,
        type,
        options: type === "dropdown" ? options.slice() : [],
        rangeMin: type === "range" ? rangeMin : undefined,
        rangeMax: type === "range" ? rangeMax : undefined,
      };
      setQuestions([...(questions || []), q]);
    }

    closeModal();
  }

  function deleteQuestion(id: string) {
    setQuestions((s: any[]) => (s || []).filter((q) => q.id !== id));
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

  // inline inputs for adding options per question
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});

  return (
    <div className="layered-card-outer">
      <div className="layered-card-middle">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Pre-screening Questions</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                borderRadius: "50%",
                width: 30,
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
            <button
              className="button-primary"
              onClick={openAddModal}
              style={{ borderRadius: 60, padding: "8px 16px" }}
            >
              <i className="la la-plus-circle"></i> Add Question
            </button>
          </div>
        </div>

        <div className="layered-card-content" style={{ marginTop: 12 }}>
          {error && (
            <div style={{ color: "#ef4444", marginTop: 8, fontSize: 13 }} data-field="prescreening">
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                  padding: 12,
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #E6E7EA",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <i
                    className="la la-grip-vertical"
                    title="Drag to reorder question"
                    draggable
                    onDragStart={(e) => onDragStart(e, q.id)}
                    onDragEnd={(e) => onDragEnd(e)}
                    style={{ fontSize: 18, color: "#A4A7AE", cursor: "grab", padding: 6 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{displayText(q)}</div>
                    <div style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
                      {q.type === "dropdown" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontWeight: 600 }}>Options</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: 8,
                                    background: "#F8F9FC",
                                    borderRadius: 6,
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <i
                                      className="la la-grip-vertical"
                                      title="Drag to reorder option"
                                      draggable
                                      onDragStart={(e) => onOptionDragStart(e, q.id, oi)}
                                      onDragEnd={(e) => onOptionDragEnd(e)}
                                      style={{ fontSize: 16, color: "#A4A7AE", cursor: "grab" }}
                                    />
                                    <div style={{ fontWeight: 600 }}>{oi + 1}.</div>
                                    <div style={{ flex: 1 }}>{opt}</div>
                                  </div>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button
                                      title="Delete option"
                                      onClick={() => deleteOptionFromQuestion(q.id, oi)}
                                      style={{
                                        color: "#B42318",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <i className="la la-trash" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{ color: "#9CA3AF" }}>No options yet</div>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <input
                              aria-label={`Add option for question ${idx + 1}`}
                              placeholder="Add option"
                              value={newOptionInputs[q.id] || ""}
                              onChange={(e) =>
                                setNewOptionInputs((s) => ({ ...s, [q.id]: e.target.value }))
                              }
                              style={{ flex: 1, padding: 8 }}
                            />
                            <button
                              onClick={() => {
                                const val = (newOptionInputs[q.id] || "").trim();
                                if (!val) return;
                                addOptionToQuestion(q.id, val);
                                setNewOptionInputs((s) => ({ ...s, [q.id]: "" }));
                              }}
                              style={{ padding: "8px 12px", borderRadius: 60 }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                      {q.type === "range" && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: 12, color: "#6b7280" }}>Min</label>
                            <input
                              type="number"
                              value={q.rangeMin ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                const updated = [...(questions || [])];
                                const qi = updated.findIndex((it: any) => it.id === q.id);
                                if (qi !== -1)
                                  updated[qi].rangeMin = val === "" ? undefined : Number(val);
                                setQuestions(updated);
                              }}
                              style={{ padding: 6, width: 100 }}
                            />
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <label style={{ fontSize: 12, color: "#6b7280" }}>Max</label>
                            <input
                              type="number"
                              value={q.rangeMax ?? ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                const updated = [...(questions || [])];
                                const qi = updated.findIndex((it: any) => it.id === q.id);
                                if (qi !== -1)
                                  updated[qi].rangeMax = val === "" ? undefined : Number(val);
                                setQuestions(updated);
                              }}
                              style={{ padding: 6, width: 100 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    style={{
                      background: "#fff",
                      border: "1px solid #E9EAEB",
                      borderRadius: 60,
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                    onClick={() => openEditModal(q)}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      background: "#fff",
                      border: "1px solid #E9EAEB",
                      borderRadius: 60,
                      padding: "6px 12px",
                      cursor: "pointer",
                    }}
                    onClick={() => deleteQuestion(q.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                ×
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
              </select>

              {type === "dropdown" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder="New option"
                      id="newOption"
                      style={{ flex: 1, padding: 8 }}
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById("newOption") as HTMLInputElement | null;
                        const value = el?.value?.trim();
                        if (!value) return;
                        setOptions((s) => [...s, value]);
                        if (el) el.value = "";
                      }}
                      style={{ padding: "8px 12px", borderRadius: 60 }}
                    >
                      Add Option
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {options.map((opt, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                        <div>{opt}</div>
                        <button
                          onClick={() => setOptions((s) => s.filter((_, idx) => idx !== i))}
                          style={{ color: "#B42318" }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
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
  );
}
