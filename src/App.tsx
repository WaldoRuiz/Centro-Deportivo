import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from './services/api/apiError'
import { authService } from './services/auth'
import { deportivoService } from './services/deportivoService'
import type {
  Actividad,
  CrearActividad,
  CrearEntrenador,
  Inscrito,
  ReporteGenerado,
  Reserva,
  Usuario,
} from './types/domain'

const USER_KEY = 'centro_deportivo_user'

type View =
  | 'actividades'
  | 'reservas'
  | 'entrenadores'
  | 'asistencia'
  | 'reportes'

const emptyActividad: CrearActividad = {
  nombre: '',
  descripcion: '',
  horarioInicio: '',
  horarioFin: '',
  cupoMaximo: 15,
  idEntrenador: 0,
}

const emptyEntrenador: CrearEntrenador = {
  nombre: '',
  correo: '',
  password: '',
  telefono: '',
}

const today = new Date().toISOString().slice(0, 10)

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as Usuario) : null
  })
  const [view, setView] = useState<View>('actividades')
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [entrenadores, setEntrenadores] = useState<Usuario[]>([])
  const [inscritos, setInscritos] = useState<Inscrito[]>([])
  const [actividadSeleccionada, setActividadSeleccionada] = useState<number>(0)
  const [reporte, setReporte] = useState<ReporteGenerado | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)

  const esAdmin = usuario?.rol === 'Admin' || usuario?.rol === 'Administrador'
  const esEntrenador = usuario?.rol === 'Entrenador'
  const esCliente = usuario?.rol === 'Cliente'

  const tabs = useMemo(() => {
    const base: { id: View; label: string }[] = [
      { id: 'actividades', label: 'Actividades' },
    ]

    if (usuario) base.push({ id: 'reservas', label: 'Mis reservas' })
    if (esAdmin) base.push({ id: 'entrenadores', label: 'Entrenadores' })
    if (esEntrenador || esAdmin) base.push({ id: 'asistencia', label: 'Asistencia' })
    if (esAdmin) base.push({ id: 'reportes', label: 'Reportes' })

    return base
  }, [usuario, esAdmin, esEntrenador])

  useEffect(() => {
    deportivoService.actividades
      .listar()
      .then(setActividades)
      .catch((error) => setMensaje(extraerMensaje(error)))
  }, [])

  useEffect(() => {
    if (usuario) {
      deportivoService.reservas
        .listarMias()
        .then(setReservas)
        .catch((error) => setMensaje(extraerMensaje(error)))
    }
  }, [usuario])

  useEffect(() => {
    if (esAdmin) {
      deportivoService.entrenadores
        .listar()
        .then(setEntrenadores)
        .catch((error) => setMensaje(extraerMensaje(error)))
    }
  }, [esAdmin])

  useEffect(() => {
    if (actividadSeleccionada > 0 && (esAdmin || esEntrenador)) {
      deportivoService.actividades
        .inscritos(actividadSeleccionada)
        .then(setInscritos)
        .catch((error) => setMensaje(extraerMensaje(error)))
    }
  }, [actividadSeleccionada, esAdmin, esEntrenador])

  const ejecutar = async (accion: () => Promise<void>, ok?: string) => {
    setCargando(true)
    setMensaje('')
    try {
      await accion()
      if (ok) setMensaje(ok)
    } catch (error) {
      setMensaje(extraerMensaje(error))
    } finally {
      setCargando(false)
    }
  }

  const cargarActividades = async () => {
    const data = await deportivoService.actividades.listar()
    setActividades(data)
  }

  const cargarReservas = async () => {
    const data = await deportivoService.reservas.listarMias()
    setReservas(data)
  }

  const cargarEntrenadores = async () => {
    const data = await deportivoService.entrenadores.listar()
    setEntrenadores(data)
  }

  const cargarInscritos = async (idActividad: number) => {
    const data = await deportivoService.actividades.inscritos(idActividad)
    setInscritos(data)
  }

  const login = async (correo: string, password: string) => {
    await ejecutar(async () => {
      const response = await authService.login({ correo, password })
      setUsuario(response.usuario)
      window.localStorage.setItem(USER_KEY, JSON.stringify(response.usuario))
      setView('actividades')
    }, 'Sesion iniciada.')
  }

  const registrar = async (
    nombre: string,
    correo: string,
    password: string,
    telefono: string,
  ) => {
    await ejecutar(async () => {
      await authService.register({ nombre, correo, password, telefono })
    }, 'Registro exitoso. Ya puedes iniciar sesion.')
  }

  const logout = () => {
    authService.logout()
    window.localStorage.removeItem(USER_KEY)
    setUsuario(null)
    setView('actividades')
    setMensaje('Sesion cerrada.')
  }

  const reservar = (idActividad: number) =>
    ejecutar(async () => {
      await deportivoService.reservas.crear(idActividad)
      await Promise.all([cargarActividades(), cargarReservas()])
    }, 'Reserva confirmada.')

  const cancelarReserva = (idReserva: number) =>
    ejecutar(async () => {
      await deportivoService.reservas.cancelar(idReserva)
      await Promise.all([cargarActividades(), cargarReservas()])
    }, 'Cancelacion exitosa.')

  const guardarActividad = (payload: CrearActividad) =>
    ejecutar(async () => {
      await deportivoService.actividades.crear(payload)
      await cargarActividades()
    }, 'Actividad creada.')

  const eliminarActividad = (id: number) =>
    ejecutar(async () => {
      await deportivoService.actividades.eliminar(id)
      await cargarActividades()
    }, 'Actividad eliminada.')

  const guardarEntrenador = (payload: CrearEntrenador) =>
    ejecutar(async () => {
      await deportivoService.entrenadores.crear(payload)
      await cargarEntrenadores()
    }, 'Entrenador creado.')

  const eliminarEntrenador = (id: number) =>
    ejecutar(async () => {
      await deportivoService.entrenadores.eliminar(id)
      await cargarEntrenadores()
    }, 'Entrenador eliminado.')

  const marcarAsistencia = (idReserva: number, asistencia: boolean) =>
    ejecutar(async () => {
      await deportivoService.reservas.marcarAsistencia(idReserva, asistencia)
      await cargarInscritos(actividadSeleccionada)
    }, 'Asistencia actualizada.')

  const generarReporte = (fechaInicio: string, fechaFin: string) =>
    ejecutar(async () => {
      const data = await deportivoService.reportes.generar(fechaInicio, fechaFin)
      setReporte(data)
    }, 'Reporte generado.')

  const exportarCsv = (fechaInicio: string, fechaFin: string) =>
    ejecutar(async () => {
      const csv = await deportivoService.reportes.exportarCsv(fechaInicio, fechaFin)
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-${fechaInicio}-${fechaFin}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }, 'Archivo CSV generado.')

  if (!usuario) {
    return (
      <main className="app-shell auth-shell">
        <section className="topbar auth-topbar">
          <div>
            <p className="eyebrow">Centro deportivo</p>
            <h1>Acceso al sistema</h1>
          </div>
        </section>
        {mensaje ? <div className="notice">{mensaje}</div> : null}
        <AuthPanel onLogin={login} onRegister={registrar} loading={cargando} />
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Centro deportivo</p>
          <h1>Gestion de actividades y reservas</h1>
        </div>
        <div className="session-box">
          <span>{usuario.nombre}</span>
          <small>{usuario.rol}</small>
          <button className="ghost-button" onClick={logout}>
            Salir
          </button>
        </div>
      </section>

      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            className={view === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => setView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {mensaje ? <div className="notice">{mensaje}</div> : null}

      <Dashboard
        actividades={actividades}
        reservas={reservas}
        reporte={reporte}
        usuario={usuario}
      />

      {view === 'actividades' ? (
        <ActividadesPanel
          actividades={actividades}
          entrenadores={entrenadores}
          esAdmin={esAdmin}
          esCliente={esCliente}
          loading={cargando}
          onEliminar={eliminarActividad}
          onGuardar={guardarActividad}
          onReservar={reservar}
        />
      ) : null}

      {view === 'reservas' && usuario ? (
        <ReservasPanel
          loading={cargando}
          reservas={reservas}
          onCancelar={cancelarReserva}
        />
      ) : null}

      {view === 'entrenadores' && esAdmin ? (
        <EntrenadoresPanel
          entrenadores={entrenadores}
          loading={cargando}
          onEliminar={eliminarEntrenador}
          onGuardar={guardarEntrenador}
        />
      ) : null}

      {view === 'asistencia' && (esEntrenador || esAdmin) ? (
        <AsistenciaPanel
          actividades={actividades}
          actividadSeleccionada={actividadSeleccionada}
          inscritos={inscritos}
          loading={cargando}
          onActividadChange={setActividadSeleccionada}
          onMarcar={marcarAsistencia}
        />
      ) : null}

      {view === 'reportes' && esAdmin ? (
        <ReportesPanel
          loading={cargando}
          reporte={reporte}
          onExportarCsv={exportarCsv}
          onGenerar={generarReporte}
        />
      ) : null}
    </main>
  )
}

function AuthPanel({
  loading,
  onLogin,
  onRegister,
}: {
  loading: boolean
  onLogin: (correo: string, password: string) => void
  onRegister: (
    nombre: string,
    correo: string,
    password: string,
    telefono: string,
  ) => void
}) {
  const [showRegister, setShowRegister] = useState(false)
  const [loginForm, setLoginForm] = useState({ correo: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    correo: '',
    password: '',
    telefono: '',
  })

  if (showRegister) {
    return (
      <section className="auth-centered">
        <form
          className="panel compact-form"
          onSubmit={(event) => {
            event.preventDefault()
            onRegister(
              registerForm.nombre,
              registerForm.correo,
              registerForm.password,
              registerForm.telefono,
            )
          }}
        >
          <h2>Crear cuenta</h2>
          <input
            placeholder="Nombre"
            value={registerForm.nombre}
            onChange={(event) =>
              setRegisterForm({ ...registerForm, nombre: event.target.value })
            }
          />
          <input
            placeholder="Correo"
            type="email"
            value={registerForm.correo}
            onChange={(event) =>
              setRegisterForm({ ...registerForm, correo: event.target.value })
            }
          />
          <input
            placeholder="Telefono"
            value={registerForm.telefono}
            onChange={(event) =>
              setRegisterForm({ ...registerForm, telefono: event.target.value })
            }
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={registerForm.password}
            onChange={(event) =>
              setRegisterForm({ ...registerForm, password: event.target.value })
            }
          />
          <button disabled={loading}>Crear cuenta</button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => setShowRegister(false)}
          >
            ← Volver a iniciar sesión
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="auth-centered">
      <form
        className="panel compact-form"
        onSubmit={(event) => {
          event.preventDefault()
          onLogin(loginForm.correo, loginForm.password)
        }}
      >
        <h2>Iniciar sesión</h2>
        <input
          placeholder="Correo"
          type="email"
          value={loginForm.correo}
          onChange={(event) =>
            setLoginForm({ ...loginForm, correo: event.target.value })
          }
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={loginForm.password}
          onChange={(event) =>
            setLoginForm({ ...loginForm, password: event.target.value })
          }
        />
        <button disabled={loading}>Entrar</button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => setShowRegister(true)}
        >
          Crear una cuenta
        </button>
      </form>
    </section>
  )
}function Dashboard({
  actividades,
  reservas,
  reporte,
  usuario,
}: {
  actividades: Actividad[]
  reservas: Reserva[]
  reporte: ReporteGenerado | null
  usuario: Usuario | null
}) {
  return (
    <section className="stats-grid">
      <Stat label="Actividades" value={actividades.length} />
      <Stat
        label="Cupos disponibles"
        value={actividades.reduce((total, item) => total + item.cupoDisponible, 0)}
      />
      <Stat label="Mis reservas" value={usuario ? reservas.length : 0} />
      <Stat label="Top reporte" value={reporte?.topActividades.length ?? 0} />
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function ActividadesPanel({
  actividades,
  entrenadores,
  esAdmin,
  esCliente,
  loading,
  onEliminar,
  onGuardar,
  onReservar,
}: {
  actividades: Actividad[]
  entrenadores: Usuario[]
  esAdmin: boolean
  esCliente: boolean
  loading: boolean
  onEliminar: (id: number) => void
  onGuardar: (payload: CrearActividad) => void
  onReservar: (id: number) => void
}) {
  const [form, setForm] = useState(emptyActividad)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onGuardar({ ...form, cupoMaximo: Number(form.cupoMaximo), idEntrenador: Number(form.idEntrenador) })
    setForm(emptyActividad)
  }

  return (
    <section className="content-grid">
      <div className="panel list-panel">
        <div className="panel-heading">
          <h2>Catalogo de actividades</h2>
          <span>{actividades.length} registros</span>
        </div>
        <div className="activity-list">
          {actividades.map((actividad) => (
            <article className="activity-card" key={actividad.idActividad}>
              <div>
                <h3>{actividad.nombre}</h3>
                <p>{actividad.descripcion || 'Sin descripcion'}</p>
                <small>
                  {formatearFecha(actividad.horarioInicio)} -{' '}
                  {formatearHora(actividad.horarioFin)}
                </small>
              </div>
              <div className="card-actions">
                <span className="capacity">
                  {actividad.cupoDisponible}/{actividad.cupoMaximo}
                </span>
                <small>{actividad.entrenadorNombre || 'Entrenador asignado'}</small>
                {esCliente ? (
                  <button
                    disabled={loading || actividad.cupoDisponible <= 0}
                    onClick={() => onReservar(actividad.idActividad)}
                  >
                    Reservar
                  </button>
                ) : null}
                {esAdmin ? (
                  <button
                    className="danger"
                    disabled={loading}
                    onClick={() => onEliminar(actividad.idActividad)}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      {esAdmin ? (
        <form className="panel compact-form" onSubmit={submit}>
          <h2>Nueva actividad</h2>
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(event) => setForm({ ...form, nombre: event.target.value })}
          />
          <textarea
            placeholder="Descripcion"
            value={form.descripcion}
            onChange={(event) =>
              setForm({ ...form, descripcion: event.target.value })
            }
          />
          <input
            type="datetime-local"
            value={form.horarioInicio}
            onChange={(event) =>
              setForm({ ...form, horarioInicio: event.target.value })
            }
          />
          <input
            type="datetime-local"
            value={form.horarioFin}
            onChange={(event) =>
              setForm({ ...form, horarioFin: event.target.value })
            }
          />
          <input
            min={1}
            type="number"
            value={form.cupoMaximo}
            onChange={(event) =>
              setForm({ ...form, cupoMaximo: Number(event.target.value) })
            }
          />
          <select
            value={form.idEntrenador}
            onChange={(event) =>
              setForm({ ...form, idEntrenador: Number(event.target.value) })
            }
          >
            <option value={0}>Seleccionar entrenador</option>
            {entrenadores.map((entrenador) => (
              <option key={entrenador.idUsuario} value={entrenador.idUsuario}>
                {entrenador.nombre}
              </option>
            ))}
          </select>
          <button disabled={loading}>Guardar actividad</button>
        </form>
      ) : null}
    </section>
  )
}

function ReservasPanel({
  loading,
  reservas,
  onCancelar,
}: {
  loading: boolean
  reservas: Reserva[]
  onCancelar: (id: number) => void
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Mis reservas</h2>
        <span>{reservas.length} registros</span>
      </div>
      <div className="table">
        <div className="table-row header">
          <span>Actividad</span>
          <span>Horario</span>
          <span>Estado</span>
          <span>Asistencia</span>
          <span>Accion</span>
        </div>
        {reservas.map((reserva) => (
          <div className="table-row" key={reserva.idReserva}>
            <span>{reserva.actividadNombre}</span>
            <span>{reserva.horarioInicio ? formatearFecha(reserva.horarioInicio) : '-'}</span>
            <span>{reserva.estado}</span>
            <span>{reserva.asistencia ? 'Presente' : 'Pendiente'}</span>
            <span>
              <button
                className="ghost-button"
                disabled={loading || reserva.estado !== 'Activa'}
                onClick={() => onCancelar(reserva.idReserva)}
              >
                Cancelar
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function EntrenadoresPanel({
  entrenadores,
  loading,
  onEliminar,
  onGuardar,
}: {
  entrenadores: Usuario[]
  loading: boolean
  onEliminar: (id: number) => void
  onGuardar: (payload: CrearEntrenador) => void
}) {
  const [form, setForm] = useState(emptyEntrenador)

  return (
    <section className="content-grid">
      <div className="panel">
        <div className="panel-heading">
          <h2>Entrenadores</h2>
          <span>{entrenadores.length} registros</span>
        </div>
        <div className="table">
          {entrenadores.map((entrenador) => (
            <div className="table-row" key={entrenador.idUsuario}>
              <span>{entrenador.nombre}</span>
              <span>{entrenador.correo}</span>
              <span>{entrenador.telefono || '-'}</span>
              <span>
                <button
                  className="danger"
                  disabled={loading}
                  onClick={() => onEliminar(entrenador.idUsuario)}
                >
                  Eliminar
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <form
        className="panel compact-form"
        onSubmit={(event) => {
          event.preventDefault()
          onGuardar(form)
          setForm(emptyEntrenador)
        }}
      >
        <h2>Nuevo entrenador</h2>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(event) => setForm({ ...form, nombre: event.target.value })}
        />
        <input
          placeholder="Correo"
          type="email"
          value={form.correo}
          onChange={(event) => setForm({ ...form, correo: event.target.value })}
        />
        <input
          placeholder="Telefono"
          value={form.telefono}
          onChange={(event) => setForm({ ...form, telefono: event.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm({ ...form, password: event.target.value })
          }
        />
        <button disabled={loading}>Guardar entrenador</button>
      </form>
    </section>
  )
}

function AsistenciaPanel({
  actividades,
  actividadSeleccionada,
  inscritos,
  loading,
  onActividadChange,
  onMarcar,
}: {
  actividades: Actividad[]
  actividadSeleccionada: number
  inscritos: Inscrito[]
  loading: boolean
  onActividadChange: (id: number) => void
  onMarcar: (idReserva: number, asistencia: boolean) => void
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Lista de inscritos</h2>
        <select
          value={actividadSeleccionada}
          onChange={(event) => onActividadChange(Number(event.target.value))}
        >
          <option value={0}>Seleccionar actividad</option>
          {actividades.map((actividad) => (
            <option key={actividad.idActividad} value={actividad.idActividad}>
              {actividad.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="table">
        {inscritos.map((inscrito) => (
          <div className="table-row" key={inscrito.idReserva}>
            <span>{inscrito.nombre}</span>
            <span>{inscrito.correo}</span>
            <span>{inscrito.asistencia ? 'Presente' : 'Pendiente'}</span>
            <span>
              <button
                disabled={loading}
                onClick={() => onMarcar(inscrito.idReserva, !inscrito.asistencia)}
              >
                {inscrito.asistencia ? 'Marcar ausente' : 'Marcar presente'}
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReportesPanel({
  loading,
  reporte,
  onExportarCsv,
  onGenerar,
}: {
  loading: boolean
  reporte: ReporteGenerado | null
  onExportarCsv: (fechaInicio: string, fechaFin: string) => void
  onGenerar: (fechaInicio: string, fechaFin: string) => void
}) {
  const [rango, setRango] = useState({ fechaInicio: today, fechaFin: today })

  return (
    <section className="panel report-panel">
      <form
        className="report-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          onGenerar(rango.fechaInicio, rango.fechaFin)
        }}
      >
        <input
          type="date"
          value={rango.fechaInicio}
          onChange={(event) =>
            setRango({ ...rango, fechaInicio: event.target.value })
          }
        />
        <input
          type="date"
          value={rango.fechaFin}
          onChange={(event) =>
            setRango({ ...rango, fechaFin: event.target.value })
          }
        />
        <button disabled={loading}>Generar</button>
        <button
          className="ghost-button"
          disabled={loading}
          type="button"
          onClick={() => onExportarCsv(rango.fechaInicio, rango.fechaFin)}
        >
          CSV
        </button>
      </form>

      <div className="chart-grid">
        {(reporte?.asistenciaPorActividad ?? []).map((item) => (
          <article className="bar-item" key={item.idActividad}>
            <div>
              <strong>{item.actividad}</strong>
              <span>{item.porcentajeAsistencia}% asistencia</span>
            </div>
            <div className="bar-track">
              <span style={{ width: `${Math.min(item.porcentajeAsistencia, 100)}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function extraerMensaje(error: unknown) {
  if (error instanceof ApiError && error.data?.mensaje) return error.data.mensaje
  if (error instanceof Error) return error.message
  return 'No se pudo completar la accion.'
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatearHora(value: string) {
  return new Intl.DateTimeFormat('es-GT', {
    timeStyle: 'short',
  }).format(new Date(value))
}

export default App


