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
    errors.email = 'Bitte E-Mail eingeben.'
  } else if (!email.includes('@')) {
    errors.email = 'Bitte eine gültige E-Mail eingeben.'
  }

  if (!password) {
    errors.password = 'Bitte Passwort eingeben.'
  }

  return errors
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(email, password)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    login(email.trim())
    navigate('/')
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-sm font-medium tracking-[0.08em] text-primary uppercase">
          retention-ai
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Anmelden</CardTitle>
            <CardDescription>
              Melde dich mit deiner E-Mail und deinem Passwort an.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup className="gap-5">
                <Field data-invalid={errors.email ? true : undefined}>
                  <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="du@firma.de"
                    value={email}
                    aria-invalid={Boolean(errors.email)}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <FieldError>{errors.email}</FieldError>
                </Field>

                <Field data-invalid={errors.password ? true : undefined}>
                  <FieldLabel htmlFor="password">Passwort</FieldLabel>
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
                  Anmelden
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
