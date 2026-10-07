import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import apiClient from "../api/client"

function Jobs() {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const [jobs, setJobs] = useState([])
  const [savedJobIds, setSavedJobIds] =
    useState(new Set())

  const [loading, setLoading] = useState(true)
  const [savingJobId, setSavingJobId] =
    useState(null)
  const [error, setError] = useState("")

  const [keyword, setKeyword] = useState(
    searchParams.get("keyword") || ""
  )

  const [location, setLocation] = useState(
    searchParams.get("location") || ""
  )

  const [workMode, setWorkMode] = useState(
    searchParams.get("work_mode") || ""
  )

  const [appliedFilters, setAppliedFilters] =
    useState({
      keyword:
        searchParams.get("keyword") || "",
      location:
        searchParams.get("location") || "",
      work_mode:
        searchParams.get("work_mode") || "",
    })

  const [page, setPage] = useState(1)

  const limit = 10

  const [total, setTotal] = useState(0)

  // =====================================================
  // LOAD JOBS
  // =====================================================

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError("")

      const params = {
        limit,
        offset: (page - 1) * limit,
      }

      if (
        appliedFilters.keyword.trim()
      ) {
        params.keyword =
          appliedFilters.keyword.trim()
      }

      if (
        appliedFilters.location.trim()
      ) {
        params.location =
          appliedFilters.location.trim()
      }

      if (
        appliedFilters.work_mode
      ) {
        params.work_mode =
          appliedFilters.work_mode
      }

      console.log(
        "Searching jobs with:",
        params
      )

      const response =
        await apiClient.get(
          "/api/jobs",
          {
            params,
          }
        )

      setJobs(
        response.data?.jobs || []
      )

      setTotal(
        Number(
          response.data?.total || 0
        )
      )
    } catch (err) {
      console.error(
        "Failed to load jobs:",
        err
      )

      const detail =
        err.response?.data?.detail

      if (Array.isArray(detail)) {
        setError(
          detail
            .map(
              (item) =>
                item?.msg ||
                String(item)
            )
            .join(", ")
        )
      } else {
        setError(
          detail ||
            "Unable to load jobs."
        )
      }

      setJobs([])
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
        response.data?.saved_jobs ||
        []

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
        "Failed to load saved jobs:",
        err
      )
    }
  }

  // =====================================================
  // INITIAL LOAD + FILTER CHANGES
  // =====================================================

  useEffect(() => {
    loadJobs()
  }, [page, appliedFilters])

  useEffect(() => {
    loadSavedJobs()
  }, [])

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (event) => {
    event?.preventDefault()

    const filters = {
      keyword: keyword.trim(),
      location: location.trim(),
      work_mode: workMode,
    }

    setPage(1)

    setAppliedFilters(filters)

    const params = {}

    if (filters.keyword) {
      params.keyword =
        filters.keyword
    }

    if (filters.location) {
      params.location =
        filters.location
    }

    if (filters.work_mode) {
      params.work_mode =
        filters.work_mode
    }

    setSearchParams(params)
  }

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setKeyword("")
    setLocation("")
    setWorkMode("")

    setPage(1)

    setAppliedFilters({
      keyword: "",
      location: "",
      work_mode: "",
    })

    setSearchParams({})
  }

  // =====================================================
  // SAVE / REMOVE JOB
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
          const next =
            new Set(previous)

          next.delete(id)

          return next
        })
      } else {
        await apiClient.post(
          `/api/saved-jobs/${jobId}`
        )

        setSavedJobIds((previous) => {
          const next =
            new Set(previous)

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
  // PAGINATION
  // =====================================================

  const totalPages =
    Math.ceil(total / limit)

  const hasPreviousPage =
    page > 1

  const hasNextPage =
    page < totalPages

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setPage((previous) =>
        previous - 1
      )
    }
  }

  const goToNextPage = () => {
    if (hasNextPage) {
      setPage((previous) =>
        previous + 1
      )
    }
  }

  // =====================================================
  // SALARY
  // =====================================================

  const formatSalary = (job) => {
    const min = job.salary_min
    const max = job.salary_max

    if (!min && !max) {
      return null
    }

    const currency =
      job.salary_currency || "INR"

    if (min && max) {
      return `${currency} ${Number(
        min
      ).toLocaleString(
        "en-IN"
      )} – ${Number(
        max
      ).toLocaleString(
        "en-IN"
      )}`
    }

    if (min) {
      return `${currency} ${Number(
        min
      ).toLocaleString(
        "en-IN"
      )}+`
    }

    return `${currency} ${Number(
      max
    ).toLocaleString(
      "en-IN"
    )}`
  }

  // =====================================================
  // EXPERIENCE
  // =====================================================

  const formatExperience = (job) => {
    const min =
      job.experience_min

    const max =
      job.experience_max

    if (
      min === null ||
      min === undefined
    ) {
      if (
        max === null ||
        max === undefined
      ) {
        return null
      }

      return `Up to ${max} years`
    }

    if (
      max !== null &&
      max !== undefined
    ) {
      return `${min} – ${max} years`
    }

    return `${min}+ years`
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-full bg-[#f7f7f5]">

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">

          <div className="animate-pulse space-y-6">

            <div className="h-4 w-24 rounded bg-slate-200" />

            <div className="h-12 w-96 max-w-full rounded bg-slate-200" />

            <div className="h-5 w-[500px] max-w-full rounded bg-slate-200" />

            <div className="h-24 rounded-3xl bg-white" />

            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="h-56 rounded-3xl bg-white"
                />
              )
            )}

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

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Salahkaar / Find Jobs
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Find your next opportunity
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Search technology jobs by role,
            company, location and work preference.
          </p>

        </div>

        {/* =================================================
            SEARCH PANEL
        ================================================== */}

        <form
          onSubmit={handleSearch}
          className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 md:p-6"
        >

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_0.8fr_auto]">

            {/* KEYWORD */}

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                Role or keyword
              </label>

              <input
                type="text"
                value={keyword}
                onChange={(event) =>
                  setKeyword(
                    event.target.value
                  )
                }
                placeholder="Machine Learning Engineer"
                className="w-full rounded-xl border border-slate-200 bg-[#fafaf9] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:bg-white"
              />

            </div>

            {/* LOCATION */}

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                placeholder="Bengaluru"
                className="w-full rounded-xl border border-slate-200 bg-[#fafaf9] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:bg-white"
              />

            </div>

            {/* WORK MODE */}

            <div>

              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                Work mode
              </label>

              <select
                value={workMode}
                onChange={(event) =>
                  setWorkMode(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-[#fafaf9] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:bg-white"
              >
                <option value="">
                  Any work mode
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

            {/* SEARCH BUTTON */}

            <div className="flex items-end">

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:w-auto"
              >
                Search jobs
              </button>

            </div>

          </div>

          {/* FILTER FOOTER */}

          {(keyword ||
            location ||
            workMode) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

              <p className="text-xs text-slate-400">
                Press Enter or Search jobs to
                apply your filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-950"
              >
                Clear filters
              </button>

            </div>
          )}

        </form>

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
            RESULTS HEADER
        ================================================== */}

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Search results
            </p>

            <p className="mt-1 text-sm text-slate-500">

              {total === 0
                ? "No jobs found"
                : `${total} ${
                    total === 1
                      ? "job"
                      : "jobs"
                  } found`}

            </p>

          </div>

          {totalPages > 0 && (
            <p className="text-xs text-slate-400">
              Page {page} of{" "}
              {totalPages}
            </p>
          )}

        </div>

        {/* =================================================
            EMPTY
        ================================================== */}

        {!error &&
          jobs.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                No results
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                No jobs match your search
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                Try a broader job title,
                different location, or
                another work mode.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Clear search
              </button>

            </div>
          )}

        {/* =================================================
            JOB LIST
        ================================================== */}

        <div className="space-y-4">

          {jobs.map((job) => {

            const saved =
              savedJobIds.has(
                String(job.id)
              )

            const salary =
              formatSalary(job)

            const experience =
              formatExperience(job)

            return (
              <article
                key={job.id}
                className="rounded-3xl border border-slate-200 bg-white transition hover:border-slate-300"
              >

                <div className="p-5 md:p-7">

                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                    {/* LEFT */}

                    <div className="flex min-w-0 gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-[#fafaf9]">

                        <span className="text-xl font-semibold text-slate-700">
                          {(job.company ||
                            job.title ||
                            "J")
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                      </div>

                      <div className="min-w-0">

                        <Link
                          to={`/app/jobs/${job.id}`}
                          className="block truncate text-xl font-semibold tracking-tight text-slate-950 hover:text-slate-600"
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

                    {/* STAR */}

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
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl transition ${
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

                  {/* META */}

                  <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">

                    {salary && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Salary
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {salary}
                        </p>
                      </div>
                    )}

                    {experience && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Experience
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {experience}
                        </p>
                      </div>
                    )}

                    {job.source && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Source
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {job.source}
                        </p>
                      </div>
                    )}

                  </div>

                  {/* DESCRIPTION */}

                  {job.description && (
                    <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-500">
                      {job.description}
                    </p>
                  )}

                  {/* ACTIONS */}

                  <div className="mt-6 flex flex-wrap gap-3">

                    <Link
                      to={`/app/jobs/${job.id}`}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                    >
                      View details
                    </Link>

                    {job.application_url && (
                      <a
                        href={
                          job.application_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Apply ↗
                      </a>
                    )}

                  </div>

                </div>

              </article>
            )
          })}

        </div>

        {/* =================================================
            PAGINATION
        ================================================== */}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">

            <button
              type="button"
              onClick={
                goToPreviousPage
              }
              disabled={
                !hasPreviousPage
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            <span className="text-sm text-slate-500">
              {page} /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={
                goToNextPage
              }
              disabled={
                !hasNextPage
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
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