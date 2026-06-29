'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, TipoSancion } from '@/types'

export default function AdminSancionForm() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Profile[]>([])
  const [socio, setSocio] = useState<Profile | null>(null)
  const [tipo, setTipo] = useState<TipoSancion>('inhabilitacion_temporal')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [cantidadReservas, setCantidadReservas] = useState('1')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function buscarSocio(texto: string) {
    setBusqueda(texto)
    setSocio(null)
    if (!texto.trim()) {
      setResultados([])
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, nombre, apellido, email')
      .or(`nombre.ilike.%${texto}%,apellido.ilike.%${texto}%,email.ilike.%${texto}%`)
      .neq('role', 'admin')
      .limit(5)
    setResultados((data ?? []) as Profile[])
  }

  function seleccionarSocio(p: Profile) {
    setSocio(p)
    setBusqueda(`${p.nombre} ${p.apellido}`)
    setResultados([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!socio) {
      setError('Tenés que seleccionar un socio.')
      return
    }
    if (!motivo.trim()) {
      setError('Tenés que indicar un motivo.')
      return
    }
    if (tipo === 'inhabilitacion_temporal' && (!fechaInicio || !fechaFin)) {
      setError('Tenés que indicar fecha de inicio y fin de la inhabilitación.')
      return
    }
    if (tipo === 'descuento_reservas' && (!cantidadReservas || Number(cantidadReservas) <= 0)) {
      setError('Tenés que indicar una cantidad de reservas a descontar.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const payload: Record<string, unknown> = {
      user_id: socio.id,
      tipo,
      motivo,
      created_by: user?.id,
    }
    if (tipo === 'inhabilitacion_temporal') {
      payload.fecha_inicio = fechaInicio
      payload.fecha_fin = fechaFin
    } else {
      payload.cantidad_reservas = Number(cantidadReservas)
    }

    const { error: insertError } = await supabase.from('sanciones').insert(payload)
    setLoading(false)

    if (insertError) {
      setError(`No se pudo crear la sanción: ${insertError.message}`)
      return
    }

    setSuccess(true)
    setSocio(null)
    setBusqueda('')
    setMotivo('')
    setFechaInicio('')
    setFechaFin('')
    setCantidadReservas('1')
    setTimeout(() => setSuccess(false), 2500)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Socio</label>
        <input
          value={busqueda}
          onChange={e => buscarSocio(e.target.value)}
          placeholder="Buscar por nombre, apellido o email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {resultados.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {resultados.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => seleccionarSocio(p)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50"
              >
                {p.nombre} {p.apellido} <span className="text-gray-400">— {p.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sanción</label>
        <select
          value={tipo}
          onChange={e => setTipo(e.target.value as TipoSancion)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="inhabilitacion_temporal">Inhabilitación temporal de canchas</option>
          <option value="descuento_reservas">Descuento de reservas mensuales</option>
        </select>
      </div>

      {tipo === 'inhabilitacion_temporal' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de reservas a descontar</label>
          <input
            type="number"
            min={1}
            value={cantidadReservas}
            onChange={e => setCantidadReservas(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={3}
          placeholder="Ej: reservó turno y no asistió"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {success && <p className="text-green-600 text-sm">✓ Sanción creada correctamente</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Aplicar sanción'}
      </button>
    </form>
  )
}
