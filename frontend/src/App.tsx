import { useSyncExternalStore } from 'react'
import LoginPage from './pages/LoginPage'
import './App.css'

function subscribeToPath(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

function getPathname() {
  return window.location.pathname
}

function App() {
  const pathname = useSyncExternalStore(subscribeToPath, getPathname, () => '/')

  if (pathname === '/login') {
    return <LoginPage />
  }

  return <HomePage />
}

function HomePage() {
  return (
    <main className="page">
      <p className="eyebrow">retention-ai</p>
      <h1>Frontend</h1>
      <p className="lede">
        <a href="/login">Anmelden</a>
      </p>
    </main>
  )
}

export default App
