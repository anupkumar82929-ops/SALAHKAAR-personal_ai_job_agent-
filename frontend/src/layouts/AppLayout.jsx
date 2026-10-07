import { useState } from "react"
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom"

import { useAuth } from "../context/AuthContext"


const workspaceLinks = [
  {
    label: "Dashboard",
    path: "/app/dashboard",
  },
  {
    label: "Find jobs",
    path: "/app/jobs",
  },
  {
    label: "AI matches",
    path: "/app/recommendations",
  },
]


const careerLinks = [
  {
    label: "Saved jobs",
    path: "/app/saved",
  },
  {
    label: "Applications",
    path: "/app/applications",
  },
  {
    label: "Resume",
    path: "/app/resume",
  },
]


const personalLinks = [
  {
    label: "Assistant",
    path: "/app/assistant",
  },
  {
    label: "Profile",
    path: "/app/profile",
  },
]


function Logo() {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950">

        <div className="relative h-5 w-5 rounded-full border-2 border-white">

          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />

        </div>

      </div>


      <div>

        <div className="text-lg font-semibold tracking-tight text-slate-950">
          Salahkaar
        </div>

        <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Career intelligence
        </div>

      </div>

    </div>
  )
}


function NavItem({ label, path, onClick }) {
  return (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition",
          isActive
            ? "bg-slate-950 text-white"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  )
}


function Navigation({
  onNavigate,
}) {
  return (
    <div className="space-y-7">

      <div>

        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">

          {workspaceLinks.map((item) => (
            <NavItem
              key={item.path}
              label={item.label}
              path={item.path}
              onClick={onNavigate}
            />
          ))}

        </nav>

      </div>


      <div>

        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Your career
        </p>

        <nav className="space-y-1">

          {careerLinks.map((item) => (
            <NavItem
              key={item.path}
              label={item.label}
              path={item.path}
              onClick={onNavigate}
            />
          ))}

        </nav>

      </div>


      <div>

        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Personal
        </p>

        <nav className="space-y-1">

          {personalLinks.map((item) => (
            <NavItem
              key={item.path}
              label={item.label}
              path={item.path}
              onClick={onNavigate}
            />
          ))}

        </nav>

      </div>

    </div>
  )
}


/*
|--------------------------------------------------------------------------
| IMPORTANT
|--------------------------------------------------------------------------
| This is intentionally written as:
|
| export default function AppLayout()
|
| Therefore App.jsx can safely use:
|
| import AppLayout from "./layouts/AppLayout"
|
*/

export default function AppLayout() {

  const navigate = useNavigate()

  const { user, logout } = useAuth()

  const [mobileOpen, setMobileOpen] = useState(false)


  const handleLogout = () => {

    logout()

    navigate("/login")

  }


  const email =
    user?.email ||
    user?.username ||
    "Your account"


  const initials =
    email
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase()


  const Sidebar = () => (
    <div className="flex h-full flex-col bg-white">

      {/* LOGO */}

      <div className="border-b border-slate-200 px-5 py-5">

        <Logo />

      </div>


      {/* NAVIGATION */}

      <div className="flex-1 overflow-y-auto px-3 py-6">

        <Navigation
          onNavigate={() =>
            setMobileOpen(false)
          }
        />

      </div>


      {/* ACCOUNT */}

      <div className="border-t border-slate-200 p-4">

        <div className="mb-3 flex items-center gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
            {initials}
          </div>


          <div className="min-w-0">

            <p className="truncate text-sm font-medium text-slate-800">
              {email}
            </p>

            <p className="text-xs text-slate-400">
              Personal workspace
            </p>

          </div>

        </div>


        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          Sign out
        </button>

      </div>

    </div>
  )


  return (
    <div className="min-h-screen bg-[#f7f7f5]">

      {/* DESKTOP SIDEBAR */}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-slate-200 lg:block">

        <Sidebar />

      </aside>


      {/* MOBILE HEADER */}

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">

        <Logo />

        <button
          type="button"
          onClick={() =>
            setMobileOpen(true)
          }
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
        >
          Menu
        </button>

      </header>


      {/* MOBILE SIDEBAR */}

      {mobileOpen && (

        <div className="fixed inset-0 z-50 lg:hidden">

          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
          />


          <aside className="relative h-full w-[280px]">

            <button
              type="button"
              onClick={() =>
                setMobileOpen(false)
              }
              className="absolute right-3 top-3 z-10 rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-500"
            >
              ×
            </button>

            <Sidebar />

          </aside>

        </div>

      )}


      {/* MAIN */}

      <main className="min-h-screen lg:ml-[250px]">

        <Outlet />

      </main>

    </div>
  )
}