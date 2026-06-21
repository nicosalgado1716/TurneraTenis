import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AdminCancelarReserva from '@/components/admin/AdminCancelarReserva'

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; cancha?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const fecha = sp.fecha ?? today

  let query = supabase
    .from('reservas')
    .select('*, cancha:canchas(*), profile:profiles(nombre,apellido,email)')
    .eq('fecha', fecha)
    .order('hora_inicio')

  if (sp.cancha) query = query.eq('cancha_id', sp.cancha)

  const { data: reservas } = await query
  const { data: canchas } = await supabase.from('canchas').select('id, nombre').eq('activa', true)

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Gestión de Reservas</h1>

      <form className="flex gap-3 mb-6 flex-wrap">
        <input
          type="date"
          name="fecha"
          defaultValue={fecha}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          name="cancha"
          defaultValue={sp.cancha ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todas las canchas</option>
          {canchas?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800"
        >
          Filtrar
        </button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Socio</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Cancha</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Horario</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas && reservas.length > 0 ? reservas.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="text-gray-800">{r.profile?.nombre} {r.profile?.apellido}</p>
                  <p className="text-gray-400 text-xs">{r.profile?.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{r.cancha?.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{r.hora_inicio.slice(0,5)} — {r.hora_fin.slice(0,5)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    r.estado === 'confirmada' ? 'bg-green-100 text-green-700'
                    : r.estado === 'cancelada' ? 'bg-red-100 text-red-600'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {r.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.estado === 'confirmada' && <AdminCancelarReserva reservaId={r.id} />}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No hay reservas para esta fecha
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
