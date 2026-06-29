export type UserRole = 'socio' | 'admin'
export type Modalidad = 'single' | 'dobles'

export interface Profile {
  id: string
  email: string
  nombre: string
  apellido: string
  telefono?: string
  numero_socio?: string
  role: UserRole
  activo: boolean
  created_at: string
}

export interface Cancha {
  id: string
  nombre: string
  tipo: 'polvo_de_ladrillo' | 'cemento' | 'sintetico' | 'pasto'
  descripcion?: string
  activa: boolean
  created_at: string
}

export interface Reserva {
  id: string
  cancha_id: string
  user_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: 'confirmada' | 'cancelada' | 'pendiente'
  modalidad: Modalidad
  notas?: string
  created_at: string
  cancha?: Cancha
  profile?: Profile
  jugadores?: ReservaJugador[]
}

export interface ReservaJugador {
  id: string
  reserva_id: string
  user_id: string
  created_at: string
  profile?: Profile
}

export type TipoSancion = 'inhabilitacion_temporal' | 'descuento_reservas'
export type EstadoSancion = 'activa' | 'finalizada' | 'revocada'
export type EstadoApelacion = 'sin_apelar' | 'pendiente' | 'aceptada' | 'rechazada'

export interface Sancion {
  id: string
  user_id: string
  tipo: TipoSancion
  motivo: string
  fecha_inicio?: string
  fecha_fin?: string
  cantidad_reservas?: number
  estado: EstadoSancion
  apelacion_texto?: string
  apelacion_estado: EstadoApelacion
  apelacion_respuesta?: string
  created_by?: string
  created_at: string
  profile?: Profile
}

export interface HorarioDisponible {
  hora_inicio: string
  hora_fin: string
  disponible: boolean
}

export interface AuditLog {
  id: string
  tabla: string
  accion: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id: string | null
  descripcion: string | null
  datos_antes: Record<string, unknown> | null
  datos_despues: Record<string, unknown> | null
  created_at: string
  profile?: Pick<Profile, 'nombre' | 'apellido' | 'email' | 'role'>
}
