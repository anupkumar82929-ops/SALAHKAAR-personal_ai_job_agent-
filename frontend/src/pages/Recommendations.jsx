import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "../api/client"

function Recommendations() {
  const navigate = useNavigate()

  const [recommendations, setRecommendations] =
    useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [savedJobIds, setSavedJobIds] =
    useState(new Set())

  const [savingJobId, setSavingJobId] =
    useState(null)

  // =====================================================
  // LOAD RECOMMENDATIONS
  // =====================================================

  const loadRecommendations = async () => {
    try {
      setLoading(true)
      setError("")

      const response =
        await apiClient.get(
          "/api/recommendations",
          {
            params: {
              limit: 20,
            },
          }
        )

      setRecommendations(
        response.data?.recommendations || []
      )
    } catch (err) {
      console.error(
        "Failed to load recommendations:",
        err
      )

      const detail =
        err.response?.data?.detail

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item) =>
                item?.msg || String(item)
            )
            .join(", ")
        )
      } else {
        setError(
          detail ||
            "Unable to load your AI matches."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // LOAD SAVED JOBS
  // =====================================================

  const loadSavedJobs = async () => {
    try {
      const response =
        await apiClient.get(
          "/api/saved-jobs"
        )

      const savedJobs =
        response.data?.saved_jobs || []

      const ids = new Set()

      savedJobs.forEach((item) => {
        const job =
          item?.job || item

        const id =
          job?.id ||
          item?.job_id

        if (
          id !== undefined &&
          id !== null
        ) {
          ids.add(String(id))
        }
      })

      setSavedJobIds(ids)
    } catch (err) {
      console.error(
        "Unable to load saved jobs:",
        err
      )
    }
  }

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadRecommendations()
    loadSavedJobs()
  }, [])

  // =====================================================
  // SAVE / REMOVE
  // =====================================================

  const handleSaveJob = async (jobId) => {
    try {
      setSavingJobId(jobId)

      const id = String(jobId)

      if (savedJobIds.has(id)) {
        await apiClient.delete(
          `/api/saved-jobs/${jobId}`
        )

        setSavedJobIds((previous) => {
          const next = new Set(previous)
          next.delete(id)
          return next
        })
      } else {
        await apiClient.post(
          `/api/saved-jobs/${jobId}`
        )

        setSavedJobIds((previous) => {
          const next = new Set(previous)
          next.add(id)
          return next
        })
      }
    } catch (err) {
      console.error(
        "Save job error:",
        err
      )

      alert(
        err.response?.data?.detail ||
          "Unable to update saved job."
      )
    } finally {
      setSavingJobId(null)
    }
  }

  // =====================================================
  // SCORE
  // =====================================================

  const getScore = (recommendation) => {
    const match =
      recommendation?.match || {}

    return Math.round(
      Number(match.score || 0)
    )
  }

  const getScoreLabel = (score) => {
    if (score >= 85) {
      return "Excellent match"
    }

    if (score >= 70) {
      return "Strong match"
    }

    if (score >= 55) {
      return "Good match"
    }

    if (score >= 40) {
      return "Potential match"
    }

    return "Low match"
  }

  // =====================================================
  // BREAKDOWN
  // =====================================================

  const getBreakdown = (recommendation) => {
    const breakdown =
      recommendation?.match?.breakdown ||
      {}

    return [
      {
        label: "Skills",
        value: Number(
          breakdown.skill_score ??
            breakdown.skills ??
            0
        ),
      },
      {
        label: "Experience",
        value: Number(
          breakdown.experience_score ??
            breakdown.experience ??
            0
        ),
      },
      {
        label: "Location",
        value: Number(
          breakdown.location_score ??
            breakdown.location ??
            0
        ),
      },
      {
        label: "Work mode",
        value: Number(
          breakdown.work_mode_score ??
            breakdown.work_mode ??
            0
        ),
      },
    ]
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#f7f7f5]">

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">

          <div className="animate-pulse space-y-8">

            <div className="h-4 w-28 rounded bg-slate-200" />

            <div className="h-12 w-[560px] max-w-full rounded bg-slate-200" />

            <div className="h-5 w-[500px] max-w-full rounded bg-slate-200" />

            <div className="grid gap-5">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 rounded-3xl bg-white"
                />
              ))}

            </div>

          </div>

        </div>

      </div>
    )
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-full bg-[#f7f7f5] text-slate-900">

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mb-10">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Salahkaar / AI Matches
          </p>

          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
                Jobs that make sense for you
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
                Salahkaar compares your skills,
                experience and preferences against
                available opportunities to find the
                strongest matches.
              </p>

            </div>

            <button
              type="button"
              onClick={loadRecommendations}
              className="self-start rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950 lg:self-auto"
            >
              Refresh matches
            </button>

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* =================================================
            EMPTY
        ================================================== */}

        {!error &&
          recommendations.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

              <div className="mx-auto max-w-lg">

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  AI matching
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  We need a little more information
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Complete your profile and resume so
                  Salahkaar can calculate meaningful job
                  matches for you.
                </p>

                <div className="mt-6 flex flex-wrap justify-center gap-3">

                  <Link
                    to="/app/profile"
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Complete profile
                  </Link>

                  <Link
                    to="/app/resume"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
                  >
                    Manage resume
                  </Link>

                </div>

              </div>

            </div>
          )}

        {/* =================================================
            RESULTS SUMMARY
        ================================================== */}

        {recommendations.length > 0 && (
          <>

            <div className="mb-5 flex items-end justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Personalized results
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {recommendations.length} opportunities
                  ranked for your profile
                </p>

              </div>

            </div>

            {/* =================================================
                RECOMMENDATIONS
            ================================================== */}

            <div className="space-y-5">

              {recommendations.map(
                (recommendation, index) => {

                  const job =
                    recommendation?.job || {}

                  const match =
                    recommendation?.match || {}

                  const score =
                    getScore(recommendation)

                  const saved =
                    savedJobIds.has(
                      String(job.id)
                    )

                  const matchingSkills =
                    match.matching_skills ||
                    []

                  const missingSkills =
                    match.missing_skills ||
                    []

                  const reasons =
                    match.reasons || []

                  const breakdown =
                    getBreakdown(
                      recommendation
                    )

                  return (
                    <article
                      key={
                        job.id ||
                        `${job.title}-${index}`
                      }
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
                    >

                      {/* =================================================
                          JOB HEADER
                      ================================================== */}

                      <div className="p-5 md:p-7">

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                          <div className="flex gap-4">

                            {/* COMPANY MARK */}

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-[#fafaf9]">

                              <span className="text-xl font-semibold text-slate-700">
                                {(job.company ||
                                  job.title ||
                                  "J")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                            </div>

                            <div>

                              <div className="flex flex-wrap items-center gap-3">

                                <Link
                                  to={`/app/jobs/${job.id}`}
                                  className="text-xl font-semibold tracking-tight text-slate-950 hover:text-slate-600 md:text-2xl"
                                >
                                  {job.title ||
                                    "Untitled position"}
                                </Link>

                                {index === 0 && (
                                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                                    Top match
                                  </span>
                                )}

                              </div>

                              <p className="mt-1 text-sm font-medium text-slate-600">
                                {job.company ||
                                  "Company not specified"}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">

                                {job.location && (
                                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                                    {job.location}
                                  </span>
                                )}

                                {job.work_mode && (
                                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                                    {job.work_mode}
                                  </span>
                                )}

                                {job.employment_type && (
                                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
                                    {job.employment_type}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                          {/* =================================================
                              SCORE + STAR
                          ================================================== */}

                          <div className="flex items-center gap-3">

                            <div className="text-right">

                              <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                                {score}%
                              </p>

                              <p className="text-xs font-medium text-slate-500">
                                {getScoreLabel(score)}
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleSaveJob(
                                  job.id
                                )
                              }
                              disabled={
                                savingJobId ===
                                job.id
                              }
                              title={
                                saved
                                  ? "Remove from saved jobs"
                                  : "Save job"
                              }
                              aria-label={
                                saved
                                  ? "Remove from saved jobs"
                                  : "Save job"
                              }
                              className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl transition ${
                                saved
                                  ? "border-slate-950 bg-slate-950 text-white"
                                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-950"
                              }`}
                            >
                              {savingJobId ===
                              job.id
                                ? "..."
                                : saved
                                ? "★"
                                : "☆"}
                            </button>

                          </div>

                        </div>

                      </div>

                      {/* =================================================
                          MATCH BREAKDOWN
                      ================================================== */}

                      <div className="border-y border-slate-100 bg-[#fafaf9] px-5 py-6 md:px-7">

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

                          {breakdown.map(
                            (item) => {

                              const value =
                                Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    Math.round(
                                      item.value
                                    )
                                  )
                                )

                              return (
                                <div
                                  key={
                                    item.label
                                  }
                                >

                                  <div className="flex items-center justify-between">

                                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                                      {item.label}
                                    </p>

                                    <span className="text-xs font-semibold text-slate-700">
                                      {value}%
                                    </span>

                                  </div>

                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">

                                    <div
                                      className="h-full rounded-full bg-slate-900 transition-all"
                                      style={{
                                        width: `${value}%`,
                                      }}
                                    />

                                  </div>

                                </div>
                              )
                            }
                          )}

                        </div>

                      </div>

                      {/* =================================================
                          SKILLS + REASONS
                      ================================================== */}

                      <div className="grid gap-8 p-5 md:grid-cols-2 md:p-7">

                        {/* MATCHING SKILLS */}

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Skills you already match
                          </p>

                          {matchingSkills.length >
                          0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">

                              {matchingSkills.map(
                                (skill, skillIndex) => (
                                  <span
                                    key={`${skill}-${skillIndex}`}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                                  >
                                    {skill}
                                  </span>
                                )
                              )}

                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-400">
                              No matching skills identified.
                            </p>
                          )}

                        </div>

                        {/* MISSING SKILLS */}

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Skills to strengthen
                          </p>

                          {missingSkills.length >
                          0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">

                              {missingSkills.map(
                                (skill, skillIndex) => (
                                  <span
                                    key={`${skill}-${skillIndex}`}
                                    className="rounded-full border border-slate-200 bg-[#fafaf9] px-3 py-1.5 text-xs font-medium text-slate-500"
                                  >
                                    {skill}
                                  </span>
                                )
                              )}

                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-400">
                              No major skill gaps identified.
                            </p>
                          )}

                        </div>

                      </div>

                      {/* =================================================
                          WHY SALAHKAAR RECOMMENDS IT
                      ================================================== */}

                      {reasons.length > 0 && (
                        <div className="border-t border-slate-100 px-5 py-6 md:px-7">

                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Why Salahkaar recommends this
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">

                            {reasons
                              .slice(0, 6)
                              .map(
                                (
                                  reason,
                                  reasonIndex
                                ) => (
                                  <div
                                    key={
                                      reasonIndex
                                    }
                                    className="flex gap-3"
                                  >

                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />

                                    <p className="text-sm leading-6 text-slate-600">
                                      {reason}
                                    </p>

                                  </div>
                                )
                              )}

                          </div>

                        </div>
                      )}

                      {/* =================================================
                          FOOTER
                      ================================================== */}

                      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">

                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">

                          {job.salary_min ||
                          job.salary_max ? (
                            <span>
                              Salary:{" "}
                              <strong className="font-medium text-slate-600">
                                {job.salary_currency ||
                                  "INR"}{" "}
                                {job.salary_min
                                  ?.toLocaleString(
                                    "en-IN"
                                  ) ||
                                  ""}

                                {job.salary_min &&
                                job.salary_max
                                  ? " – "
                                  : ""}

                                {job.salary_max
                                  ?.toLocaleString(
                                    "en-IN"
                                  ) || ""}
                              </strong>
                            </span>
                          ) : null}

                          {job.experience_min !==
                            null &&
                            job.experience_min !==
                              undefined && (
                              <span>
                                Experience:{" "}
                                <strong className="font-medium text-slate-600">
                                  {job.experience_min}
                                  {job.experience_max !==
                                  null &&
                                  job.experience_max !==
                                    undefined
                                    ? ` – ${job.experience_max}`
                                    : "+"}{" "}
                                  years
                                </strong>
                              </span>
                            )}

                        </div>

                        <div className="flex flex-wrap gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/app/jobs/${job.id}`
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                          >
                            View details
                          </button>

                          {job.application_url && (
                            <a
                              href={
                                job.application_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Apply ↗
                            </a>
                          )}

                        </div>

                      </div>

                    </article>
                  )
                }
              )}

            </div>

          </>
        )}

      </div>

    </div>
  )
}

export default Recommendations