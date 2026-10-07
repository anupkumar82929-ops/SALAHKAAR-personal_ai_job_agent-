import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "../api/client"


function SalahkaarLogo() {
  return (
    <div className="flex items-center gap-3">

      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950">

        <span className="absolute h-5 w-5 rounded-full border-2 border-white" />

        <span className="absolute h-2 w-2 rounded-full bg-white" />

      </div>

      <div>

        <p className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Salahkaar
        </p>

        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
          Career intelligence
        </p>

      </div>

    </div>
  )
}


function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")


  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError("")
    setSuccess("")
  }


  const handleSubmit = async (event) => {
    event.preventDefault()

    const email = form.email.trim()
    const password = form.password
    const confirmPassword =
      form.confirmPassword

    if (!email || !password || !confirmPassword) {
      setError(
        "Please complete all required fields."
      )
      return
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      )
      return
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      )
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      await apiClient.post(
        "/api/auth/register",
        {
          email,
          password,
        }
      )

      setSuccess(
        "Account created successfully. Redirecting to sign in..."
      )

      setTimeout(() => {
        navigate("/login")
      }, 900)

    } catch (err) {
      console.error(
        "Registration failed:",
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
            "Unable to create your account."
        )
      }

    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900">

      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">

        {/* =================================================
            LEFT — REGISTER
        ================================================== */}

        <div className="order-2 flex min-h-screen flex-col lg:order-1">

          {/* MOBILE LOGO */}

          <div className="p-6 lg:hidden">
            <SalahkaarLogo />
          </div>


          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16">

            <div className="w-full max-w-md">

              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Start your workspace
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                Build your
                <br />
                career workspace.
              </h1>

              <p className="mt-4 text-[15px] leading-7 text-slate-500">
                Create your account and bring your resume,
                preferences, opportunities and applications
                into one place.
              </p>


              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="mt-10"
              >

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="register-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-0"
                  />

                </div>


                {/* PASSWORD */}

                <div className="mt-5">

                  <label
                    htmlFor="register-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-0"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Use at least 6 characters.
                  </p>

                </div>


                {/* CONFIRM */}

                <div className="mt-5">

                  <label
                    htmlFor="register-confirm-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>

                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter your password again"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-0"
                  />

                </div>


                {/* MESSAGE */}

                <div className="min-h-[48px] pt-4">

                  {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">

                      <p className="text-sm text-red-600">
                        {error}
                      </p>

                    </div>
                  )}

                  {success && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">

                      <p className="text-sm text-emerald-700">
                        {success}
                      </p>

                    </div>
                  )}

                </div>


                {/* CREATE */}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Creating account..."
                    : "Create account"}
                </button>

              </form>


              {/* LOGIN */}

              <div className="mt-8 border-t border-slate-200 pt-7 text-center">

                <p className="text-sm text-slate-500">

                  Already have an account?

                  <Link
                    to="/login"
                    className="ml-1 font-semibold text-slate-950 hover:underline"
                  >
                    Sign in
                  </Link>

                </p>

              </div>

            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT — BRAND
        ================================================== */}

        <div className="relative order-1 hidden overflow-hidden bg-slate-950 lg:order-2 lg:flex">

          <div className="absolute inset-0">

            <div className="absolute right-[-80px] top-[-80px] h-80 w-80 rounded-full border border-slate-800" />

            <div className="absolute right-[-30px] top-[-30px] h-60 w-60 rounded-full border border-slate-800" />

            <div className="absolute bottom-[-100px] left-[-100px] h-96 w-96 rounded-full border border-slate-800" />

          </div>


          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">

            <SalahkaarLogoWhite />


            <div className="max-w-xl">

              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                One place for your next move
              </p>

              <h2 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white xl:text-6xl">

                Your profile.
                <br />

                <span className="text-slate-500">
                  Your opportunities.
                </span>

                <br />

                Your direction.

              </h2>


              <p className="mt-7 max-w-lg text-[15px] leading-7 text-slate-400">
                Keep your career information organized,
                understand your fit for opportunities and
                track your applications without losing sight
                of the bigger picture.
              </p>


              <div className="mt-10 space-y-3">

                <Feature
                  number="01"
                  title="Build your profile"
                  text="Create a stronger professional identity."
                />

                <Feature
                  number="02"
                  title="Discover opportunities"
                  text="Find roles aligned with your profile."
                />

                <Feature
                  number="03"
                  title="Move with confidence"
                  text="Understand your fit before you apply."
                />

              </div>

            </div>


            <p className="text-xs text-slate-600">
              Salahkaar — a focused workspace for your career.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}


/* =====================================================
   FEATURE
===================================================== */

function Feature({
  number,
  title,
  text,
}) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-800 pb-3">

      <span className="text-xs font-semibold text-slate-600">
        {number}
      </span>

      <div>

        <p className="text-sm font-medium text-slate-300">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-600">
          {text}
        </p>

      </div>

    </div>
  )
}


/* =====================================================
   WHITE LOGO
===================================================== */

function SalahkaarLogoWhite() {
  return (
    <div className="flex items-center gap-3">

      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">

        <span className="absolute h-5 w-5 rounded-full border-2 border-white" />

        <span className="absolute h-2 w-2 rounded-full bg-white" />

      </div>

      <div>

        <p className="text-xl font-semibold tracking-[-0.04em] text-white">
          Salahkaar
        </p>

        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
          Career intelligence
        </p>

      </div>

    </div>
  )
}


export default Register