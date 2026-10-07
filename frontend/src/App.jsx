import { Routes, Route, Navigate } from "react-router-dom"

import Login from "./pages/Login"
import Register from "./pages/Register"

import AppLayout from "./layouts/AppLayout"

import Dashboard from "./pages/Dashboard"
import Jobs from "./pages/Jobs"
import JobDetails from "./pages/JobDetails"
import JobAnalysis from "./pages/JobAnalysis"
import Recommendations from "./pages/Recommendations"
import SavedJobs from "./pages/SavedJobs"
import Applications from "./pages/Applications"
import Assistant from "./pages/Assistant"
import Profile from "./pages/Profile"
import Resume from "./pages/Resume"


function App() {
  return (
    <Routes>

      {/* =========================
          PUBLIC ROUTES
      ========================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =========================
          APPLICATION
      ========================== */}

      <Route
        path="/app"
        element={<AppLayout />}
      >

        <Route
          index
          element={
            <Navigate
              to="/app/dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="jobs"
          element={<Jobs />}
        />

        <Route
          path="jobs/:jobId"
          element={<JobDetails />}
        />

        <Route
          path="jobs/:jobId/analysis"
          element={<JobAnalysis />}
        />

        <Route
          path="recommendations"
          element={<Recommendations />}
        />

        <Route
          path="saved"
          element={<SavedJobs />}
        />

        <Route
          path="applications"
          element={<Applications />}
        />

        <Route
          path="assistant"
          element={<Assistant />}
        />

        <Route
          path="profile"
          element={<Profile />}
        />

        <Route
          path="resume"
          element={<Resume />}
        />

      </Route>


      {/* =========================
          FALLBACK
      ========================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  )
}


export default App