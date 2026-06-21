import { createClient } from '@/lib/supabase/server'
import ReservaForm from '@/components/reservas/ReservaForm'
import { Cancha } from '@/types'

export default async function ReservasPage() {
  const supabase = await createClient()

  const { data: canchas } = await supabase
    .from('canchas')
    .select('*')
    .eq('activa', true)
    .order('nombre')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reservar Cancha</h1>
        <p className="text-gray-500">Elegí la cancha, fecha y horario</p>
      </div>
      <ReservaForm canchas={(canchas as Cancha[]) ?? []} />
    </div>
  )
}
