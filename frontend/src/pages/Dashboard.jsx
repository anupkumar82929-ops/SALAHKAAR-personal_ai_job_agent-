import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import apiClient from "../api/client"
import { useAuth } from "../context/AuthContext"


function Dashboard() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [jobs, setJobs] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [profile, setProfile] = useState(null)
  const [resumes, setResumes] = useState([])

  const [error, setError] = useState("")


  const loadDashboard = async () => {
    try {
      setError("")

      const [
        jobsResponse,
        recommendationsResponse,
        savedResponse,
        applicationsResponse,
        profileResponse,
        resumeResponse,
      ] = await Promise.allSettled([
        apiClient.get("/api/jobs", {
          params: {
            limit: 10,
            offset: 0,
          },
        }),

        apiClient.get("/api/recommendations", {
          params: {
            limit: 5,
          },
        }),

        apiClient.get("/api/saved-jobs"),

        apiClient.get("/api/applications"),

        apiClient.get("/api/profile"),

        apiClient.get("/api/resume"),
      ])


      if (
        jobsResponse.status === "fulfilled"
      ) {
        setJobs(
          jobsResponse.value.data?.jobs || []
        )
      }


      if (
        recommendationsResponse.status === "fulfilled"
      ) {
        setRecommendations(
          recommendationsResponse.value.data
            ?.recommendations || []
        )
      }


      if (
        savedResponse.status === "fulfilled"
      ) {
        setSavedJobs(
          savedResponse.value.data?.saved_jobs || []
        )
      }


      if (
        applicationsResponse.status === "fulfilled"
      ) {
        setApplications(
          applicationsResponse.value.data
            ?.applications || []
        )
      }


      if (
        profileResponse.status === "fulfilled"
      ) {
        setProfile(
          profileResponse.value.data || null
        )
      }


      if (
        resumeResponse.status === "fulfilled"
      ) {
        setResumes(
          resumeResponse.value.data?.resumes || []
        )
      }


      const failedRequests = [
        jobsResponse,
        recommendationsResponse,
        savedResponse,
        applicationsResponse,
        profileResponse,
        resumeResponse,
      ].filter(
        (item) => item.status === "rejected"
      )


      if (
        failedRequests.length === 6
      ) {
        setError(
          "Unable to load your dashboard data."
        )
      }

    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      )

      setError(
        "Unable to load your dashboard."
      )

    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  useEffect(() => {
    loadDashboard()
  }, [])


  const refreshDashboard = async () => {
    setRefreshing(true)
    await loadDashboard()
  }


  const displayName = useMemo(() => {

    const rawName =
      user?.name ||
      user?.full_name ||
      user?.email?.split("@")[0] ||
      "there"


    return rawName
      .split(/[._-]/)
      .filter(Boolean)
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1)
      )
      .join(" ")

  }, [user])


  const greeting = useMemo(() => {

    const hour =
      new Date().getHours()

    if (hour < 12) {
      return "Good morning"
    }

    if (hour < 17) {
      return "Good afternoon"
    }

    return "Good evening"

  }, [])


  const primaryResume = useMemo(() => {

    return (
      resumes.find(
        (resume) =>
          resume.is_primary
      ) ||
      resumes[0] ||
      null
    )

  }, [resumes])


  const profileStrength = useMemo(() => {

    if (!profile) {
      return 0
    }


    const fields = [
      Boolean(profile.headline),
      Boolean(profile.summary),
      profile.years_of_experience !== null &&
        profile.years_of_experience !== undefined,
      Boolean(profile.current_location),
      Array.isArray(profile.preferred_locations)
        ? profile.preferred_locations.length > 0
        : Boolean(profile.preferred_locations),
      Boolean(profile.preferred_work_mode),
      profile.expected_salary_min !== null &&
        profile.expected_salary_min !== undefined,
      profile.expected_salary_max !== null &&
        profile.expected_salary_max !== undefined,
    ]


    const completed =
      fields.filter(Boolean).length


    return Math.round(
      (completed / fields.length) * 100
    )

  }, [profile])


  const topRecommendations =
    recommendations.slice(0, 3)


  const recentApplications =
    [...applications]
      .sort(
        (a, b) =>
          new Date(
            b.applied_at ||
            b.created_at ||
            0
          ) -
          new Date(
            a.applied_at ||
            a.created_at ||
            0
          )
      )
      .slice(0, 3)


  const formatDate = (value) => {

    if (!value) {
      return "Recently"
    }

    try {

      return new Date(
        value
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      )

    } catch {

      return "Recently"

    }
  }


  const getMatchScore = (item) => {

    const score =
      item?.match?.score ??
      item?.match_score ??
      0


    return Math.round(
      Number(score)
    )

  }


  const getJobFromRecommendation = (
    item
  ) => {

    return (
      item?.job ||
      item ||
      {}
    )

  }


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5]">

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10">

          <div className="animate-pulse space-y-8">

            <div>
              <div className="h-3 w-24 rounded bg-slate-200" />

              <div className="mt-4 h-12 w-96 max-w-full rounded bg-slate-200" />

              <div className="mt-3 h-5 w-[30rem] max-w-full rounded bg-slate-200" />
            </div>


            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {[1, 2, 3, 4].map(
                (item) => (
                  <div
                    key={item}
                    className="h-32 rounded-2xl bg-slate-200"
                  />
                )
              )}

            </div>


            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">

              <div className="h-96 rounded-3xl bg-slate-200" />

              <div className="h-96 rounded-3xl bg-slate-200" />

            </div>

          </div>

        </div>

      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900">

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

            <div>

              <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">

                <span className="h-px w-8 bg-slate-400" />

                Your career workspace

              </div>


              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-5xl">

                {greeting},{" "}

                <span className="text-slate-400">
                  {displayName}.
                </span>

              </h1>


              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-500">

                Find relevant opportunities, understand
                your fit, and keep your application journey
                organized in one place.

              </p>

            </div>


            <button
              type="button"
              onClick={refreshDashboard}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh workspace"}
            </button>

          </div>

        </section>


        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <p className="text-sm font-medium text-red-700">
              {error}
            </p>

          </div>
        )}


        {/* =====================================================
            METRICS
        ====================================================== */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            label="Jobs available"
            value={jobs.length}
            description="Latest opportunities"
            href="/app/jobs"
          />

          <MetricCard
            label="AI matches"
            value={recommendations.length}
            description="Personalized recommendations"
            href="/app/recommendations"
          />

          <MetricCard
            label="Saved jobs"
            value={savedJobs.length}
            description="Your shortlist"
            href="/app/saved"
          />

          <MetricCard
            label="Applications"
            value={applications.length}
            description="Tracked applications"
            href="/app/applications"
          />

        </section>


        {/* =====================================================
            MAIN GRID
        ====================================================== */}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">

          {/* AI MATCHES */}

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">

            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-7 sm:flex-row sm:items-end">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Recommended for you
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
                  Stronger matches.
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Opportunities ranked against your current
                  skills and profile.
                </p>

              </div>


              <Link
                to="/app/recommendations"
                className="text-sm font-semibold text-slate-950 hover:underline"
              >
                View all matches →
              </Link>

            </div>


            <div className="divide-y divide-slate-100">

              {topRecommendations.length === 0 && (
                <div className="p-8">

                  <p className="text-sm font-medium text-slate-700">
                    Your personalized matches will appear here.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Complete your profile and resume to improve
                    matching quality.
                  </p>

                  <Link
                    to="/app/profile"
                    className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Complete profile
                  </Link>

                </div>
              )}


              {topRecommendations.map(
                (item, index) => {

                  const job =
                    getJobFromRecommendation(
                      item
                    )

                  const score =
                    getMatchScore(item)


                  return (
                    <div
                      key={
                        job.id ||
                        `${job.title}-${index}`
                      }
                      className="p-6 transition hover:bg-slate-50"
                    >

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0">

                          <div className="flex items-start gap-4">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                              {(job.company ||
                                "S")
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>


                            <div className="min-w-0">

                              <Link
                                to={`/app/jobs/${job.id}`}
                                className="block truncate text-lg font-semibold tracking-[-0.02em] text-slate-950 hover:underline"
                              >
                                {job.title ||
                                  "Untitled position"}
                              </Link>

                              <p className="mt-1 text-sm text-slate-500">
                                {job.company ||
                                  "Company not specified"}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">

                                {job.location && (
                                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    {job.location}
                                  </span>
                                )}

                                {job.work_mode && (
                                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    {job.work_mode}
                                  </span>
                                )}

                              </div>

                            </div>

                          </div>

                        </div>


                        <div className="shrink-0 text-left sm:text-right">

                          <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                            {score}%
                          </p>

                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                            match
                          </p>

                        </div>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          </div>


          {/* PROFILE / RESUME */}

          <div className="space-y-6">

            <div className="rounded-[28px] border border-slate-200 bg-white p-7">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Profile readiness
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    {profileStrength}% complete
                  </h2>

                </div>


                <Link
                  to="/app/profile"
                  className="text-sm font-semibold text-slate-950 hover:underline"
                >
                  Edit
                </Link>

              </div>


              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-slate-950 transition-all"
                  style={{
                    width: `${profileStrength}%`,
                  }}
                />

              </div>


              <p className="mt-4 text-sm leading-6 text-slate-500">

                {profileStrength >= 80
                  ? "Your profile is in good shape for matching."
                  : "Complete more profile details to improve your matches."}

              </p>

            </div>


            <div className="rounded-[28px] bg-slate-950 p-7 text-white">

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Resume
              </p>


              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                {primaryResume
                  ? "Resume connected"
                  : "Resume not connected"}
              </h2>


              <p className="mt-3 text-sm leading-6 text-slate-400">

                {primaryResume?.file_name ||
                  "Upload a resume to strengthen your profile and job matching."}

              </p>


              <Link
                to="/app/resume"
                className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"
              >
                {primaryResume
                  ? "Manage resume"
                  : "Upload resume"}
              </Link>

            </div>

          </div>

        </section>


        {/* =====================================================
            LOWER SECTION
        ====================================================== */}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">

          {/* RECENT APPLICATIONS */}

          <div className="rounded-[28px] border border-slate-200 bg-white">

            <div className="flex items-end justify-between border-b border-slate-100 p-7">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Application activity
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  Recent applications
                </h2>

              </div>


              <Link
                to="/app/applications"
                className="text-sm font-semibold text-slate-950 hover:underline"
              >
                View all →
              </Link>

            </div>


            <div className="divide-y divide-slate-100">

              {recentApplications.length === 0 && (
                <div className="p-7">

                  <p className="text-sm font-medium text-slate-700">
                    No applications tracked yet.
                  </p>

                  <Link
                    to="/app/jobs"
                    className="mt-4 inline-flex text-sm font-semibold text-slate-950 hover:underline"
                  >
                    Start exploring jobs →
                  </Link>

                </div>
              )}


              {recentApplications.map(
                (application, index) => {

                  const job =
                    application.job ||
                    application


                  const jobId =
                    job.id ||
                    application.job_id


                  return (
                    <div
                      key={
                        application.id ||
                        application.application_id ||
                        index
                      }
                      className="flex items-center justify-between gap-5 p-6"
                    >

                      <div className="min-w-0">

                        <Link
                          to={`/app/jobs/${jobId}`}
                          className="block truncate text-sm font-semibold text-slate-950 hover:underline"
                        >
                          {job.title ||
                            "Untitled position"}
                        </Link>

                        <p className="mt-1 text-xs text-slate-500">
                          {job.company ||
                            "Company not specified"}
                        </p>

                      </div>


                      <div className="shrink-0 text-right">

                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {application.status ||
                            "Applied"}
                        </span>

                        <p className="mt-2 text-[11px] text-slate-400">
                          {formatDate(
                            application.applied_at ||
                            application.created_at
                          )}
                        </p>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          </div>


          {/* QUICK ACTIONS */}

          <div className="rounded-[28px] border border-slate-200 bg-white p-7">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Keep moving
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Next useful step
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use your workspace intentionally instead of
              searching everywhere at once.
            </p>


            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <QuickAction
                title="Find jobs"
                description="Explore fresh opportunities"
                href="/app/jobs"
              />

              <QuickAction
                title="AI matches"
                description="Review your strongest fits"
                href="/app/recommendations"
              />

              <QuickAction
                title="Resume"
                description="Improve your resume data"
                href="/app/resume"
              />

              <QuickAction
                title="Assistant"
                description="Get career guidance"
                href="/app/assistant"
              />

            </div>

          </div>

        </section>


        {/* =====================================================
            FOOTER NOTE
        ====================================================== */}

        <section className="mt-8 border-t border-slate-200 pt-6">

          <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">

            <p>
              Salahkaar · Your personal career intelligence workspace
            </p>

            <p>
              Discover better. Prepare smarter. Move forward.
            </p>

          </div>

        </section>

      </div>

    </div>
  )
}


/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  label,
  value,
  description,
  href,
}) {
  return (
    <Link
      to={href}
      className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-slate-300"
    >

      <div className="flex items-start justify-between">

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>

        <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600">
          →
        </span>

      </div>


      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>

    </Link>
  )
}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  title,
  description,
  href,
}) {
  return (
    <Link
      to={href}
      className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50"
    >

      <div className="flex items-center justify-between">

        <h3 className="text-sm font-semibold text-slate-950">
          {title}
        </h3>

        <span className="text-slate-400">
          →
        </span>

      </div>


      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </Link>
  )
}


export default Dashboard