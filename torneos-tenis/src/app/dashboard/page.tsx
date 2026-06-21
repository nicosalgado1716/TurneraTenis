import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Reserva } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const today = new Date().toISOString().split('T')[0]

  const { data: proximasReservas } = await supabase
    .from('reservas')
    .select('*, cancha:canchas(*)')
    .eq('user_id', user!.id)
    .eq('estado', 'confirmada')
    .gte('fecha', today)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(5)

  const { count: totalReservas } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('estado', 'confirmada')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {profile?.nombre}!
        </h1>
        <p className="text-gray-500">{format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm">Reservas activas</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{totalReservas ?? 0}</p>
        </div>
        <Link
          href="/reservas"
          className="bg-green-700 text-white rounded-xl p-6 shadow-sm hover:bg-green-800 transition"
        >
          <p className="text-green-100 text-sm">Acción rápida</p>
          <p className="text-xl font-bold mt-1">+ Nueva Reserva</p>
        </Link>
        <Link
          href="/mis-reservas"
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-green-300 transition"
        >
          <p className="text-gray-500 text-sm">Ver historial</p>
          <p className="text-xl font-bold text-gray-800 mt-1">Mis Reservas →</p>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Próximas reservas</h2>
        {proximasReservas && proximasReservas.length > 0 ? (
          <div className="space-y-3">
            {(proximasReservas as unknown as Reserva[]).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{r.cancha?.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(r.fecha + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })} — {r.hora_inicio.slice(0,5)} a {r.hora_fin.slice(0,5)}
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Confirmada
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No tenés reservas próximas.{' '}
            <Link href="/reservas" className="text-green-700 hover:underline">Reservar ahora</Link>
          </p>
        )}
      </div>
    </div>
  )
}
