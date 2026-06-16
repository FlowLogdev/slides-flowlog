import { cookies } from 'next/headers'
import { validateSession } from '@/lib/db'
import AppShell from '@/components/AppShell'
import LandingPage from '@/components/landing/LandingPage'

export default async function Page() {
  const token = (await cookies()).get('sf_session')?.value
  const session = token ? await validateSession(token) : null

  if (session) {
    return <AppShell userEmail={session.email} />
  }

  return <LandingPage />
}
