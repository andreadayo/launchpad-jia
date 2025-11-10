"use client";

import { useEffect, useRef, useState } from "react";

export default function CollapsibleLayeredCard({
  title,
  defaultExpanded = true,
  children,
  showEdit = false,
  onEdit,
}: {
  title: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  showEdit?: boolean;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState<boolean>(defaultExpanded);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      // expand to content height for smooth animation
      el.style.maxHeight = el.scrollHeight + "px";
      el.style.opacity = "1";
    } else {
      // collapse
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
    }
  }, [open]);

  return (
    <div className="layered-card-outer">
      <div className="layered-card-middle" style={{ gap: open ? "16px" : "0px" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
          <span
            style={{
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: 16,
              color: "#181D27",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{title}</span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {showEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit();
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #E5E7EB",
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    color: "#374151",
                    fontSize: 14,
                  }}
                  aria-label="Edit"
                >
                  Edit
                </button>
              )}
              <button
                aria-expanded={open}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((s) => !s);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 220ms ease",
                }}
                aria-label={open ? "Collapse" : "Expand"}
              >
                <i className="la la-angle-down"></i>
              </button>
            </span>
          </span>
        </div>
        <div
          ref={contentRef}
          className={`layered-card-content collapsible-content`}
          style={{
            padding: open ? "20px" : "0px",
            overflow: "hidden",
            maxHeight: open ? undefined : "0px",
            transition: "max-height 280ms ease, opacity 180ms ease, padding 180ms ease",
            opacity: open ? 1 : 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
