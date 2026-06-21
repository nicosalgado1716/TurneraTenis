import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'
import { Profile } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if ((profile as Profile)?.role !== 'admin') redirect('/dashboard')

  const adminLinks = [
    { href: '/admin', label: 'Resumen' },
    { href: '/admin/reservas', label: 'Reservas' },
    { href: '/admin/canchas', label: 'Canchas' },
    { href: '/admin/socios', label: 'Socios' },
    { href: '/admin/auditoria', label: '📋 Auditoría' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar profile={profile as Profile} />
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex gap-6">
        <aside className="w-48 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {adminLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 border-b border-gray-50 last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
