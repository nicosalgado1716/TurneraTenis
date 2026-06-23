'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Cancha, Profile, Modalidad } from '@/types'
import { format, addDays } from 'date-fns'

const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
]

const TIPO_LABELS: Record<string, string> = {
  polvo_de_ladrillo: 'Polvo de ladrillo',
  cemento: 'Cemento',
  sintetico: 'Sintético',
  pasto: 'Pasto',
}

interface Props {
  canchas: Cancha[]
}

function getHoraActual() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes() // minutos desde medianoche
}

function esPasado(fecha: string, hora: string) {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (fecha !== today) return false
  const [h] = hora.split(':').map(Number)
  const horaEnMinutos = h * 60
  return horaEnMinutos <= getHoraActual()
}

export default function ReservaForm({ canchas }: Props) {
  const router = useRouter()
  const [canchaId, setCanchaId] = useState(canchas[0]?.id ?? '')
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [horaInicio, setHoraInicio] = useState('')
  const [modalidad, setModalidad] = useState<Modalidad>('single')
  const [jugadores, setJugadores] = useState<(Profile | null)[]>([null])
  const [busquedas, setBusquedas] = useState<string[]>([''])
  const [resultados, setResultados] = useState<(Profile[])>([])
  const [busquedaActiva, setBusquedaActiva] = useState<number | null>(null)
  const [ocupados, setOcupados] = useState<string[]>([])
  const [yaReservoHoy, setYaReservoHoy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')
  const maxDate = format(addDays(new Date(), 14), 'yyyy-MM-dd')
  const cantJugadores = modalidad === 'single' ? 1 : 3

  // Al cambiar modalidad, resetear jugadores
  useEffect(() => {
    setJugadores(Array(cantJugadores).fill(null))
    setBusquedas(Array(cantJugadores).fill(''))
    setResultados([])
  }, [modalidad, cantJugadores])

  useEffect(() => {
    if (!canchaId || !fecha) return
    setOcupados([])
    setHoraInicio('')
    setLoadingSlots(true)

    const supabase = createClient()

    const fetchOcupados = supabase
      .from('reservas')
      .select('hora_inicio')
      .eq('cancha_id', canchaId)
      .eq('fecha', fecha)
      .neq('estado', 'cancelada')
      .then(({ data }) => {
        setOcupados((data ?? []).map((r: { hora_inicio: string }) => r.hora_inicio.slice(0, 5)))
      })

    const fetchYaReservo = supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      return supabase
        .from('reservas')
        .select('id')
        .eq('user_id', user.id)
        .eq('fecha', fecha)
        .eq('estado', 'confirmada')
        .then(({ data }) => setYaReservoHoy((data ?? []).length > 0))
    })

    Promise.all([fetchOcupados, fetchYaReservo]).then(() => setLoadingSlots(false))
  }, [canchaId, fecha])

  async function buscarJugador(texto: string, idx: number) {
    const nuevas = [...busquedas]
    nuevas[idx] = texto
    setBusquedas(nuevas)

    // Limpiar jugador seleccionado si se borra el texto
    if (!texto) {
      const nuevosJ = [...jugadores]
      nuevosJ[idx] = null
      setJugadores(nuevosJ)
      setResultados([])
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, email')
        .or(`nombre.ilike.%${texto}%,apellido.ilike.%${texto}%,email.ilike.%${texto}%`)
        .neq('role', 'admin')
        .limit(5)

      // Filtrar el usuario logueado y los ya seleccionados
      const { data: { user } } = await supabase.auth.getUser()
      const idsSeleccionados = jugadores.map(j => j?.id).filter(Boolean)
      const filtrados = (data ?? []).filter(
        (p: { id: string }) => p.id !== user?.id && !idsSeleccionados.includes(p.id)
      )
      setResultados(filtrados as Profile[])
      setBusquedaActiva(idx)
    }, 300)
  }

  function seleccionarJugador(jugador: Profile, idx: number) {
    const nuevosJ = [...jugadores]
    nuevosJ[idx] = jugador
    setJugadores(nuevosJ)

    const nuevas = [...busquedas]
    nuevas[idx] = `${jugador.nombre} ${jugador.apellido}`
    setBusquedas(nuevas)

    setResultados([])
    setBusquedaActiva(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!horaInicio) { setError('Seleccioná un horario'); return }
    if (yaReservoHoy) { setError('Ya tenés una reserva activa para este día.'); return }
    if (esPasado(fecha, horaInicio)) { setError('No podés reservar un horario que ya pasó.'); return }

    // Validar que todos los jugadores estén seleccionados
    const jugadoresCompletos = jugadores.filter(Boolean) as Profile[]
    if (jugadoresCompletos.length < cantJugadores) {
      setError(`Tenés que agregar ${cantJugadores} jugador${cantJugadores > 1 ? 'es' : ''} para un partido de ${modalidad}.`)
      return
    }

    // Validar que ningún jugador tenga reserva ese día
    const supabase = createClient()
    for (const jugador of jugadoresCompletos) {
      const { data } = await supabase
        .from('reservas')
        .select('id')
        .eq('user_id', jugador.id)
        .eq('fecha', fecha)
        .eq('estado', 'confirmada')

      if (data && data.length > 0) {
        setError(`${jugador.nombre} ${jugador.apellido} ya tiene un turno reservado para este día.`)
        return
      }
    }

    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const horaFin = `${String(parseInt(horaInicio.split(':')[0]) + 1).padStart(2, '0')}:00`

    const { data: reserva, error: err } = await supabase
      .from('reservas')
      .insert({
        cancha_id: canchaId,
        user_id: user!.id,
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        estado: 'confirmada',
        modalidad,
      })
      .select('id')
      .single()

    if (err || !reserva) {
      setError(`Error: ${err?.message} (code: ${err?.code})`)
      setLoading(false)
      return
    }

    // Insertar jugadores
    if (jugadoresCompletos.length > 0) {
      await supabase.from('reserva_jugadores').insert(
        jugadoresCompletos.map(j => ({ reserva_id: reserva.id, user_id: j.id }))
      )
    }

    setSuccess(true)
    setTimeout(() => router.push('/mis-reservas'), 2000)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-green-800">¡Reserva confirmada!</h2>
        <p className="text-green-600 mt-1">Redirigiendo a tus reservas...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cancha selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canchas.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCanchaId(c.id)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              canchaId === c.id
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-white hover:border-green-300'
            }`}
          >
            <p className="font-semibold text-gray-800">{c.nombre}</p>
            <p className="text-sm text-gray-500">{TIPO_LABELS[c.tipo] ?? c.tipo}</p>
            {c.descripcion && <p className="text-xs text-gray-400 mt-1">{c.descripcion}</p>}
          </button>
        ))}
      </div>

      {/* Fecha */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block font-medium text-gray-700 mb-2">Fecha</label>
        <input
          type="date"
          value={fecha}
          min={today}
          max={maxDate}
          onChange={e => setFecha(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-400 mt-1">Podés reservar hasta 14 días de anticipación</p>
      </div>

      {/* Modalidad */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block font-medium text-gray-700 mb-3">Modalidad de juego</label>
        <div className="flex gap-3">
          {(['single', 'dobles'] as Modalidad[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setModalidad(m)}
              className={`flex-1 py-3 rounded-xl border-2 font-medium transition capitalize ${
                modalidad === m
                  ? 'border-green-600 bg-green-50 text-green-800'
                  : 'border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              {m === 'single' ? '🎾 Single (1 vs 1)' : '🎾 Dobles (2 vs 2)'}
            </button>
          ))}
        </div>
      </div>

      {/* Jugadores */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block font-medium text-gray-700 mb-1">
          {modalidad === 'single' ? 'Jugador oponente' : 'Jugadores (3 adicionales)'}
        </label>
        <p className="text-xs text-gray-400 mb-3">
          Buscá por nombre o email. Ninguno puede tener otra reserva ese mismo día.
        </p>
        <div className="space-y-3">
          {Array.from({ length: cantJugadores }).map((_, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={busquedas[idx] ?? ''}
                  onChange={e => buscarJugador(e.target.value, idx)}
                  onFocus={() => setBusquedaActiva(idx)}
                  placeholder="Buscar por nombre o email..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {jugadores[idx] && (
                  <button
                    type="button"
                    onClick={() => {
                      const nuevosJ = [...jugadores]; nuevosJ[idx] = null; setJugadores(nuevosJ)
                      const nuevas = [...busquedas]; nuevas[idx] = ''; setBusquedas(nuevas)
                    }}
                    className="text-gray-400 hover:text-red-500 text-lg leading-none"
                  >×</button>
                )}
              </div>

              {/* Jugador seleccionado */}
              {jugadores[idx] && (
                <div className="mt-1 ml-7 text-xs text-green-700 font-medium">
                  ✓ {jugadores[idx]!.nombre} {jugadores[idx]!.apellido} — {jugadores[idx]!.email}
                </div>
              )}

              {/* Resultados de búsqueda */}
              {busquedaActiva === idx && resultados.length > 0 && (
                <div className="absolute left-7 right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  {resultados.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => seleccionarJugador(p, idx)}
                      className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-sm border-b last:border-0"
                    >
                      <p className="font-medium text-gray-800">{p.nombre} {p.apellido}</p>
                      <p className="text-gray-400 text-xs">{p.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Aviso ya reservó hoy */}
      {yaReservoHoy && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-3 text-sm">
          Ya tenés una reserva activa para este día. Solo se permite una reserva por día.
        </div>
      )}

      {/* Horarios */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="block font-medium text-gray-700 mb-3">Horario</label>
        {loadingSlots ? (
          <p className="text-gray-400 text-sm">Cargando disponibilidad...</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {HORARIOS.map(h => {
              const ocupado = ocupados.includes(h)
              const pasado = esPasado(fecha, h)
              const selected = horaInicio === h
              const disabled = ocupado || pasado || yaReservoHoy

              return (
                <button
                  key={h}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setHoraInicio(h)}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    pasado
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : ocupado
                      ? 'bg-red-100 text-red-400 cursor-not-allowed'
                      : selected
                      ? 'bg-green-600 text-white'
                      : yaReservoHoy
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                  }`}
                >
                  {h}
                </button>
              )
            })}
          </div>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-600 rounded inline-block"/> Seleccionado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded inline-block"/> Ocupado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded inline-block border border-gray-200"/> Pasado / No disponible</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded inline-block"/> Disponible</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !horaInicio || yaReservoHoy}
        className="bg-green-700 text-white font-semibold px-8 py-3 rounded-xl hover:bg-green-800 transition disabled:opacity-50"
      >
        {loading ? 'Confirmando...' : 'Confirmar Reserva'}
      </button>
    </form>
  )
}
