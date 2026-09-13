import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { login } from '@/lib/auth'
import { navigate } from '@/lib/navigate'

type FieldErrors = {
  email?: string
  password?: string
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  if (!email.trim()) {
    errors.email = 'Enter an email address.'
  } else if (!email.includes('@')) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Enter a password.'
  }

  return errors
}

export default function LoginPage({ redirectTo = '/' }: { redirectTo?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(email, password)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    login(email.trim())
    navigate(redirectTo || '/')
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-sm font-medium tracking-[0.08em] text-primary uppercase">
          retention-ai
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Explore RetentionAI</CardTitle>
            <CardDescription>
              Review a shipped feature, find former customers who need it, and approve a personal email. No account required for the demo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="mb-6 w-full" size="lg" onClick={() => { login('Demo reviewer'); navigate(redirectTo || '/') }}>Open demo</Button>
            <details>
            <summary className="mb-4 cursor-pointer text-sm text-muted-foreground">Preview sign-in form (demo only; do not enter a real password)</summary>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup className="gap-5">
                <Field data-invalid={errors.email ? true : undefined}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    aria-invalid={Boolean(errors.email)}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <FieldError>{errors.email}</FieldError>
                </Field>

                <Field data-invalid={errors.password ? true : undefined}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    aria-invalid={Boolean(errors.password)}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <FieldError>{errors.password}</FieldError>
                </Field>

                <Button type="submit" className="w-full" size="lg">
                  Sign in
                </Button>
              </FieldGroup>
            </form>
            </details>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
