import { createClient } from '@/lib/supabase/server'
import { Reserva } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CancelarReservaButton from '@/components/reservas/CancelarReservaButton'

export default async function MisReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reservas } = await supabase
    .from('reservas')
    .select('*, cancha:canchas(*)')
    .eq('user_id', user!.id)
    .order('fecha', { ascending: false })
    .order('hora_inicio', { ascending: false })

  const today = new Date().toISOString().split('T')[0]

  const proximas = (reservas as unknown as Reserva[])?.filter(r => r.fecha >= today && r.estado === 'confirmada') ?? []
  const pasadas = (reservas as unknown as Reserva[])?.filter(r => r.fecha < today || r.estado === 'cancelada') ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Reservas</h1>

      <section className="mb-8">
        <h2 className="font-semibold text-gray-700 mb-3">Próximas ({proximas.length})</h2>
        {proximas.length === 0 ? (
          <p className="text-gray-400 text-sm">No tenés reservas próximas.</p>
        ) : (
          <div className="space-y-3">
            {proximas.map(r => (
              <ReservaCard key={r.id} reserva={r} cancellable />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-gray-700 mb-3">Historial ({pasadas.length})</h2>
        {pasadas.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin historial.</p>
        ) : (
          <div className="space-y-3">
            {pasadas.map(r => (
              <ReservaCard key={r.id} reserva={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ReservaCard({ reserva: r, cancellable }: { reserva: Reserva; cancellable?: boolean }) {
  const fechaDisplay = format(new Date(r.fecha + 'T00:00:00'), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="font-semibold text-gray-800">{r.cancha?.nombre}</p>
        <p className="text-sm text-gray-600 capitalize">{fechaDisplay}</p>
        <p className="text-sm text-gray-500">{r.hora_inicio.slice(0,5)} — {r.hora_fin.slice(0,5)} hs</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          r.estado === 'confirmada'
            ? 'bg-green-100 text-green-700'
            : r.estado === 'cancelada'
            ? 'bg-red-100 text-red-600'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}
        </span>
        {cancellable && r.estado === 'confirmada' && (
          <CancelarReservaButton reservaId={r.id} />
        )}
      </div>
    </div>
  )
}
