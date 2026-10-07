import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import apiClient from "../api/client"

function JobAnalysis() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await apiClient.get(
          `/api/ai/jobs/${jobId}/analysis`
        )

        if (active) {
          setAnalysis(response.data)
        }
      } catch (err) {
        console.error("AI analysis error:", err)

        const detail = err.response?.data?.detail

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) => item?.msg || String(item))
              .join(", ")
          )
        } else if (detail) {
          setError(String(detail))
        } else {
          setError(
            "Unable to analyze this job right now. Please try again."
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchAnalysis()

    return () => {
      active = false
    }
  }, [jobId])

  const score = Number(analysis?.match?.score || 0)

  const scoreLabel = useMemo(() => {
    if (score >= 85) return "Exceptional fit"
    if (score >= 70) return "Strong fit"
    if (score >= 55) return "Potential fit"
    return "Needs improvement"
  }, [score])

  const scoreMessage = useMemo(() => {
    if (score >= 85) {
      return "Your profile aligns very well with this opportunity."
    }

    if (score >= 70) {
      return "You meet most of the important requirements for this role."
    }

    if (score >= 55) {
      return "This role is worth considering, but some gaps should be addressed."
    }

    return "There are noticeable gaps between your current profile and this role."
  }, [score])

  const scoreTone = useMemo(() => {
    if (score >= 85) {
      return {
        text: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        bar: "bg-emerald-600",
      }
    }

    if (score >= 70) {
      return {
        text: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        bar: "bg-blue-600",
      }
    }

    if (score >= 55) {
      return {
        text: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        bar: "bg-amber-500",
      }
    }

    return {
      text: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
      bar: "bg-rose-500",
    }
  }, [score])

  const breakdown = analysis?.match?.breakdown || {}
  const reasons = analysis?.match?.reasons || []
  const matchingSkills = analysis?.match?.matching_skills || []
  const missingSkills = analysis?.match?.missing_skills || []

  const formatLabel = (value) => {
    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const formatScore = (value) => {
    const number = Number(value)

    if (Number.isNaN(number)) {
      return 0
    }

    return Math.round(number)
  }

  const getInitials = (company = "") => {
    const words = company
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    if (!words.length) {
      return "CO"
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase()
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f5] px-5 py-8 md:px-8">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="mb-8 h-4 w-36 rounded bg-gray-200" />

          <div className="rounded-3xl border border-gray-200 bg-white p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="h-20 w-20 rounded-2xl bg-gray-200" />

              <div className="flex-1">
                <div className="h-3 w-32 rounded bg-gray-200" />
                <div className="mt-4 h-9 w-3/4 rounded bg-gray-200" />
                <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="h-80 rounded-3xl border border-gray-200 bg-white" />
            <div className="h-80 rounded-3xl border border-gray-200 bg-white lg:col-span-2" />
          </div>

          <div className="mt-6 h-72 rounded-3xl border border-gray-200 bg-white" />
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f5] px-5 py-10 md:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Salahkaar
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950">
            Analysis unavailable
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-gray-600">
            {error || "No analysis was returned for this opportunity."}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate(`/app/jobs/${jobId}`)}
              className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Back to job
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const job = analysis.job || {}
  const companyInitials = getInitials(job.company)

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#f7f7f5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(`/app/jobs/${jobId}`)}
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950"
        >
          <span className="text-lg">←</span>
          Back to job details
        </button>

        {/* Hero */}
        <section className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-950 text-lg font-semibold text-white">
                {companyInitials}
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  AI Job Analysis
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">
                  {job.title || "Untitled role"}
                </h1>

                <p className="mt-2 text-base font-medium text-gray-700">
                  {job.company || "Company not specified"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.location && (
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {job.location}
                    </span>
                  )}

                  {job.work_mode && (
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {job.work_mode}
                    </span>
                  )}

                  {job.employment_type && (
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {job.employment_type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {job.application_url && (
              <a
                href={job.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Apply to this role
                <span className="ml-2">↗</span>
              </a>
            )}
          </div>
        </section>

        {/* Main analysis */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">

          {/* Score */}
          <section className="rounded-3xl border border-gray-200 bg-white p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Overall fit
            </p>

            <div className="mt-7 flex justify-center">
              <div className="relative h-48 w-48">
                <svg
                  viewBox="0 0 120 120"
                  className="h-full w-full -rotate-90"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-100"
                  />

                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(Math.max(score, 0), 100) * 3.14} 314`}
                    className={scoreTone.text}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-semibold tracking-tight text-gray-950">
                    {score}
                  </span>

                  <span className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
                    percent
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className={`text-lg font-semibold ${scoreTone.text}`}>
                {scoreLabel}
              </p>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-600">
                {scoreMessage}
              </p>
            </div>
          </section>

          {/* Breakdown */}
          <section className="rounded-3xl border border-gray-200 bg-white p-7 lg:col-span-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Match breakdown
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                Why this opportunity fits
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your score is based on the dimensions used by Salahkaar’s
                matching engine.
              </p>
            </div>

            <div className="mt-7 space-y-5">
              {Object.entries(breakdown).map(([key, value]) => {
                const numericValue = formatScore(value)

                return (
                  <div key={key}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {formatLabel(key)}
                      </span>

                      <span className="text-sm font-semibold text-gray-950">
                        {numericValue}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${scoreTone.bar} transition-all duration-700`}
                        style={{
                          width: `${Math.min(
                            Math.max(numericValue, 0),
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              {Object.keys(breakdown).length === 0 && (
                <div className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-600">
                  Detailed score breakdown is not available for this role.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Skills */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <section className="rounded-3xl border border-gray-200 bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Strengths
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                  Skills you already have
                </h2>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {matchingSkills.length}
              </span>
            </div>

            {matchingSkills.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {matchingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-sm leading-6 text-gray-600">
                No direct skill matches were identified.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Skill gaps
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                  Skills to strengthen
                </h2>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {missingSkills.length}
              </span>
            </div>

            {missingSkills.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {missingSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-800">
                No missing skills were identified from the available job data.
              </div>
            )}
          </section>
        </div>

        {/* Reasons */}
        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Match reasoning
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
            What is driving your score
          </h2>

          {reasons.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {reasons.map((reason, index) => (
                <div
                  key={`${reason}-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-6 text-gray-700">
                      {reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-sm text-gray-600">
              No additional match reasoning was returned.
            </div>
          )}
        </section>

        {/* Decision panel */}
        <section
          className={`mt-6 rounded-3xl border ${scoreTone.border} ${scoreTone.bg} p-7`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Your next move
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                {score >= 70
                  ? "This role deserves serious consideration."
                  : "Review the gaps before applying."}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                Use the analysis to decide whether this opportunity fits your
                current profile and application strategy.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(`/app/jobs/${jobId}`)}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Review job
              </button>

              {job.application_url && (
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-gray-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Apply now
                  <span className="ml-2">↗</span>
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="h-10" />
      </div>
    </div>
  )
}

export default JobAnalysis