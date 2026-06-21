'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

interface NavbarProps {
  profile: Profile | null
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'

  const links = [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/reservas', label: 'Reservar' },
    { href: '/mis-reservas', label: 'Mis Reservas' },
    ...(isAdmin ? [{ href: '/admin', label: 'Administración' }] : []),
  ]

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2">
          🎾 TurneraTenis
        </Link>
        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                pathname === l.href || pathname.startsWith(l.href + '/')
                  ? 'bg-green-700'
                  : 'hover:bg-green-700'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="ml-4 flex items-center gap-3">
            <span className="text-sm opacity-80">{profile?.nombre} {profile?.apellido}</span>
            <button
              onClick={handleLogout}
              className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-sm transition"
            >
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
