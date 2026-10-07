import axios from "axios"

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("salahkaar_token")

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

    return config
  },
  (error) =>
    Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes(
        "/api/auth/login"
      )
    ) {
      localStorage.removeItem(
        "salahkaar_token"
      )

      localStorage.removeItem(
        "salahkaar_user"
      )

      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default apiClient