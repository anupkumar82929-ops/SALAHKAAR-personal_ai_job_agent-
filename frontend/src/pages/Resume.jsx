import { useEffect, useRef, useState } from "react"
import apiClient from "../api/client"

function Resume() {
  const fileInputRef = useRef(null)

  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [selectedResume, setSelectedResume] = useState(null)

  // --------------------------------------------------
  // Load resumes
  // --------------------------------------------------

  const loadResumes = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await apiClient.get("/api/resume")

      const resumeList = response.data?.resumes || []

      setResumes(resumeList)

      const primaryResume =
        resumeList.find((resume) => resume.is_primary) ||
        resumeList[0] ||
        null

      setSelectedResume(primaryResume)
    } catch (err) {
      console.error("Unable to load resumes:", err)

      setError(
        err.response?.data?.detail ||
          "Unable to load your resumes."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [])

  // --------------------------------------------------
  // Upload resume
  // --------------------------------------------------

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError("")
    setMessage("")
    setProcessingStep("")

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume.")
      event.target.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be smaller than 5 MB.")
      event.target.value = ""
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()

      formData.append("file", file)

      const response = await apiClient.post(
        "/api/resume/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      const uploadedResume = response.data?.resume

      setMessage("Resume uploaded successfully.")

      await loadResumes()

      if (uploadedResume) {
        setSelectedResume(uploadedResume)

        await processResume(uploadedResume.id)
      }
    } catch (err) {
      console.error("Resume upload failed:", err)

      setError(
        err.response?.data?.detail ||
          "Unable to upload resume."
      )
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  // --------------------------------------------------
  // Process uploaded resume
  // --------------------------------------------------

  const processResume = async (resumeId) => {
    try {
      setProcessing(true)
      setError("")
      setMessage("")

      // Step 1
      setProcessingStep("Reading your resume")

      await apiClient.post(
        `/api/resume/${resumeId}/extract`
      )

      // Step 2
      setProcessingStep("Analyzing your resume")

      await apiClient.post(
        `/api/resume/${resumeId}/parse`
      )

      // Step 3
      setProcessingStep("Syncing your skills")

      try {
        await apiClient.post(
          `/api/resume/${resumeId}/skills/sync`
        )
      } catch (err) {
        console.warn(
          "Skill synchronization skipped:",
          err
        )
      }

      // Step 4
      setProcessingStep("Syncing your experience")

      try {
        await apiClient.post(
          `/api/resume/${resumeId}/experience/sync`
        )
      } catch (err) {
        console.warn(
          "Experience synchronization skipped:",
          err
        )
      }

      // Step 5
      setProcessingStep("Syncing your education")

      try {
        await apiClient.post(
          `/api/resume/${resumeId}/education/sync`
        )
      } catch (err) {
        console.warn(
          "Education synchronization skipped:",
          err
        )
      }

      // Step 6
      setProcessingStep(
        "Updating your career profile"
      )

      try {
        await apiClient.post(
          `/api/resume/${resumeId}/profile/sync`
        )
      } catch (err) {
        console.warn(
          "Profile synchronization skipped:",
          err
        )
      }

      // Complete
      setProcessingStep("Resume ready")

      setMessage(
        "Your resume has been analyzed and your profile has been updated."
      )

      await loadResumes()
    } catch (err) {
      console.error(
        "Resume processing failed:",
        err
      )

      setError(
        err.response?.data?.detail ||
          "Resume processing failed."
      )

      setProcessingStep("")
    } finally {
      setProcessing(false)
    }
  }

  // --------------------------------------------------
  // Set primary resume
  // --------------------------------------------------

  const handleSetPrimary = async (resumeId) => {
    try {
      setError("")
      setMessage("")

      await apiClient.post(
        `/api/resume/${resumeId}/primary`
      )

      setMessage("Primary resume updated.")

      await loadResumes()
    } catch (err) {
      console.error(
        "Unable to set primary resume:",
        err
      )

      setError(
        err.response?.data?.detail ||
          "Unable to update primary resume."
      )
    }
  }

  // --------------------------------------------------
  // Format date
  // --------------------------------------------------

  const formatDate = (value) => {
    if (!value) {
      return "Recently uploaded"
    }

    try {
      return new Date(value).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )
    } catch {
      return "Recently uploaded"
    }
  }

  // --------------------------------------------------
  // Parsed resume information
  // --------------------------------------------------

  const parsedData =
    selectedResume?.parsed_data || {}

  const skills = Array.isArray(parsedData.skills)
    ? parsedData.skills
    : []

  const experience = Array.isArray(
    parsedData.experience
  )
    ? parsedData.experience
    : []

  const education = Array.isArray(
    parsedData.education
  )
    ? parsedData.education
    : []

  const certifications = Array.isArray(
    parsedData.certifications
  )
    ? parsedData.certifications
    : []

  // --------------------------------------------------
  // Resume completeness
  // --------------------------------------------------

  const completenessItems = [
    {
      label: "Resume uploaded",
      complete: Boolean(selectedResume),
    },
    {
      label: "Resume analyzed",
      complete: Boolean(
        selectedResume?.parsed_data
      ),
    },
    {
      label: "Skills detected",
      complete: skills.length > 0,
    },
    {
      label: "Experience detected",
      complete: experience.length > 0,
    },
    {
      label: "Education detected",
      complete: education.length > 0,
    },
  ]

  const completedCount =
    completenessItems.filter(
      (item) => item.complete
    ).length

  const resumeStrength = Math.round(
    (completedCount /
      completenessItems.length) *
      100
  )

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f7f7f5",
          padding: "48px",
          color: "#172033",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#777",
            }}
          >
            Resume workspace
          </p>

          <h1
            style={{
              fontSize: "42px",
              marginTop: "12px",
              fontWeight: 600,
              letterSpacing: "-0.04em",
            }}
          >
            Loading your resume...
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f5",
        color: "#172033",
        padding: "42px 32px 64px",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "30px",
            marginBottom: "42px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#777",
                marginBottom: "14px",
              }}
            >
              Career workspace
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "46px",
                lineHeight: 1.05,
                fontWeight: 600,
                letterSpacing: "-0.045em",
              }}
            >
              Your resume
            </h1>

            <p
              style={{
                marginTop: "14px",
                marginBottom: 0,
                maxWidth: "620px",
                fontSize: "16px",
                lineHeight: 1.7,
                color: "#69707d",
              }}
            >
              Keep your professional documents
              organized, current, and ready for
              your next opportunity.
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              style={{ display: "none" }}
            />

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                uploading || processing
              }
              style={{
                border: "none",
                background: "#172033",
                color: "#fff",
                padding: "14px 22px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor:
                  uploading || processing
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  uploading || processing
                    ? 0.6
                    : 1,
              }}
            >
              {uploading
                ? "Uploading..."
                : processing
                ? "Processing..."
                : "+ Upload resume"}
            </button>
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            style={{
              marginBottom: "24px",
              padding: "14px 16px",
              background: "#fff",
              border: "1px solid #e2b8b8",
              borderRadius: "8px",
              color: "#8b3a3a",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* ==================================================
            PROCESSING
        ================================================== */}

        {processing && (
          <div
            style={{
              marginBottom: "24px",
              background: "#172033",
              color: "#fff",
              borderRadius: "10px",
              padding: "22px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#fff",
                  flexShrink: 0,
                }}
              />

              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Processing your resume
                </div>

                <div
                  style={{
                    marginTop: "5px",
                    fontSize: "13px",
                    color:
                      "rgba(255,255,255,0.65)",
                  }}
                >
                  {processingStep}
                </div>
              </div>
            </div>

            <div
              style={{
                height: "4px",
                background:
                  "rgba(255,255,255,0.15)",
                borderRadius: "5px",
                overflow: "hidden",
                marginTop: "18px",
              }}
            >
              <div
                style={{
                  width: "65%",
                  height: "100%",
                  background: "#fff",
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        )}

        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}

        {message && !error && !processing && (
          <div
            style={{
              marginBottom: "24px",
              padding: "14px 16px",
              background: "#fff",
              border: "1px solid #c9d8cf",
              borderRadius: "8px",
              color: "#386047",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        {/* ==================================================
            NO RESUME
        ================================================== */}

        {resumes.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e4e4e0",
              borderRadius: "12px",
              padding: "70px 40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "72px",
                border: "1px solid #bfc2c5",
                borderRadius: "5px",
                margin: "0 auto 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#777",
                fontSize: "13px",
              }}
            >
              PDF
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "26px",
                letterSpacing: "-0.03em",
              }}
            >
              Start with your resume
            </h2>

            <p
              style={{
                maxWidth: "500px",
                margin: "12px auto 26px",
                color: "#737983",
                lineHeight: 1.7,
              }}
            >
              Upload your latest PDF resume and
              we'll organize your skills, experience,
              education, and professional profile.
            </p>

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              style={{
                border:
                  "1px solid #172033",
                background: "#172033",
                color: "#fff",
                padding: "13px 22px",
                borderRadius: "7px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Upload your resume
            </button>
          </div>
        ) : (
          <>
            {/* ==================================================
                PRIMARY RESUME + STRENGTH
            ================================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1fr) 320px",
                gap: "22px",
                marginBottom: "22px",
              }}
            >
              {/* Primary resume */}

              <div
                style={{
                  background: "#fff",
                  border:
                    "1px solid #e4e4e0",
                  borderRadius: "12px",
                  padding: "28px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "20px",
                    alignItems:
                      "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.13em",
                        fontWeight: 700,
                        color: "#777",
                        marginBottom:
                          "12px",
                      }}
                    >
                      Primary resume
                    </div>

                    <h2
                      style={{
                        margin: 0,
                        fontSize: "25px",
                        letterSpacing:
                          "-0.03em",
                      }}
                    >
                      {selectedResume?.file_name ||
                        "Resume"}
                    </h2>

                    <p
                      style={{
                        marginTop: "8px",
                        color: "#747982",
                        fontSize: "14px",
                      }}
                    >
                      Uploaded{" "}
                      {formatDate(
                        selectedResume?.created_at
                      )}
                    </p>
                  </div>

                  <div
                    style={{
                      padding:
                        "7px 10px",
                      borderRadius: "20px",
                      background:
                        "#edf4ef",
                      color: "#386047",
                      fontSize: "12px",
                      fontWeight: 700,
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {selectedResume?.is_primary
                      ? "Primary"
                      : "Resume"}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "30px",
                    paddingTop: "22px",
                    borderTop:
                      "1px solid #eeeeeb",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  {resumes.map(
                    (resume) => (
                      <button
                        key={resume.id}
                        onClick={() =>
                          setSelectedResume(
                            resume
                          )
                        }
                        style={{
                          padding:
                            "9px 13px",
                          borderRadius:
                            "6px",
                          border:
                            selectedResume?.id ===
                            resume.id
                              ? "1px solid #172033"
                              : "1px solid #dedfdb",
                          background:
                            selectedResume?.id ===
                            resume.id
                              ? "#172033"
                              : "#fff",
                          color:
                            selectedResume?.id ===
                            resume.id
                              ? "#fff"
                              : "#333b47",
                          cursor:
                            "pointer",
                          fontSize:
                            "13px",
                        }}
                      >
                        {resume.file_name}
                      </button>
                    )
                  )}
                </div>

                {!selectedResume?.is_primary && (
                  <button
                    onClick={() =>
                      handleSetPrimary(
                        selectedResume.id
                      )
                    }
                    style={{
                      marginTop: "20px",
                      border:
                        "1px solid #172033",
                      background: "#fff",
                      color: "#172033",
                      padding:
                        "10px 15px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Set as primary
                  </button>
                )}
              </div>

              {/* Resume strength */}

              <div
                style={{
                  background: "#172033",
                  color: "#fff",
                  borderRadius: "12px",
                  padding: "28px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.13em",
                    fontWeight: 700,
                    opacity: 0.6,
                  }}
                >
                  Resume strength
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "baseline",
                    gap: "5px",
                    marginTop: "20px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "48px",
                      fontWeight: 600,
                      letterSpacing:
                        "-0.05em",
                    }}
                  >
                    {resumeStrength}
                  </span>

                  <span
                    style={{
                      fontSize: "18px",
                      opacity: 0.55,
                    }}
                  >
                    %
                  </span>
                </div>

                <div
                  style={{
                    height: "5px",
                    background:
                      "rgba(255,255,255,0.18)",
                    borderRadius: "5px",
                    overflow:
                      "hidden",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      width: `${resumeStrength}%`,
                      height: "100%",
                      background: "#fff",
                    }}
                  />
                </div>

                <p
                  style={{
                    marginTop: "18px",
                    marginBottom: 0,
                    color:
                      "rgba(255,255,255,0.68)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Keep your resume
                  complete so the job
                  matching system can
                  understand your profile
                  better.
                </p>
              </div>
            </div>

            {/* ==================================================
                RESUME DETAILS
            ================================================== */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "22px",
              }}
            >
              {/* Skills */}

              <section
                style={{
                  background: "#fff",
                  border:
                    "1px solid #e4e4e0",
                  borderRadius: "12px",
                  padding: "28px",
                }}
              >
                <SectionHeader
                  number="01"
                  title="Skills"
                  count={skills.length}
                />

                {skills.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap:
                        "wrap",
                      gap: "8px",
                      marginTop: "24px",
                    }}
                  >
                    {skills.map(
                      (skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          style={{
                            border:
                              "1px solid #dedfdb",
                            background:
                              "#fafaf8",
                            padding:
                              "8px 11px",
                            borderRadius:
                              "5px",
                            fontSize:
                              "13px",
                            color:
                              "#343b46",
                          }}
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <EmptySection
                    text="No skills detected yet."
                  />
                )}
              </section>

              {/* Experience */}

              <section
                style={{
                  background: "#fff",
                  border:
                    "1px solid #e4e4e0",
                  borderRadius: "12px",
                  padding: "28px",
                }}
              >
                <SectionHeader
                  number="02"
                  title="Experience"
                  count={
                    experience.length
                  }
                />

                {experience.length >
                0 ? (
                  <div
                    style={{
                      marginTop: "22px",
                    }}
                  >
                    {experience
                      .slice(0, 4)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            style={{
                              padding:
                                index ===
                                0
                                  ? "0 0 18px"
                                  : "18px 0",
                              borderBottom:
                                index !==
                                Math.min(
                                  experience.length,
                                  4
                                ) -
                                  1
                                  ? "1px solid #eeeeeb"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  650,
                                fontSize:
                                  "15px",
                              }}
                            >
                              {item.job_title ||
                                "Role"}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "5px",
                                fontSize:
                                  "13px",
                                color:
                                  "#69707d",
                              }}
                            >
                              {item.company ||
                                "Company"}
                            </div>

                            {item.location && (
                              <div
                                style={{
                                  marginTop:
                                    "5px",
                                  fontSize:
                                    "12px",
                                  color:
                                    "#8a8f97",
                                }}
                              >
                                {
                                  item.location
                                }
                              </div>
                            )}
                          </div>
                        )
                      )}
                  </div>
                ) : (
                  <EmptySection
                    text="No experience detected yet."
                  />
                )}
              </section>

              {/* Education */}

              <section
                style={{
                  background: "#fff",
                  border:
                    "1px solid #e4e4e0",
                  borderRadius: "12px",
                  padding: "28px",
                }}
              >
                <SectionHeader
                  number="03"
                  title="Education"
                  count={
                    education.length
                  }
                />

                {education.length >
                0 ? (
                  <div
                    style={{
                      marginTop: "22px",
                    }}
                  >
                    {education
                      .slice(0, 4)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            style={{
                              padding:
                                index ===
                                0
                                  ? "0 0 18px"
                                  : "18px 0",
                              borderBottom:
                                index !==
                                Math.min(
                                  education.length,
                                  4
                                ) -
                                  1
                                  ? "1px solid #eeeeeb"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  650,
                                fontSize:
                                  "15px",
                              }}
                            >
                              {item.degree ||
                                item.field_of_study ||
                                "Education"}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "5px",
                                fontSize:
                                  "13px",
                                color:
                                  "#69707d",
                              }}
                            >
                              {item.institution ||
                                "Institution"}
                            </div>

                            {item.grade && (
                              <div
                                style={{
                                  marginTop:
                                    "5px",
                                  fontSize:
                                    "12px",
                                  color:
                                    "#8a8f97",
                                }}
                              >
                                {
                                  item.grade
                                }
                              </div>
                            )}
                          </div>
                        )
                      )}
                  </div>
                ) : (
                  <EmptySection
                    text="No education detected yet."
                  />
                )}
              </section>

              {/* Certifications */}

              <section
                style={{
                  background: "#fff",
                  border:
                    "1px solid #e4e4e0",
                  borderRadius: "12px",
                  padding: "28px",
                }}
              >
                <SectionHeader
                  number="04"
                  title="Certifications"
                  count={
                    certifications.length
                  }
                />

                {certifications.length >
                0 ? (
                  <div
                    style={{
                      marginTop: "22px",
                    }}
                  >
                    {certifications
                      .slice(0, 4)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            style={{
                              padding:
                                index ===
                                0
                                  ? "0 0 18px"
                                  : "18px 0",
                              borderBottom:
                                index !==
                                Math.min(
                                  certifications.length,
                                  4
                                ) -
                                  1
                                  ? "1px solid #eeeeeb"
                                  : "none",
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  650,
                                fontSize:
                                  "15px",
                              }}
                            >
                              {item.name ||
                                "Certification"}
                            </div>

                            {item.issuing_organization && (
                              <div
                                style={{
                                  marginTop:
                                    "5px",
                                  fontSize:
                                    "13px",
                                  color:
                                    "#69707d",
                                }}
                              >
                                {
                                  item.issuing_organization
                                }
                              </div>
                            )}
                          </div>
                        )
                      )}
                  </div>
                ) : (
                  <EmptySection
                    text="No certifications detected."
                  />
                )}
              </section>
            </div>

            {/* ==================================================
                RESUME CHECKLIST
            ================================================== */}

            <section
              style={{
                marginTop: "22px",
                background: "#fff",
                border:
                  "1px solid #e4e4e0",
                borderRadius: "12px",
                padding: "28px",
              }}
            >
              <SectionHeader
                number="05"
                title="Resume checklist"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(5, minmax(0, 1fr))",
                  gap: "12px",
                  marginTop: "24px",
                }}
              >
                {completenessItems.map(
                  (item, index) => (
                    <div
                      key={index}
                      style={{
                        border:
                          "1px solid #eeeeeb",
                        borderRadius:
                          "7px",
                        padding: "16px",
                        background:
                          "#fafaf8",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "18px",
                          marginBottom:
                            "10px",
                        }}
                      >
                        {item.complete
                          ? "✓"
                          : "—"}
                      </div>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          lineHeight:
                            1.5,
                          color:
                            item.complete
                              ? "#386047"
                              : "#777",
                        }}
                      >
                        {item.label}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

// ======================================================
// Section Header
// ======================================================

function SectionHeader({
  number,
  title,
  count,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent:
          "space-between",
        gap: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#999",
            letterSpacing:
              "0.1em",
          }}
        >
          {number}
        </span>

        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: 600,
            letterSpacing:
              "-0.025em",
          }}
        >
          {title}
        </h2>
      </div>

      {typeof count ===
        "number" && (
        <span
          style={{
            fontSize: "12px",
            color: "#8a8f97",
          }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

// ======================================================
// Empty Section
// ======================================================

function EmptySection({ text }) {
  return (
    <p
      style={{
        marginTop: "22px",
        marginBottom: 0,
        color: "#8a8f97",
        fontSize: "13px",
        lineHeight: 1.6,
      }}
    >
      {text}
    </p>
  )
}

export default Resume