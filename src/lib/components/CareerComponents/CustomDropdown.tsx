"use client";
import { useState, useRef, useEffect } from "react";

export default function CustomDropdown(props) {
  const {
    onSelectSetting,
    screeningSetting,
    settingList,
    placeholder,
    invalid = false,
    fitContent = false,
  } = props;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [minWidth, setMinWidth] = useState<number | null>(null);

  useEffect(() => {
    if (fitContent && measureRef.current) {
      // measure placeholder width and add padding so the button doesn't shrink below this
      const w = measureRef.current.offsetWidth;
      const extra = 24; // left+right padding + icon space
      setMinWidth(w + extra);
    }
  }, [fitContent, placeholder]);

  return (
    <div
      className={`dropdown ${fitContent ? "" : "w-100"}`}
      style={{ position: "relative", display: fitContent ? "inline-block" : undefined }}
    >
      {fitContent && (
        <span
          ref={measureRef}
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            top: 0,
            left: 0,
            fontSize: "1rem",
          }}
        >
          {placeholder}
        </span>
      )}
      <button
        disabled={settingList.length === 0}
        className="dropdown-btn fade-in-bottom"
        style={{
          width: fitContent ? "fit-content" : "100%",
          minWidth: fitContent && minWidth ? `${minWidth}px` : undefined,
          textTransform: "capitalize",
          border: invalid ? "1px solid #ef4444" : undefined,
          paddingLeft: fitContent ? 12 : undefined,
          paddingRight: fitContent ? 12 : undefined,
        }}
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
      >
        <span style={{ color: screeningSetting ? undefined : "#717680" }}>
          <i className={settingList.find((setting) => setting.name === screeningSetting)?.icon}></i>{" "}
          {screeningSetting ? screeningSetting.replace("_", " ") : placeholder}
        </span>
        <i className="la la-angle-down ml-10"></i>
      </button>
      <div
        className={`dropdown-menu ${fitContent ? "" : "w-100"} mt-1 org-dropdown-anim${dropdownOpen ? " show" : ""}`}
        style={{
          padding: "10px",
          maxHeight: 200,
          overflowY: "auto",
          minWidth: fitContent && minWidth ? `${minWidth}px` : undefined,
        }}
      >
        {settingList.map((setting, index) => (
          <div style={{ borderBottom: "1px solid #ddd" }} key={index}>
            <button
              className="dropdown-item d-flex align-items-center"
              style={{
                minWidth: 220,
                borderRadius: screeningSetting === setting.name ? 0 : 10,
                overflow: "hidden",
                paddingBottom: 10,
                paddingTop: 10,
                color: "#181D27",
                fontWeight: screeningSetting === setting.name ? 700 : 500,
                background: screeningSetting === setting.name ? "#F8F9FC" : "transparent",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                whiteSpace: "wrap",
                textTransform: "capitalize",
              }}
              onClick={() => {
                onSelectSetting(setting.name);
                setDropdownOpen(false);
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "5px" }}
              >
                {setting.icon && <i className={setting.icon}></i>} {setting.name?.replace("_", " ")}
              </div>
              {setting.name === screeningSetting && (
                <i
                  className="la la-check"
                  style={{
                    fontSize: "20px",
                    background:
                      "linear-gradient(180deg, #9FCAED 0%, #CEB6DA 33%, #EBACC9 66%, #FCCEC0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                ></i>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
