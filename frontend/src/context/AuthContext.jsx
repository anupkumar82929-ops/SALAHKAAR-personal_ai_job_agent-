import {
  createContext,
  useContext,
  useState,
} from "react"


const AuthContext = createContext(null)

const TOKEN_KEY = "salahkaar_token"
const USER_KEY = "salahkaar_user"


function getStoredUser() {
  const value = localStorage.getItem(USER_KEY)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}


export function AuthProvider({ children }) {

  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY)
  )

  const [user, setUser] = useState(() =>
    getStoredUser()
  )


  const login = async (authResponse) => {

    console.log(
      "LOGIN RESPONSE:",
      authResponse
    )


    /*
     * Support all common backend response shapes.
     */

    let accessToken = null

    let loggedInUser = null


    if (typeof authResponse === "string") {

      accessToken = authResponse

    } else {

      accessToken =
        authResponse?.access_token ||
        authResponse?.accessToken ||
        authResponse?.token ||
        authResponse?.data?.access_token ||
        authResponse?.data?.token ||
        null


      loggedInUser =
        authResponse?.user ||
        authResponse?.profile ||
        authResponse?.data?.user ||
        null

    }


    /*
     * Some backends return the user directly.
     */

    if (
      !loggedInUser &&
      authResponse &&
      typeof authResponse === "object"
    ) {

      if (
        authResponse.email ||
        authResponse.username ||
        authResponse.id
      ) {
        loggedInUser = authResponse
      }

    }


    if (!accessToken) {

      console.error(
        "No authentication token returned by backend:",
        authResponse
      )

      throw new Error(
        "Login succeeded, but the server did not return an authentication token."
      )

    }


    /*
     * Store session.
     */

    localStorage.setItem(
      TOKEN_KEY,
      String(accessToken)
    )


    setToken(
      String(accessToken)
    )


    if (loggedInUser) {

      localStorage.setItem(
        USER_KEY,
        JSON.stringify(loggedInUser)
      )

      setUser(loggedInUser)

    }


    return {
      token: accessToken,
      user: loggedInUser,
    }

  }


  const logout = () => {

    localStorage.removeItem(
      TOKEN_KEY
    )

    localStorage.removeItem(
      USER_KEY
    )

    setToken(null)

    setUser(null)

  }


  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: Boolean(token),
    loading: false,
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {

  const context =
    useContext(AuthContext)


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider."
    )

  }


  return context
}


export default AuthContext