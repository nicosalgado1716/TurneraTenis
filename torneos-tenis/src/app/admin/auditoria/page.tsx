import { createClient } from '@/lib/supabase/server'
import { AuditLog } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import AuditDetalle from '@/components/admin/AuditDetalle'

const ACCION_STYLES: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-600',
}

const ACCION_LABELS: Record<string, string> = {
  INSERT: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Eliminación',
}

const TABLA_LABELS: Record<string, string> = {
  canchas: '🎾 Canchas',
  reservas: '📅 Reservas',
  profiles: '👤 Socios',
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ tabla?: string; desde?: string; hasta?: string; page?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const page = parseInt(sp.page ?? '1')
  const PAGE_SIZE = 30
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('audit_log')
    .select('*, profile:profiles(nombre, apellido, email, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (sp.tabla) query = query.eq('tabla', sp.tabla)
  if (sp.desde) query = query.gte('created_at', sp.desde)
  if (sp.hasta) query = query.lte('created_at', sp.hasta + 'T23:59:59')

  const { data: logs, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Log de Auditoría</h1>
        <span className="text-sm text-gray-400">{count ?? 0} registros</span>
      </div>

      {/* Filtros */}
      <form className="flex gap-3 mb-6 flex-wrap bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tabla</label>
          <select
            name="tabla"
            defaultValue={sp.tabla ?? ''}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas</option>
            <option value="canchas">Canchas</option>
            <option value="reservas">Reservas</option>
            <option value="profiles">Socios</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Desde</label>
          <input
            type="date"
            name="desde"
            defaultValue={sp.desde ?? ''}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hasta</label>
          <input
            type="date"
            name="hasta"
            defaultValue={sp.hasta ?? ''}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800"
          >
            Filtrar
          </button>
          <a
            href="/admin/auditoria"
            className="text-gray-500 border border-gray-300 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
          >
            Limpiar
          </a>
        </div>
      </form>

      {/* Tabla de logs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha y hora</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Usuario</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Tabla</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Acción</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Descripción</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs && logs.length > 0 ? (logs as unknown as AuditLog[]).map(log => (
              <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: es })}
                </td>
                <td className="px-4 py-3">
                  {log.profile ? (
                    <div>
                      <p className="text-gray-800 font-medium">
                        {log.profile.nombre} {log.profile.apellido}
                      </p>
                      <p className="text-xs text-gray-400">{log.profile.email}</p>
                      {log.profile.role === 'admin' && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">admin</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Sistema</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {TABLA_LABELS[log.tabla] ?? log.tabla}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ACCION_STYLES[log.accion] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ACCION_LABELS[log.accion] ?? log.accion}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-xs">
                  {log.descripcion ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <AuditDetalle log={log} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No hay registros de auditoría para los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a
              key={p}
              href={`/admin/auditoria?${new URLSearchParams({ ...sp, page: String(p) })}`}
              className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                p === page
                  ? 'bg-green-700 text-white border-green-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
