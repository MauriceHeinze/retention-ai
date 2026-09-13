const SESSION_KEY = 'retention-ai:session'

type Listener = () => void

const listeners = new Set<Listener>()

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

let session: string | null = readSession()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeToSession(onStoreChange: Listener) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getSession() {
  return session
}

export function login(email: string) {
  session = email
  sessionStorage.setItem(SESSION_KEY, email)
  emit()
}

export function logout() {
  session = null
  sessionStorage.removeItem(SESSION_KEY)
  emit()
}
