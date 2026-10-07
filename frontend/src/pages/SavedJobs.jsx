import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "../api/client"

function Saved() {
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // ==========================================
  // FETCH SAVED JOBS
  // ==========================================

  const fetchSavedJobs = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await apiClient.get("/api/saved-jobs")

      setSavedJobs(
        response.data?.saved_jobs || []
      )

    } catch (error) {
      console.error(
        "Failed to load saved jobs:",
        error
      )

      const detail = error.response?.data?.detail

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
          "Unable to load saved jobs."
        )
      }

    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // LOAD WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {
    fetchSavedJobs()
  }, [])

  // ==========================================
  // REMOVE SAVED JOB
  // ==========================================

  const removeSavedJob = async (jobId) => {
    try {
      await apiClient.delete(
        `/api/saved-jobs/${jobId}`
      )

      setSavedJobs((currentJobs) =>
        currentJobs.filter((item) => {
          const job =
            item.job || item

          const id =
            job.id ||
            item.job_id

          return (
            String(id) !==
            String(jobId)
          )
        })
      )

    } catch (error) {
      console.error(
        "Failed to remove saved job:",
        error
      )

      alert(
        "Unable to remove saved job."
      )
    }
  }

  // ==========================================
  // GET JOB OBJECT
  // ==========================================

  const getJob = (item) => {
    return item.job || item
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="grid gap-5">

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}

        </div>

      </div>
    )
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">

        <div className="text-5xl">
          ⚠️
        </div>

        <h2 className="mt-4 text-xl font-bold text-red-800">
          Unable to Load Saved Jobs
        </h2>

        <p className="mt-2 text-red-600">
          {error}
        </p>

        <button
          onClick={fetchSavedJobs}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>

      </div>
    )
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="space-y-6">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 text-2xl">
              ⭐
            </div>

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Saved Jobs
              </h1>

              <p className="mt-1 text-gray-500">
                Jobs you've saved for later.
              </p>

            </div>

          </div>

        </div>

        {savedJobs.length > 0 && (
          <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {savedJobs.length}{" "}
            {savedJobs.length === 1
              ? "Job"
              : "Jobs"}{" "}
            Saved
          </div>
        )}

      </div>

      {/* ======================================
          EMPTY STATE
      ======================================= */}

      {savedJobs.length === 0 && (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50 text-5xl">
            ⭐
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            No Saved Jobs Yet
          </h2>

          <p className="mx-auto mt-3 max-w-md leading-6 text-gray-500">
            When you find a job you're interested in,
            save it here so you can easily come back
            to it later.
          </p>

          <Link
            to="/app/jobs"
            className="mt-7 inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            🔎 Find Jobs
          </Link>

        </div>

      )}

      {/* ======================================
          SAVED JOB LIST
      ======================================= */}

      {savedJobs.length > 0 && (

        <div className="grid gap-5">

          {savedJobs.map((item) => {

            const job = getJob(item)

            const jobId =
              job.id ||
              item.job_id

            return (

              <div
                key={jobId}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                  {/* =================================
                      JOB INFORMATION
                  ================================== */}

                  <div className="flex gap-4">

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                      💼
                    </div>

                    <div>

                      <h2 className="text-xl font-bold text-gray-900">
                        {job.title ||
                          "Untitled Job"}
                      </h2>

                      <p className="mt-1 font-medium text-gray-700">
                        {job.company ||
                          "Company not specified"}
                      </p>

                      {/* JOB TAGS */}

                      <div className="mt-4 flex flex-wrap gap-2">

                        {job.location && (
                          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                            📍{" "}
                            {job.location}
                          </span>
                        )}

                        {job.work_mode && (
                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700">
                            💻{" "}
                            {job.work_mode}
                          </span>
                        )}

                        {job.employment_type && (
                          <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm text-green-700">
                            🧑‍💼{" "}
                            {job.employment_type}
                          </span>
                        )}

                      </div>

                      {/* SALARY */}

                      {(job.salary_min ||
                        job.salary_max) && (

                        <p className="mt-4 text-sm font-semibold text-gray-700">

                          💰{" "}

                          {job.salary_currency ||
                            "INR"}{" "}

                          {job.salary_min &&
                            job.salary_max
                            ? `${job.salary_min} - ${job.salary_max}`
                            : job.salary_min
                            ? `${job.salary_min}+`
                            : job.salary_max}

                        </p>

                      )}

                    </div>

                  </div>

                  {/* =================================
                      ACTIONS
                  ================================== */}

                  <div className="flex shrink-0 flex-wrap gap-3">

                    <Link
                      to={`/app/jobs/${jobId}`}
                      className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      View Job
                    </Link>

                    {job.application_url && (

                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
                      >
                        Apply ↗
                      </a>

                    )}

                    <button
                      onClick={() =>
                        removeSavedJob(jobId)
                      }
                      className="rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Remove
                    </button>

                  </div>

                </div>

              </div>

            )
          })}

        </div>

      )}

    </div>
  )
}

export default Saved