import { createClient } from '@/lib/supabase/server'
import AdminCanchaForm from '@/components/admin/AdminCanchaForm'
import AdminToggleCancha from '@/components/admin/AdminToggleCancha'

const TIPO_LABELS: Record<string, string> = {
  polvo_de_ladrillo: 'Polvo de ladrillo',
  cemento: 'Cemento',
  sintetico: 'Sintético',
  pasto: 'Pasto',
}

export default async function AdminCanchasPage() {
  const supabase = await createClient()
  const { data: canchas } = await supabase.from('canchas').select('*').order('created_at')

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Gestión de Canchas</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Tipo</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Descripción</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {canchas?.map((c: any) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{TIPO_LABELS[c.tipo] ?? c.tipo}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.descripcion ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AdminToggleCancha canchaId={c.id} activa={c.activa} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Agregar nueva cancha</h2>
        <AdminCanchaForm />
      </div>
    </div>
  )
}
