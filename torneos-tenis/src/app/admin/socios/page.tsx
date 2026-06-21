import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AdminSociosPage() {
  const supabase = await createClient()
  const { data: socios } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-5">Socios Registrados</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Teléfono</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Rol</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {socios?.map((s: any) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-gray-800">{s.nombre} {s.apellido}</td>
                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                <td className="px-4 py-3 text-gray-500">{s.telefono ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {format(new Date(s.created_at), "d MMM yyyy", { locale: es })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
