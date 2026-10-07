import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "../api/client"

function Jobs() {
  const navigate = useNavigate()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")

  const [keyword, setKeyword] = useState("")
  const [location, setLocation] = useState("")
  const [workMode, setWorkMode] = useState("")

  const [savedJobIds, setSavedJobIds] = useState(new Set())
  const [savingJobId, setSavingJobId] = useState(null)

  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const LIMIT = 10

  // =====================================================
  // LOAD JOBS
  // =====================================================

  const fetchJobs = async ({
    searchKeyword = keyword,
    searchLocation = location,
    searchWorkMode = workMode,
    currentPage = page,
  } = {}) => {
    try {
      setSearching(true)
      setError("")

      const response = await apiClient.get("/api/jobs", {
        params: {
          keyword:
            searchKeyword.trim() || undefined,

          location:
            searchLocation.trim() || undefined,

          work_mode:
            searchWorkMode || undefined,

          limit: LIMIT,
          offset: currentPage * LIMIT,
        },
      })

      setJobs(response.data?.jobs || [])
      setTotal(Number(response.data?.total || 0))
    } catch (err) {
      console.error("Failed to load jobs:", err)

      const detail = err.response?.data?.detail

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
            "Unable to load jobs. Please try again."
        )
      }
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  // =====================================================
  // LOAD SAVED JOBS
  // =====================================================

  const loadSavedJobs = async () => {
    try {
      const response =
        await apiClient.get("/api/saved-jobs")

      const savedJobs =
        response.data?.saved_jobs || []

      const ids = new Set()

      savedJobs.forEach((item) => {
        const job = item?.job || item

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
    fetchJobs({
      currentPage: 0,
    })

    loadSavedJobs()
  }, [])

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = async (event) => {
    event.preventDefault()

    setPage(0)

    await fetchJobs({
      currentPage: 0,
    })
  }

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const handleClear = async () => {
    setKeyword("")
    setLocation("")
    setWorkMode("")
    setPage(0)

    await fetchJobs({
      searchKeyword: "",
      searchLocation: "",
      searchWorkMode: "",
      currentPage: 0,
    })
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages =
    Math.ceil(total / LIMIT)

  const handlePrevious = async () => {
    if (page <= 0) {
      return
    }

    const nextPage = page - 1

    setPage(nextPage)

    await fetchJobs({
      currentPage: nextPage,
    })
  }

  const handleNext = async () => {
    if (page >= totalPages - 1) {
      return
    }

    const nextPage = page + 1

    setPage(nextPage)

    await fetchJobs({
      currentPage: nextPage,
    })
  }

  // =====================================================
  // STAR / UNSAVE JOB
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
  // FORMAT SALARY
  // =====================================================

  const formatSalary = (job) => {
    const min = job.salary_min
    const max = job.salary_max

    if (
      (min === null ||
        min === undefined) &&
      (max === null ||
        max === undefined)
    ) {
      return null
    }

    const currency =
      job.salary_currency || "INR"

    const formatNumber = (value) => {
      const number = Number(value)

      if (Number.isNaN(number)) {
        return value
      }

      return number.toLocaleString("en-IN")
    }

    if (
      min !== null &&
      min !== undefined &&
      max !== null &&
      max !== undefined
    ) {
      return `${currency} ${formatNumber(
        min
      )} – ${formatNumber(max)}`
    }

    if (
      min !== null &&
      min !== undefined
    ) {
      return `${currency} ${formatNumber(
        min
      )}+`
    }

    return `${currency} ${formatNumber(
      max
    )}`
  }

  // =====================================================
  // FORMAT EXPERIENCE
  // =====================================================

  const formatExperience = (job) => {
    const min = job.experience_min
    const max = job.experience_max

    if (
      min === null ||
      min === undefined
    ) {
      if (
        max === null ||
        max === undefined
      ) {
        return "Not specified"
      }

      return `Up to ${max} years`
    }

    if (
      max === null ||
      max === undefined
    ) {
      return `${min}+ years`
    }

    if (Number(min) === Number(max)) {
      return `${min} years`
    }

    return `${min} – ${max} years`
  }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Recently posted"
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return "Recently posted"
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )
  }

  // =====================================================
  // RESULTS RANGE
  // =====================================================

  const startResult =
    total === 0
      ? 0
      : page * LIMIT + 1

  const endResult = Math.min(
    (page + 1) * LIMIT,
    total
  )

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#f7f7f5]">

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">

          <div className="animate-pulse space-y-8">

            <div className="h-4 w-24 rounded bg-slate-200" />

            <div className="h-12 w-[500px] max-w-full rounded bg-slate-200" />

            <div className="h-5 w-96 max-w-full rounded bg-slate-200" />

            <div className="rounded-3xl border border-slate-200 bg-white p-6">

              <div className="grid gap-4 lg:grid-cols-4">

                <div className="h-12 rounded-xl bg-slate-100" />

                <div className="h-12 rounded-xl bg-slate-100" />

                <div className="h-12 rounded-xl bg-slate-100" />

                <div className="h-12 rounded-xl bg-slate-100" />

              </div>

            </div>

            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-52 rounded-2xl bg-white"
              />
            ))}

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

        {/* HEADER */}

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Salahkaar / Find Jobs
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
                Find your next opportunity
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
                Search through available opportunities
                and find roles that fit your skills,
                preferences and career direction.
              </p>

            </div>

            <div className="text-sm text-slate-500">

              <span className="font-semibold text-slate-950">
                {total}
              </span>{" "}
              opportunities available

            </div>

          </div>

        </div>

        {/* SEARCH */}

        <form
          onSubmit={handleSearch}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 md:p-6"
        >

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_0.8fr_auto]">

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Role, skill or company
              </label>

              <input
                type="text"
                value={keyword}
                onChange={(event) =>
                  setKeyword(event.target.value)
                }
                placeholder="e.g. Machine Learning Engineer"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="e.g. Delhi"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-500"
              />

            </div>

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Work mode
              </label>

              <select
                value={workMode}
                onChange={(event) =>
                  setWorkMode(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none focus:border-slate-500"
              >

                <option value="">
                  Any
                </option>

                <option value="Remote">
                  Remote
                </option>

                <option value="Hybrid">
                  Hybrid
                </option>

                <option value="On-site">
                  On-site
                </option>

              </select>

            </div>

            <div className="flex items-end">

              <button
                type="submit"
                disabled={searching}
                className="w-full rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 lg:w-auto"
              >
                {searching
                  ? "Searching..."
                  : "Search jobs"}
              </button>

            </div>

          </div>

          {(keyword ||
            location ||
            workMode) && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

              <p className="text-xs text-slate-400">
                Filters are active
              </p>

              <button
                type="button"
                onClick={handleClear}
                className="text-sm font-medium text-slate-600 hover:text-slate-950"
              >
                Clear filters
              </button>

            </div>
          )}

        </form>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}

        {/* RESULTS HEADER */}

        <div className="mb-5">

          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Search results
          </p>

          <p className="mt-1 text-sm text-slate-500">

            {total > 0
              ? `Showing ${startResult}–${endResult} of ${total} jobs`
              : "No jobs found"}

          </p>

        </div>

        {/* EMPTY */}

        {jobs.length === 0 &&
          !searching && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

              <div className="mx-auto max-w-md">

                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                  No matching opportunities
                </p>

                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Try a broader search
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Change the role, location or work mode
                  filters and search again.
                </p>

                <button
                  type="button"
                  onClick={handleClear}
                  className="mt-6 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Reset search
                </button>

              </div>

            </div>
          )}

        {/* JOBS */}

        {jobs.length > 0 && (
          <div className="space-y-4">

            {jobs.map((job) => {

              const saved =
                savedJobIds.has(
                  String(job.id)
                )

              const salary =
                formatSalary(job)

              return (
                <article
                  key={job.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 md:p-6"
                >

                  <div className="flex flex-col gap-6">

                    {/* JOB HEADER */}

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex gap-4">

                        {/* COMPANY INITIAL */}

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#fafaf9]">

                          <span className="text-lg font-semibold text-slate-700">
                            {(job.company ||
                              job.title ||
                              "J")
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                        </div>

                        <div>

                          <Link
                            to={`/app/jobs/${job.id}`}
                            className="text-xl font-semibold tracking-tight text-slate-950 transition hover:text-slate-600"
                          >
                            {job.title ||
                              "Untitled position"}
                          </Link>

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

                      {/* =================================
                          STAR BUTTON
                      ================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          handleSaveJob(job.id)
                        }
                        disabled={
                          savingJobId === job.id
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
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl transition ${
                          saved
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-950"
                        } ${
                          savingJobId === job.id
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        {savingJobId === job.id
                          ? "..."
                          : saved
                          ? "★"
                          : "☆"}
                      </button>

                    </div>

                    {/* INFORMATION */}

                    <div className="grid gap-4 border-y border-slate-100 py-5 sm:grid-cols-2 lg:grid-cols-4">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Experience
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatExperience(job)}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Salary
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {salary ||
                            "Not specified"}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Posted
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(
                            job.posted_at
                          )}
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Source
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {job.source ||
                            "Salahkaar"}
                        </p>

                      </div>

                    </div>

                    {/* DESCRIPTION */}

                    {job.description && (
                      <p className="line-clamp-2 max-w-4xl text-sm leading-6 text-slate-500">
                        {job.description}
                      </p>
                    )}

                    {/* ACTIONS */}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <p className="text-xs text-slate-400">
                        Review the role before applying.
                      </p>

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

                  </div>

                </article>
              )
            })}

          </div>
        )}

        {/* PAGINATION */}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">

            <button
              type="button"
              onClick={handlePrevious}
              disabled={
                page === 0 ||
                searching
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <div className="text-sm text-slate-500">

              Page{" "}
              <span className="font-semibold text-slate-900">
                {page + 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {totalPages}
              </span>

            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={
                page >= totalPages - 1 ||
                searching
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>

          </div>
        )}

      </div>

    </div>
  )
}

export default Jobs