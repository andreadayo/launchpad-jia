"use client";
import axios from "axios";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import InterviewQuestionGeneratorV2 from "./InterviewQuestionGeneratorV2";
import { useAppContext } from "../../context/AppContext";
import DirectInterviewLinkV2 from "./DirectInterviewLinkV2";
import CareerForm from "./CareerForm";
import CareerLink from "./CareerLink";
import Step4ReviewList from "./steps/Step4ReviewList";

export default function JobDescription({
  formData,
  setFormData,
  editModal,
  isEditing,
  setIsEditing,
  handleCancelEdit,
}: {
  formData: any;
  setFormData: (formData: any) => void;
  editModal: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  handleCancelEdit: () => void;
}) {
  const { user } = useAppContext();
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (editModal) {
      setShowEditModal(true);
    }
  }, [editModal]);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  async function updateCareer() {
    const userInfoSlice = {
      image: user.image,
      name: user.name,
      email: user.email,
    };
    const input = {
      _id: formData._id,
      jobTitle: formData.jobTitle,
      updatedAt: Date.now(),
      questions: formData.questions,
      status: formData.status,
      cvScreeningSetting: formData.cvScreeningSetting,
      aiScreeningSetting: formData.aiScreeningSetting,
      requireVideo: formData.requireVideo,
      description: formData.description,
      lastEditedBy: userInfoSlice,
      createdBy: userInfoSlice,
    };

    Swal.fire({
      title: "Updating career...",
      text: "Please wait while we update the career...",
      allowOutsideClick: false,
    });

    try {
      const response = await axios.post("/api/update-career", input);

      if (response.status === 200) {
        Swal.fire({
          title: "Success",
          text: "Career updated successfully",
          icon: "success",
          allowOutsideClick: false,
        }).then(() => {
          setIsEditing(false);
          window.location.reload();
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Failed to update career",
        icon: "error",
        allowOutsideClick: false,
      });
    }
  }

  async function deleteCareer() {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleting career...",
          text: "Please wait while we delete the career...",
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          const response = await axios.post("/api/delete-career", {
            id: formData._id,
          });

          if (response.data.success) {
            Swal.fire({
              title: "Deleted!",
              text: "The career has been deleted.",
              icon: "success",
              allowOutsideClick: false,
            }).then(() => {
              window.location.href = "/recruiter-dashboard/careers";
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: response.data.error || "Failed to delete the career",
              icon: "error",
            });
          }
        } catch (error) {
          console.error("Error deleting career:", error);
          Swal.fire({
            title: "Error!",
            text: "An error occurred while deleting the career",
            icon: "error",
          });
        }
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16 }}>
      <button
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#fff",
          border: "1px solid #D5D7DA",
          padding: "8px 16px",
          borderRadius: "60px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        onClick={handleEdit}
      >
        <i className="la la-edit" style={{ marginRight: 8 }}></i>
        Edit details
      </button>
      <div className="thread-set">
        <div className="left-thread">
          <Step4ReviewList formData={formData} isEditing={isEditing} setFormData={setFormData} />
        </div>

        <div className="right-thread">
          <div className="layered-card-outer">
            <div className="layered-card-middle">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "100%",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    background: "#181D27",
                    borderRadius: "60px",
                  }}
                >
                  <i className="la la-ellipsis-h" style={{ fontSize: 20, color: "#FFFFFF" }} />
                </div>
                <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                  Additional Details
                </span>
              </div>

              <div className="layered-card-content">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <strong>Created By:</strong>
                  {formData.createdBy && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <img
                        src={formData.createdBy.image}
                        alt="created by"
                        style={{ width: 32, height: 32, borderRadius: "50%" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#181D27" }}>
                          {formData.createdBy.name}
                        </span>
                        <span style={{ fontSize: 12, color: "#717680" }}>
                          {" "}
                          on{" "}
                          {formData.createdAt
                            ? new Date(formData.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <strong>Last Updated By:</strong>
                  {formData.lastEditedBy && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <img
                        src={formData.lastEditedBy.image}
                        alt="created by"
                        style={{ width: 32, height: 32, borderRadius: "50%" }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#181D27" }}>
                          {formData.lastEditedBy.name}
                        </span>
                        <span style={{ fontSize: 12, color: "#717680" }}>
                          {" "}
                          on{" "}
                          {formData.updatedAt
                            ? new Date(formData.updatedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <CareerLink career={formData} />
          {/* Card for direct interview link */}
          <DirectInterviewLinkV2 formData={formData} setFormData={setFormData} />
          {isEditing && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
                alignItems: "center",
                marginBottom: "16px",
                width: "100%",
              }}
            >
              <button
                className="button-primary"
                style={{ width: "50%" }}
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button className="button-primary" style={{ width: "50%" }} onClick={updateCareer}>
                Save Changes
              </button>
            </div>
          )}
          <div className="layered-card-outer">
            <div className="layered-card-middle">
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "100%",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    background: "#181D27",
                    borderRadius: "60px",
                  }}
                >
                  <i className="la la-cog" style={{ fontSize: 20, color: "#FFFFFF" }} />
                </div>
                <span style={{ fontSize: 16, color: "#181D27", fontWeight: 700 }}>
                  Advanced Settings
                </span>
              </div>

              <div className="layered-card-content">
                <button
                  onClick={() => {
                    deleteCareer();
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: "#FFFFFF",
                    color: "#B32318",
                    borderRadius: "60px",
                    padding: "5px 10px",
                    border: "1px solid #B32318",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  <i className="la la-trash" style={{ color: "#B32318", fontSize: 16 }}></i>
                  <span>Delete this career</span>
                </button>
                <span style={{ fontSize: "14px", color: "#717680", textAlign: "center" }}>
                  Be careful, this action cannot be undone.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showEditModal && (
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
                overflowY: "scroll",
                height: "100vh",
                width: "90vw",
                background: "#fff",
                border: `1.5px solid #E9EAEB`,
                borderRadius: 14,
                boxShadow: "0 8px 32px rgba(30,32,60,0.18)",
                padding: "24px",
              }}
            >
              <CareerForm career={formData} formType="edit" setShowEditModal={setShowEditModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScreeningSettingButton(props) {
  const { onSelectSetting, screeningSetting } = props;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Setting List icons
  const settingList = [
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
  return (
    <div className="dropdown w-100">
      <button
        className="dropdown-btn fade-in-bottom"
        style={{ width: "100%" }}
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
      >
        <span>
          <i className={settingList.find((setting) => setting.name === screeningSetting)?.icon}></i>{" "}
          {screeningSetting}
        </span>
        <i className="la la-angle-down ml-10"></i>
      </button>
      <div
        className={`dropdown-menu w-100 mt-1 org-dropdown-anim${dropdownOpen ? " show" : ""}`}
        style={{
          padding: "10px",
        }}
      >
        {settingList.map((setting, index) => (
          <div style={{ borderBottom: "1px solid #ddd" }} key={index}>
            <button
              className={`dropdown-item d-flex align-items-center${
                screeningSetting === setting.name ? " bg-primary text-white active-org" : ""
              }`}
              style={{
                minWidth: 220,
                borderRadius: screeningSetting === setting.name ? 0 : 10,
                overflow: "hidden",
                paddingBottom: 10,
                paddingTop: 10,
              }}
              onClick={() => {
                onSelectSetting(setting.name);
                setDropdownOpen(false);
              }}
            >
              <i className={setting.icon}></i> {setting.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
