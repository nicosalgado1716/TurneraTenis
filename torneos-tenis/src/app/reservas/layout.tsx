import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { Profile } from '@/types'

export default async function ReservasLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar profile={profile as Profile} />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </div>
    </div>
  )
}
