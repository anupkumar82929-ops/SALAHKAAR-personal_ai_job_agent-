import { useEffect, useMemo, useState } from "react"
import apiClient from "../api/client"

function Profile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    headline: "",
    summary: "",
    years_of_experience: "",
    current_location: "",
    preferred_locations: "",
    preferred_work_mode: "Any",
    expected_salary_min: "",
    expected_salary_max: "",
  })

  // --------------------------------------------------
  // LOAD PROFILE
  // --------------------------------------------------

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await apiClient.get("/api/profile")

      const profile = response.data || {}

      let preferredLocations = ""

      if (Array.isArray(profile.preferred_locations)) {
        preferredLocations = profile.preferred_locations.join(", ")
      } else if (typeof profile.preferred_locations === "string") {
        preferredLocations = profile.preferred_locations
      }

      setForm({
        headline: profile.headline || "",
        summary: profile.summary || "",

        years_of_experience:
          profile.years_of_experience ?? "",

        current_location:
          profile.current_location || "",

        preferred_locations:
          preferredLocations,

        preferred_work_mode:
          profile.preferred_work_mode || "Any",

        expected_salary_min:
          profile.expected_salary_min ?? "",

        expected_salary_max:
          profile.expected_salary_max ?? "",
      })
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(
          err.response?.data?.detail ||
            "Unable to load your profile."
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------------
  // HANDLE INPUT
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setMessage("")
    setError("")
  }

  // --------------------------------------------------
  // WORK MODE
  // --------------------------------------------------

  const handleWorkModeChange = (mode) => {
    setForm((previous) => ({
      ...previous,
      preferred_work_mode: mode,
    }))

    setMessage("")
    setError("")
  }

  // --------------------------------------------------
  // SAVE PROFILE
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      setMessage("")
      setError("")

      // Validate salary
      const minSalary =
        form.expected_salary_min === ""
          ? null
          : Number(form.expected_salary_min)

      const maxSalary =
        form.expected_salary_max === ""
          ? null
          : Number(form.expected_salary_max)

      if (
        minSalary !== null &&
        maxSalary !== null &&
        minSalary > maxSalary
      ) {
        setError(
          "Minimum salary cannot be greater than maximum salary."
        )
        setSaving(false)
        return
      }

      // IMPORTANT:
      // preferred_locations MUST be a STRING.
      //
      // Example:
      // "pune"
      //
      // or:
      // "pune, bangalore, hyderabad"

      const payload = {
        headline: form.headline.trim(),

        summary: form.summary.trim(),

        years_of_experience:
          form.years_of_experience === ""
            ? 0
            : Number(form.years_of_experience),

        current_location:
          form.current_location.trim(),

        preferred_locations:
          form.preferred_locations.trim(),

        preferred_work_mode:
          form.preferred_work_mode,

        expected_salary_min:
          minSalary,

        expected_salary_max:
          maxSalary,
      }

      console.log("Saving profile:", payload)

      try {
        // First try UPDATE
        await apiClient.put(
          "/api/profile",
          payload
        )
      } catch (updateError) {
        // If profile doesn't exist, create it
        if (updateError.response?.status === 404) {
          await apiClient.post(
            "/api/profile",
            payload
          )
        } else {
          throw updateError
        }
      }

      // Update local state directly.
      // We intentionally DON'T call loadProfile()
      // immediately after saving.

      setForm({
        headline: payload.headline,

        summary: payload.summary,

        years_of_experience:
          payload.years_of_experience,

        current_location:
          payload.current_location,

        preferred_locations:
          payload.preferred_locations,

        preferred_work_mode:
          payload.preferred_work_mode,

        expected_salary_min:
          payload.expected_salary_min ?? "",

        expected_salary_max:
          payload.expected_salary_max ?? "",
      })

      setMessage(
        "Your profile has been updated successfully."
      )
    } catch (err) {
      console.error(
        "Profile save error:",
        err
      )

      const detail =
        err.response?.data?.detail

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) =>
              typeof item === "string"
                ? item
                : item.msg || "Invalid input"
            )
            .join(", ")
        )
      } else if (typeof detail === "string") {
        setError(detail)
      } else {
        setError(
          "Unable to save your profile."
        )
      }
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------
  // LOCATION TAGS
  // --------------------------------------------------

  const locations = useMemo(() => {
    if (
      typeof form.preferred_locations !==
      "string"
    ) {
      return []
    }

    return form.preferred_locations
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }, [form.preferred_locations])

  // --------------------------------------------------
  // PROFILE STRENGTH
  // --------------------------------------------------

  const profileStrength = useMemo(() => {
    const fields = [
      form.headline.trim(),
      form.summary.trim(),
      form.years_of_experience !== "",
      form.current_location.trim(),
      form.preferred_locations.trim(),
      form.preferred_work_mode !== "Any",
      form.expected_salary_min !== "",
      form.expected_salary_max !== "",
    ]

    const completed =
      fields.filter(Boolean).length

    return Math.round(
      (completed / fields.length) * 100
    )
  }, [form])

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-full bg-[#f7f7f5] p-6 lg:p-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">

          <div className="h-4 w-24 rounded bg-slate-200" />

          <div className="h-12 w-96 max-w-full rounded bg-slate-200" />

          <div className="h-5 w-80 rounded bg-slate-200" />

          <div className="rounded-3xl border border-slate-200 bg-white p-8">

            <div className="h-24 rounded bg-slate-100" />

            <div className="mt-8 grid gap-6 md:grid-cols-2">

              <div className="h-14 rounded bg-slate-100" />

              <div className="h-14 rounded bg-slate-100" />

            </div>

          </div>

        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="min-h-full bg-[#f7f7f5] text-slate-900">

      <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-10">

        {/* -----------------------------------------
            PAGE HEADER
        ------------------------------------------ */}

        <div className="mb-10">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Salahkaar / Profile
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-5xl">
            Your professional profile
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
            Tell Salahkaar where you are in your career
            and where you want to go. This information
            helps us personalize your job matches.
          </p>

        </div>

        {/* -----------------------------------------
            PROFILE STRENGTH
        ------------------------------------------ */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                Profile strength
              </p>

              <p className="mt-1 text-sm text-slate-500">
                A complete profile helps Salahkaar
                make better recommendations.
              </p>

            </div>

            <div className="flex items-center gap-4">

              <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-slate-950 transition-all duration-500"
                  style={{
                    width: `${profileStrength}%`,
                  }}
                />

              </div>

              <span className="text-sm font-semibold text-slate-900">
                {profileStrength}%
              </span>

            </div>

          </div>

        </div>

        {/* -----------------------------------------
            FORM
        ------------------------------------------ */}

        <form onSubmit={handleSubmit}>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">

            <div className="grid lg:grid-cols-2">

              {/* =====================================
                  LEFT SIDE
              ====================================== */}

              <div className="p-6 md:p-10">

                <div className="mb-8">

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    01 — Professional identity
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    What you do
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Keep this clear and focused on your
                    professional direction.
                  </p>

                </div>

                <div className="space-y-7">

                  {/* HEADLINE */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Professional headline
                    </label>

                    <input
                      type="text"
                      name="headline"
                      value={form.headline}
                      onChange={handleChange}
                      placeholder="Machine Learning Engineer"
                      className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-base outline-none transition placeholder:text-slate-300 focus:border-slate-950 focus:ring-0"
                    />

                  </div>

                  {/* SUMMARY */}

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      About
                    </label>

                    <textarea
                      name="summary"
                      value={form.summary}
                      onChange={handleChange}
                      rows={6}
                      placeholder="Briefly describe your professional background, strengths and career goals."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-0"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Keep it concise, specific and
                      focused on your professional strengths.
                    </p>

                  </div>

                  {/* EXPERIENCE */}

                  <div className="grid gap-6 md:grid-cols-2">

                    <div>

                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Experience
                      </label>

                      <div className="relative">

                        <input
                          type="number"
                          name="years_of_experience"
                          min="0"
                          step="1"
                          value={form.years_of_experience}
                          onChange={handleChange}
                          placeholder="0"
                          className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 pr-16 text-base outline-none transition placeholder:text-slate-300 focus:border-slate-950 focus:ring-0"
                        />

                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          years
                        </span>

                      </div>

                    </div>

                    {/* CURRENT LOCATION */}

                    <div>

                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Current location
                      </label>

                      <input
                        type="text"
                        name="current_location"
                        value={form.current_location}
                        onChange={handleChange}
                        placeholder="Delhi"
                        className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-3 text-base outline-none transition placeholder:text-slate-300 focus:border-slate-950 focus:ring-0"
                      />

                    </div>

                  </div>

                </div>

              </div>

              {/* =====================================
                  RIGHT SIDE
              ====================================== */}

              <div className="border-t border-slate-200 bg-[#fafaf9] p-6 md:p-10 lg:border-l lg:border-t-0">

                <div className="mb-8">

                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    02 — Preferences
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Where you want to go
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your preferences help determine which
                    opportunities are the best fit.
                  </p>

                </div>

                <div className="space-y-7">

                  {/* =================================
                      PREFERRED LOCATIONS
                  ================================== */}

                  <div>

                    <label className="mb-3 block text-sm font-medium text-slate-700">
                      Preferred locations
                    </label>

                    <input
                      type="text"
                      name="preferred_locations"
                      value={form.preferred_locations}
                      onChange={handleChange}
                      placeholder="Bengaluru, Hyderabad, Pune"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-0"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      Separate multiple locations with commas.
                    </p>

                    {locations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">

                        {locations.map(
                          (location, index) => (
                            <span
                              key={`${location}-${index}`}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                            >
                              {location}
                            </span>
                          )
                        )}

                      </div>
                    )}

                  </div>

                  {/* =================================
                      WORK MODE
                  ================================== */}

                  <div>

                    <label className="mb-3 block text-sm font-medium text-slate-700">
                      Work preference
                    </label>

                    <div className="grid grid-cols-2 gap-2">

                      {[
                        "Any",
                        "Remote",
                        "Hybrid",
                        "On-site",
                      ].map((mode) => (

                        <button
                          key={mode}
                          type="button"
                          onClick={() =>
                            handleWorkModeChange(mode)
                          }
                          className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                            form.preferred_work_mode ===
                            mode
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                          }`}
                        >
                          {mode}
                        </button>

                      ))}

                    </div>

                  </div>

                  {/* =================================
                      SALARY
                  ================================== */}

                  <div>

                    <label className="mb-3 block text-sm font-medium text-slate-700">
                      Expected salary
                    </label>

                    <div className="grid grid-cols-2 gap-3">

                      {/* MIN */}

                      <div className="relative">

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          ₹
                        </span>

                        <input
                          type="number"
                          name="expected_salary_min"
                          min="0"
                          value={form.expected_salary_min}
                          onChange={handleChange}
                          placeholder="Minimum"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-7 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-0"
                        />

                      </div>

                      {/* MAX */}

                      <div className="relative">

                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          ₹
                        </span>

                        <input
                          type="number"
                          name="expected_salary_max"
                          min="0"
                          value={form.expected_salary_max}
                          onChange={handleChange}
                          placeholder="Maximum"
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-7 pr-3 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-0"
                        />

                      </div>

                    </div>

                  </div>

                  {/* INFO */}

                  <div className="border-l-2 border-slate-950 pl-4">

                    <p className="text-sm leading-6 text-slate-500">
                      Salahkaar uses these preferences
                      together with your skills and resume
                      to improve job recommendations.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* =======================================
                FORM FOOTER
            ======================================== */}

            <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between md:px-10">

              <div className="min-h-[24px]">

                {error && (
                  <p className="text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}

                {!error && message && (
                  <p className="text-sm font-medium text-emerald-600">
                    {message}
                  </p>
                )}

              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>

            </div>

          </div>

        </form>

        {/* -----------------------------------------
            INFORMATION CARDS
        ------------------------------------------ */}

        <div className="mt-8 grid gap-5 md:grid-cols-3">

          {/* PROFILE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Profile
            </p>

            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
              Be clear about your direction
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              A focused headline and summary make it
              easier to understand your professional goals.
            </p>

          </div>

          {/* PREFERENCES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Preferences
            </p>

            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
              Tell us what fits you
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Location, work mode and salary expectations
              help narrow down relevant opportunities.
            </p>

          </div>

          {/* MATCHING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              Matching
            </p>

            <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
              Better matches
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your profile becomes one of the inputs used
              by Salahkaar's job matching system.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Profile