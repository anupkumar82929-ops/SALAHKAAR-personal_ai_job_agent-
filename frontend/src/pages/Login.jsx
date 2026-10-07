import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "../api/client"
import { useAuth } from "../context/AuthContext"


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


function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")


  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    setError("")
  }


  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await apiClient.post(
        "/api/auth/login",
        {
          email: form.email.trim(),
          password: form.password,
        }
      )

     const data = response.data

      await login(data)

      console.log(
      "Authentication stored successfully."
      )

      navigate(
        "/app/dashboard",
        {
          replace: true,
        }
      )

    } catch (err) {
      console.error("Login failed:", err)

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
            "Unable to sign in. Please check your credentials."
        )
      }

    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900">

      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

        {/* =================================================
            LEFT — BRAND
        ================================================== */}

        <div className="relative hidden overflow-hidden bg-slate-950 lg:flex">

          <div className="absolute inset-0">

            <div className="absolute -left-24 top-24 h-72 w-72 rounded-full border border-slate-800" />

            <div className="absolute -left-12 top-36 h-48 w-48 rounded-full border border-slate-800" />

            <div className="absolute bottom-[-120px] right-[-80px] h-96 w-96 rounded-full border border-slate-800" />

          </div>


          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">

            <SalahkaarLogoWhite />


            <div className="max-w-xl">

              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Your career workspace
              </p>

              <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white xl:text-6xl">
                Find the work
                <br />
                <span className="text-slate-500">
                  that fits you.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-[15px] leading-7 text-slate-400">
                Salahkaar brings your resume, preferences,
                opportunities and applications together in
                one focused career workspace.
              </p>


              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">

                <BrandStat
                  number="01"
                  text="Build"
                />

                <BrandStat
                  number="02"
                  text="Discover"
                />

                <BrandStat
                  number="03"
                  text="Move"
                />

              </div>

            </div>


            <p className="text-xs text-slate-600">
              Built for people who are serious about their next move.
            </p>

          </div>

        </div>


        {/* =================================================
            RIGHT — LOGIN
        ================================================== */}

        <div className="flex min-h-screen flex-col">

          {/* MOBILE HEADER */}

          <div className="p-6 lg:hidden">
            <SalahkaarLogo />
          </div>


          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16">

            <div className="w-full max-w-md">

              {/* MOBILE INTRO */}

              <div className="mb-10 lg:hidden">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Career workspace
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                  Welcome back.
                </h1>

              </div>


              {/* DESKTOP INTRO */}

              <div className="hidden lg:block">

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Welcome back
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                  Continue your
                  <br />
                  career journey.
                </h1>

                <p className="mt-4 text-[15px] leading-7 text-slate-500">
                  Sign in to access your opportunities,
                  applications and personalized matches.
                </p>

              </div>


              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="mt-10"
              >

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-0"
                  />

                </div>


                {/* PASSWORD */}

                <div className="mt-6">

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-medium text-slate-400"
                      onClick={() =>
                        setError(
                          "Password reset is not available yet."
                        )
                      }
                    >
                      Forgot password?
                    </button>

                  </div>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-500 focus:ring-0"
                  />

                </div>


                {/* ERROR */}

                <div className="min-h-[48px] pt-4">

                  {error && (
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">

                      <p className="text-sm leading-5 text-red-600">
                        {error}
                      </p>

                    </div>
                  )}

                </div>


                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign in"}
                </button>

              </form>


              {/* REGISTER */}

              <div className="mt-8 border-t border-slate-200 pt-7 text-center">

                <p className="text-sm text-slate-500">

                  Don't have a Salahkaar account?

                  <Link
                    to="/register"
                    className="ml-1 font-semibold text-slate-950 hover:underline"
                  >
                    Create one
                  </Link>

                </p>

              </div>


              {/* FOOTER */}

              <p className="mt-10 text-center text-xs leading-5 text-slate-400">
                By continuing, you agree to use Salahkaar
                responsibly as your personal career workspace.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}


/* =====================================================
   BRAND STAT
===================================================== */

function BrandStat({ number, text }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">

      <p className="text-xs font-semibold text-slate-600">
        {number}
      </p>

      <p className="mt-3 text-sm font-medium text-slate-300">
        {text}
      </p>

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


export default Login