const TOKEN_KEY = 'hospital_access_token'
const REFRESH_TOKEN_KEY = 'hospital_refresh_token'
const USER_KEY = 'hospital_user_info'
const PERMISSIONS_KEY = 'hospital_permissions'
const REMEMBER_KEY = 'hospital_remember_username'
const USERNAME_KEY = 'hospital_username'

export const storage = {
  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY)
    return token && token !== 'undefined' ? token : null
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  getRefreshToken(): string | null {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY)
    return token && token !== 'undefined' ? token : null
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  removeRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  getUser(): any | null {
    try {
      const user = localStorage.getItem(USER_KEY)
      return user && user !== 'undefined' ? JSON.parse(user) : null
    } catch {
      return null
    }
  },

  setUser(user: any): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY)
  },

  getPermissions(): string[] {
    try {
      const perms = localStorage.getItem(PERMISSIONS_KEY)
      return perms && perms !== 'undefined' ? JSON.parse(perms) : []
    } catch {
      return []
    }
  },

  setPermissions(permissions: string[]): void {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
  },

  removePermissions(): void {
    localStorage.removeItem(PERMISSIONS_KEY)
  },

  getRememberUsername(): string {
    return localStorage.getItem(REMEMBER_KEY) || ''
  },

  setRememberUsername(username: string): void {
    localStorage.setItem(REMEMBER_KEY, username)
  },

  getSavedUsername(): string {
    return localStorage.getItem(USERNAME_KEY) || ''
  },

  setSavedUsername(username: string): void {
    localStorage.setItem(USERNAME_KEY, username)
  },

  clearAll(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PERMISSIONS_KEY)
  }
}
