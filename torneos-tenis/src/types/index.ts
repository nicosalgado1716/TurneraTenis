export type UserRole = 'socio' | 'admin'

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
  notas?: string
  created_at: string
  cancha?: Cancha
  profile?: Profile
}

export interface HorarioDisponible {
  hora_inicio: string
  hora_fin: string
  disponible: boolean
}
