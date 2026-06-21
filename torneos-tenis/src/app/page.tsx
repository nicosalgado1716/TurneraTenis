import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-800 to-green-600 px-4">
      <div className="text-center text-white mb-10">
        <div className="text-7xl mb-4">🎾</div>
        <h1 className="text-5xl font-bold mb-3">TurneraTenis</h1>
        <p className="text-xl opacity-90">Sistema de reservas de canchas de tenis</p>
      </div>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/auth/login"
          className="bg-white text-green-800 font-semibold px-8 py-3 rounded-xl hover:bg-green-50 transition shadow-lg"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/auth/registro"
          className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-700 transition"
        >
          Registrarse
        </Link>
      </div>
    </main>
  )
}
