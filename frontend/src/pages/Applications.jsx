import {
  useEffect,
  useMemo,
  useState,
} from "react"
import { Link } from "react-router-dom"
import apiClient from "../api/client"


function Applications() {

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatingId, setUpdatingId] = useState(null)

  // SEARCH + FILTER
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")


  // =====================================================
  // FETCH APPLICATIONS
  // =====================================================

  const fetchApplications = async () => {

    try {

      setLoading(true)
      setError("")

      const response = await apiClient.get(
        "/api/applications"
      )

      setApplications(
        response.data?.applications || []
      )

    } catch (error) {

      console.error(
        "Failed to load applications:",
        error
      )

      const detail =
        error.response?.data?.detail

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
          "Unable to load applications."
        )
      }

    } finally {

      setLoading(false)
    }
  }


  useEffect(() => {

    fetchApplications()

  }, [])


  // =====================================================
  // UPDATE APPLICATION STATUS
  // =====================================================

  const updateStatus = async (
    applicationId,
    status
  ) => {

    try {

      setUpdatingId(applicationId)

      await apiClient.patch(
        `/api/applications/${applicationId}/status`,
        {
          status,
        }
      )

      await fetchApplications()

    } catch (error) {

      console.error(
        "Failed to update application status:",
        error
      )

      const detail =
        error.response?.data?.detail

      if (Array.isArray(detail)) {

        alert(
          detail
            .map(
              (item) =>
                item?.msg ||
                String(item)
            )
            .join(", ")
        )

      } else {

        alert(
          detail ||
          "Unable to update application status."
        )
      }

    } finally {

      setUpdatingId(null)
    }
  }


  // =====================================================
  // STATUS NORMALIZER
  // =====================================================

  const normalizeStatus = (status) => {

    const normalized =
      String(status || "Applied")
        .trim()
        .toLowerCase()

    if (
      normalized === "offer" ||
      normalized === "offered"
    ) {
      return "Offer"
    }

    if (
      normalized === "interview"
    ) {
      return "Interview"
    }

    if (
      normalized === "shortlisted"
    ) {
      return "Shortlisted"
    }

    if (
      normalized === "rejected"
    ) {
      return "Rejected"
    }

    if (
      normalized === "withdrawn"
    ) {
      return "Withdrawn"
    }

    return "Applied"
  }


  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (status) => {

    const normalized =
      normalizeStatus(status)

    if (normalized === "Offer") {
      return "bg-green-100 text-green-700"
    }

    if (normalized === "Interview") {
      return "bg-purple-100 text-purple-700"
    }

    if (normalized === "Shortlisted") {
      return "bg-blue-100 text-blue-700"
    }

    if (normalized === "Rejected") {
      return "bg-red-100 text-red-700"
    }

    if (normalized === "Withdrawn") {
      return "bg-gray-100 text-gray-600"
    }

    return "bg-yellow-100 text-yellow-700"
  }


  // =====================================================
  // STATUS ICON
  // =====================================================

  const getStatusIcon = (status) => {

    const normalized =
      normalizeStatus(status)

    if (normalized === "Offer") {
      return "🎉"
    }

    if (normalized === "Interview") {
      return "🎤"
    }

    if (normalized === "Shortlisted") {
      return "⭐"
    }

    if (normalized === "Rejected") {
      return "❌"
    }

    if (normalized === "Withdrawn") {
      return "↩️"
    }

    return "🟡"
  }


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {

    if (!date) {
      return "Date not available"
    }

    try {

      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )

    } catch {

      return "Date not available"
    }
  }


  // =====================================================
  // APPLICATION STATISTICS
  // =====================================================

  const statistics = useMemo(() => {

    const stats = {
      total: applications.length,
      applied: 0,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
    }

    applications.forEach((application) => {

      const status =
        normalizeStatus(
          application.status
        )

      if (status === "Applied") {
        stats.applied++
      }

      if (status === "Shortlisted") {
        stats.shortlisted++
      }

      if (status === "Interview") {
        stats.interview++
      }

      if (status === "Offer") {
        stats.offer++
      }

      if (status === "Rejected") {
        stats.rejected++
      }

      if (status === "Withdrawn") {
        stats.withdrawn++
      }
    })

    return stats

  }, [applications])


  // =====================================================
  // FILTER APPLICATIONS
  // =====================================================

  const filteredApplications = useMemo(() => {

    const query =
      search
        .trim()
        .toLowerCase()

    return applications.filter(
      (application) => {

        const job =
          application.job ||
          application

        const title =
          String(
            job.title || ""
          ).toLowerCase()

        const company =
          String(
            job.company || ""
          ).toLowerCase()

        const status =
          normalizeStatus(
            application.status
          )

        const matchesSearch =
          !query ||
          title.includes(query) ||
          company.includes(query)

        const matchesStatus =
          statusFilter === "All" ||
          status === statusFilter

        return (
          matchesSearch &&
          matchesStatus
        )
      }
    )

  }, [
    applications,
    search,
    statusFilter,
  ])


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="space-y-6">

        <div>

          <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-200" />

        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          {[1, 2, 3, 4, 5, 6].map(
            (item) => (

              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl bg-gray-100"
              />

            )
          )}

        </div>


        <div className="grid gap-5">

          {[1, 2, 3].map(
            (item) => (

              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-gray-100"
              />

            )
          )}

        </div>

      </div>
    )
  }


  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">

        <div className="text-5xl">
          ⚠️
        </div>

        <h2 className="mt-4 text-xl font-bold text-red-800">
          Unable to Load Applications
        </h2>

        <p className="mt-2 text-red-600">
          {error}
        </p>

        <button
          onClick={fetchApplications}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>

      </div>
    )
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="space-y-6">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              📋
            </div>

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                Applications
              </h1>

              <p className="mt-1 text-gray-500">
                Track and manage your job applications.
              </p>

            </div>

          </div>

        </div>


        <div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">

          {applications.length}{" "}

          {applications.length === 1
            ? "Application"
            : "Applications"}

        </div>

      </div>


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

        {/* TOTAL */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <p className="text-sm font-medium text-gray-500">
            Total
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.total}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            All applications
          </p>

        </div>


        {/* APPLIED */}

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

          <p className="text-sm font-medium text-yellow-700">
            Applied
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-800">
            {statistics.applied}
          </p>

          <p className="mt-1 text-xs text-yellow-600">
            Awaiting response
          </p>

        </div>


        {/* SHORTLISTED */}

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

          <p className="text-sm font-medium text-blue-700">
            Shortlisted
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-800">
            {statistics.shortlisted}
          </p>

          <p className="mt-1 text-xs text-blue-600">
            Moving forward
          </p>

        </div>


        {/* INTERVIEW */}

        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">

          <p className="text-sm font-medium text-purple-700">
            Interviews
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-800">
            {statistics.interview}
          </p>

          <p className="mt-1 text-xs text-purple-600">
            Interview stage
          </p>

        </div>


        {/* OFFERS */}

        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

          <p className="text-sm font-medium text-green-700">
            Offers
          </p>

          <p className="mt-2 text-3xl font-bold text-green-800">
            {statistics.offer}
          </p>

          <p className="mt-1 text-xs text-green-600">
            Offers received
          </p>

        </div>


        {/* REJECTED */}

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

          <p className="text-sm font-medium text-red-700">
            Rejected
          </p>

          <p className="mt-2 text-3xl font-bold text-red-800">
            {statistics.rejected}
          </p>

          <p className="mt-1 text-xs text-red-600">
            Applications closed
          </p>

        </div>

      </div>


      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      {applications.length > 0 && (

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row">

            {/* SEARCH */}

            <div className="relative flex-1">

              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by job title or company..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>


            {/* STATUS FILTER */}

            <div className="flex items-center gap-3">

              <label className="whitespace-nowrap text-sm font-medium text-gray-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >

                <option value="All">
                  All
                </option>

                <option value="Applied">
                  Applied
                </option>

                <option value="Shortlisted">
                  Shortlisted
                </option>

                <option value="Interview">
                  Interview
                </option>

                <option value="Offer">
                  Offer
                </option>

                <option value="Rejected">
                  Rejected
                </option>

                <option value="Withdrawn">
                  Withdrawn
                </option>

              </select>

            </div>

          </div>


          {/* FILTER RESULT COUNT */}

          {(search || statusFilter !== "All") && (

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">

              <p className="text-sm text-gray-500">

                Showing{" "}

                <span className="font-semibold text-gray-800">
                  {filteredApplications.length}
                </span>{" "}

                of{" "}

                <span className="font-semibold text-gray-800">
                  {applications.length}
                </span>{" "}

                applications

              </p>


              <button
                onClick={() => {
                  setSearch("")
                  setStatusFilter("All")
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>

            </div>

          )}

        </div>

      )}


      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {applications.length === 0 && (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-5xl">
            📋
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            No Applications Yet
          </h2>

          <p className="mx-auto mt-3 max-w-md leading-6 text-gray-500">
            Once you apply to jobs, you can track
            their progress and update their status here.
          </p>

          <Link
            to="/app/jobs"
            className="mt-7 inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            🔎 Find Jobs
          </Link>

        </div>

      )}


      {/* =================================================
          FILTERED EMPTY STATE
      ================================================= */}

      {applications.length > 0 &&
        filteredApplications.length === 0 && (

          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
              🔍
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              No Matching Applications
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your search or status filter.
            </p>

            <button
              onClick={() => {
                setSearch("")
                setStatusFilter("All")
              }}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              Clear Filters
            </button>

          </div>

        )}


      {/* =================================================
          APPLICATION LIST
      ================================================= */}

      {filteredApplications.length > 0 && (

        <div className="grid gap-5">

          {filteredApplications.map(
            (application) => {

              // Backend may return job information
              // either directly or inside `job`.

              const job =
                application.job ||
                application

              const applicationId =
                application.id ||
                application.application_id

              const jobId =
                job.id ||
                application.job_id

              const title =
                job.title ||
                "Untitled Job"

              const company =
                job.company ||
                "Company not specified"

              const status =
                normalizeStatus(
                  application.status
                )


              return (

                <div
                  key={applicationId}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >

                  <div className="flex flex-col gap-6">


                    {/* =================================================
                        TOP SECTION
                    ================================================= */}

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">


                      {/* JOB */}

                      <div className="flex gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                          💼
                        </div>

                        <div>

                          <h2 className="text-xl font-bold text-gray-900">
                            {title}
                          </h2>

                          <p className="mt-1 font-medium text-gray-700">
                            {company}
                          </p>


                          <div className="mt-3 flex flex-wrap gap-2">

                            {job.location && (

                              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                                📍 {job.location}
                              </span>

                            )}


                            {job.work_mode && (

                              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                                💻 {job.work_mode}
                              </span>

                            )}


                            {job.employment_type && (

                              <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                                🧑‍💼 {job.employment_type}
                              </span>

                            )}

                          </div>

                        </div>

                      </div>


                      {/* STATUS */}

                      <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${getStatusStyle(status)}`}
                      >

                        {getStatusIcon(status)}

                        {status}

                      </div>

                    </div>


                    {/* =================================================
                        META INFORMATION
                    ================================================= */}

                    <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">


                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Applied
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          📅{" "}
                          {formatDate(
                            application.applied_at ||
                            application.created_at
                          )}
                        </p>

                      </div>


                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Source
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          🌐{" "}
                          {job.source ||
                            "Unknown"}
                        </p>

                      </div>


                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Application ID
                        </p>

                        <p className="mt-1 font-medium text-gray-700">
                          #{applicationId}
                        </p>

                      </div>

                    </div>


                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 lg:flex-row lg:items-center lg:justify-between">


                      {/* VIEW JOB */}

                      <div className="flex flex-wrap gap-3">

                        {jobId && (

                          <Link
                            to={`/app/jobs/${jobId}`}
                            className="rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            View Job
                          </Link>

                        )}


                        {job.application_url && (

                          <a
                            href={job.application_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
                          >
                            Open Application ↗
                          </a>

                        )}

                      </div>


                      {/* UPDATE STATUS */}

                      <div className="flex items-center gap-3">

                        <label className="text-sm font-medium text-gray-500">
                          Update Status
                        </label>

                        <select
                          value={status}
                          disabled={
                            updatingId ===
                            applicationId
                          }
                          onChange={(event) =>
                            updateStatus(
                              applicationId,
                              event.target.value
                            )
                          }
                          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                        >

                          <option value="Applied">
                            Applied
                          </option>

                          <option value="Shortlisted">
                            Shortlisted
                          </option>

                          <option value="Interview">
                            Interview
                          </option>

                          <option value="Offer">
                            Offer
                          </option>

                          <option value="Rejected">
                            Rejected
                          </option>

                          <option value="Withdrawn">
                            Withdrawn
                          </option>

                        </select>

                      </div>

                    </div>

                  </div>

                </div>

              )
            }
          )}

        </div>

      )}

    </div>
  )
}


export default Applications