import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalReservasHoy },
    { count: totalReservas },
    { count: totalSocios },
    { count: totalCanchas },
    { data: proximasReservas },
  ] = await Promise.all([
    supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('fecha', today).eq('estado', 'confirmada'),
    supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('estado', 'confirmada'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'socio'),
    supabase.from('canchas').select('*', { count: 'exact', head: true }).eq('activa', true),
    supabase.from('reservas').select('*, cancha:canchas(*), profile:profiles(nombre,apellido)').eq('fecha', today).eq('estado', 'confirmada').order('hora_inicio'),
  ])

  const stats = [
    { label: 'Reservas hoy', value: totalReservasHoy ?? 0, color: 'bg-green-600' },
    { label: 'Total reservas activas', value: totalReservas ?? 0, color: 'bg-blue-600' },
    { label: 'Socios registrados', value: totalSocios ?? 0, color: 'bg-purple-600' },
    { label: 'Canchas activas', value: totalCanchas ?? 0, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel de Administración</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`${s.color} text-white rounded-xl p-5 shadow-sm`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-sm opacity-80 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">
          Reservas de hoy — {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </h2>
        {proximasReservas && proximasReservas.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Socio</th>
                <th className="pb-2 font-medium">Cancha</th>
                <th className="pb-2 font-medium">Horario</th>
              </tr>
            </thead>
            <tbody>
              {proximasReservas.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 text-gray-700">{r.profile?.nombre} {r.profile?.apellido}</td>
                  <td className="py-2 text-gray-700">{r.cancha?.nombre}</td>
                  <td className="py-2 text-gray-500">{r.hora_inicio.slice(0,5)} — {r.hora_fin.slice(0,5)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm">No hay reservas para hoy.</p>
        )}
      </div>
    </div>
  )
}
