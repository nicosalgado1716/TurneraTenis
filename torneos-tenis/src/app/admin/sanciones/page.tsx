import { createClient } from '@/lib/supabase/server'
import AdminSancionForm from '@/components/admin/AdminSancionForm'
import AdminSancionActions from '@/components/admin/AdminSancionActions'
import { Sancion } from '@/types'
import { format } from 'date-fns'

const ESTADO_BADGE: Record<string, string> = {
  activa: 'bg-green-100 text-green-700',
  finalizada: 'bg-gray-100 text-gray-500',
  revocada: 'bg-red-100 text-red-600',
}

export default async function AdminSancionesPage() {
  const supabase = await createClient()
  const { data: sanciones } = await supabase
    .from('sanciones')
    .select('*, profile:profiles!sanciones_user_id_fkey(nombre, apellido, email)')
    .order('created_at', { ascending: false })

  const lista = (sanciones ?? []) as unknown as Sancion[]
  const pendientesApelacion = lista.filter(s => s.apelacion_estado === 'pendiente')

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Sanciones</h1>

      {pendientesApelacion.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm mb-5">
          Hay {pendientesApelacion.length} apelación(es) pendiente(s) de revisión.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Socio</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Tipo</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Detalle</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Motivo</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(s => (
              <tr key={s.id} className="border-b last:border-0 align-top">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {s.profile?.nombre} {s.profile?.apellido}
                  <div className="text-xs text-gray-400">{s.profile?.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {s.tipo === 'inhabilitacion_temporal' ? 'Inhabilitación' : 'Descuento de reservas'}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {s.tipo === 'inhabilitacion_temporal'
                    ? `${s.fecha_inicio} → ${s.fecha_fin}`
                    : `${s.cantidad_reservas} reserva(s)`}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">{s.motivo}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE[s.estado]}`}>
                    {s.estado}
                  </span>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {format(new Date(s.created_at), 'dd/MM/yyyy')}
                  </div>
                </td>
                <td className="px-4 py-3 min-w-[180px]">
                  <AdminSancionActions sancion={s} />
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No hay sanciones registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Aplicar nueva sanción</h2>
        <AdminSancionForm />
      </div>
    </div>
  )
}
