import { useState, useEffect } from 'react'
import { getProductos, createProducto, addIngrediente } from '../services/api'

const Alerta = ({ tipo, mensaje }) => {
  if (!mensaje) return null
  const estilos = {
    error   : 'bg-red-50 border-red-400 text-red-700',
    success : 'bg-blue-50 border-blue-400 text-blue-700',
    warning : 'bg-yellow-50 border-yellow-400 text-yellow-700',
    info    : 'bg-sky-50 border-sky-400 text-sky-700',
  }
  const iconos = { error: '❌', success: '✅', warning: '⚠️', info: 'ℹ️' }
  return (
    <div className={`flex items-center gap-2 border-l-4 rounded-xl px-4 py-3 mt-3 text-sm font-medium ${estilos[tipo]}`}>
      <span>{iconos[tipo]}</span>
      <span>{mensaje}</span>
    </div>
  )
}

const Campo = ({ error, children }) => (
  <div className="flex flex-col gap-1">
    {children}
    {error && <p className="text-red-500 text-xs font-medium pl-1">⚠ {error}</p>}
  </div>
)

function Productos() {
  const [productos,       setProductos]       = useState([])
  const [nombreProducto,  setNombreProducto]  = useState('')
  const [ingredientes,    setIngredientes]    = useState([])
  const [cargando,        setCargando]        = useState(false)
  const [alerta,          setAlerta]          = useState({ tipo: '', mensaje: '' })
  const [ingredienteForm, setIngredienteForm] = useState({
    nombre: '', unidad: 'g', cant_comprada: '', precio_compra: '', cant_usada: ''
  })
  const [erroresProducto,    setErroresProducto]    = useState({})
  const [erroresIngrediente, setErroresIngrediente] = useState({})

  useEffect(() => { cargarProductos() }, [])

  const cargarProductos = async () => {
    const res = await getProductos()
    setProductos(res.data)
  }

  const clp = (valor) => `$${Math.round(valor).toLocaleString('es-CL')}`

  const costoPreview = () => {
    const { cant_comprada, precio_compra, cant_usada } = ingredienteForm
    if (cant_comprada > 0 && precio_compra > 0 && cant_usada > 0)
      return (cant_usada / cant_comprada) * precio_compra
    return null
  }

  const validarIngrediente = () => {
    const errores = {}
    const { nombre, cant_comprada, precio_compra, cant_usada } = ingredienteForm
    if (!nombre.trim())
      errores.nombre = 'El nombre del ingrediente es obligatorio'
    if (!cant_comprada || parseFloat(cant_comprada) <= 0)
      errores.cant_comprada = 'La cantidad comprada debe ser mayor a 0'
    if (!precio_compra || parseFloat(precio_compra) <= 0)
      errores.precio_compra = 'El precio debe ser mayor a 0'
    if (!cant_usada || parseFloat(cant_usada) <= 0)
      errores.cant_usada = 'La cantidad usada debe ser mayor a 0'
    else if (parseFloat(cant_usada) > parseFloat(cant_comprada))
      errores.cant_usada = 'No puede ser mayor a la cantidad total comprada'
    setErroresIngrediente(errores)
    return Object.keys(errores).length === 0
  }

  const validarProducto = () => {
    const errores = {}
    if (!nombreProducto.trim())
      errores.nombre = 'El nombre del producto es obligatorio'
    else if (nombreProducto.trim().length < 3)
      errores.nombre = 'El nombre debe tener al menos 3 caracteres'
    else if (productos.some(p => p.nombre.toLowerCase() === nombreProducto.trim().toLowerCase()))
      errores.nombre = `Ya existe un producto llamado "${nombreProducto.trim()}"`
    if (ingredientes.length === 0)
      errores.ingredientes = 'Debes agregar al menos un ingrediente'
    setErroresProducto(errores)
    return Object.keys(errores).length === 0
  }

  const agregarIngrediente = () => {
    if (!validarIngrediente()) return
    const { cant_usada, cant_comprada, precio_compra } = ingredienteForm
    const costo = (cant_usada / cant_comprada) * precio_compra
    setIngredientes([...ingredientes, { ...ingredienteForm, costo_proporcional: costo }])
    setIngredienteForm({ nombre: '', unidad: 'g', cant_comprada: '', precio_compra: '', cant_usada: '' })
    setErroresIngrediente({})
    setAlerta({ tipo: 'info', mensaje: `Ingrediente '${ingredienteForm.nombre}' agregado` })
    setTimeout(() => setAlerta({ tipo: '', mensaje: '' }), 3000)
  }

  const guardarProducto = async () => {
    if (!validarProducto()) return
    setCargando(true)
    try {
      const costo_total = ingredientes.reduce((sum, i) => sum + i.costo_proporcional, 0)
      const res         = await createProducto({ nombre: nombreProducto.trim(), costo_total })
      for (const ing of ingredientes) await addIngrediente(res.data.id, ing)
      setAlerta({ tipo: 'success', mensaje: `Producto '${nombreProducto}' guardado — Costo: ${clp(costo_total)}` })
      setNombreProducto('')
      setIngredientes([])
      setErroresProducto({})
      cargarProductos()
    } catch (e) {
      setAlerta({ tipo: 'error', mensaje: 'Error al guardar el producto.' })
    } finally {
      setCargando(false)
    }
  }

  const costoTotal = ingredientes.reduce((sum, i) => sum + i.costo_proporcional, 0)

  const inputClass = (error) =>
    `w-full border-2 rounded-xl px-4 py-3 focus:outline-none transition-all text-base
    ${error ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-sky-200 bg-white focus:border-blue-400'}`

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold border-b-4 pb-3 mb-6"
          style={{color: '#1565C0', borderColor: '#29B6F6'}}>
        🧪 Crear Producto
      </h1>

      <div className="bg-white rounded-2xl border border-sky-200 shadow-lg p-4 lg:p-6 mb-6">
        <h2 className="text-lg lg:text-xl font-semibold mb-4" style={{color: '#1976D2'}}>
          ➕ Nuevo Producto
        </h2>

        <Campo error={erroresProducto.nombre}>
          <input type="text" placeholder="📦 Nombre del producto"
            value={nombreProducto}
            onChange={e => { setNombreProducto(e.target.value); setErroresProducto({...erroresProducto, nombre: ''}) }}
            className={inputClass(erroresProducto.nombre)}/>
        </Campo>

        <h3 className="font-semibold mt-5 mb-3" style={{color: '#1976D2'}}>🧂 Ingredientes</h3>

        {/* Grid 1 col en móvil, 2 en desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
          <Campo error={erroresIngrediente.nombre}>
            <input type="text" placeholder="Nombre del ingrediente"
              value={ingredienteForm.nombre}
              onChange={e => { setIngredienteForm({...ingredienteForm, nombre: e.target.value}); setErroresIngrediente({...erroresIngrediente, nombre: ''}) }}
              className={inputClass(erroresIngrediente.nombre)}/>
          </Campo>

          <select value={ingredienteForm.unidad}
            onChange={e => setIngredienteForm({...ingredienteForm, unidad: e.target.value})}
            className="w-full border-2 border-sky-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 text-base">
            {['kg','g','L','mL','unidad','taza','otro'].map(u =>
              <option key={u} value={u}>{u}</option>
            )}
          </select>

          <Campo error={erroresIngrediente.cant_comprada}>
            <input type="number" placeholder="Cantidad total comprada" min="0"
              value={ingredienteForm.cant_comprada}
              onChange={e => { setIngredienteForm({...ingredienteForm, cant_comprada: e.target.value}); setErroresIngrediente({...erroresIngrediente, cant_comprada: ''}) }}
              className={inputClass(erroresIngrediente.cant_comprada)}/>
          </Campo>

          <Campo error={erroresIngrediente.precio_compra}>
            <input type="number" placeholder="Precio de compra total" min="0"
              value={ingredienteForm.precio_compra}
              onChange={e => { setIngredienteForm({...ingredienteForm, precio_compra: e.target.value}); setErroresIngrediente({...erroresIngrediente, precio_compra: ''}) }}
              className={inputClass(erroresIngrediente.precio_compra)}/>
          </Campo>

          <Campo error={erroresIngrediente.cant_usada}>
            <input type="number" placeholder="Cantidad usada en el producto" min="0"
              value={ingredienteForm.cant_usada}
              onChange={e => { setIngredienteForm({...ingredienteForm, cant_usada: e.target.value}); setErroresIngrediente({...erroresIngrediente, cant_usada: ''}) }}
              className={inputClass(erroresIngrediente.cant_usada)}/>
          </Campo>
        </div>

        {costoPreview() !== null && (
          <Alerta tipo="info" mensaje={`📊 Costo proporcional: ${clp(costoPreview())}`} />
        )}

        <div className="flex flex-col lg:flex-row gap-3 mt-4">
          <button onClick={agregarIngrediente}
            className="flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
            style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
            ➕ Agregar Ingrediente
          </button>
          <button onClick={() => { setIngredientes([]); setErroresProducto({...erroresProducto, ingredientes: ''}) }}
            className="py-3 px-6 rounded-xl font-semibold text-white bg-red-400 active:scale-95 transition-all">
            🗑️ Limpiar
          </button>
        </div>

        {erroresProducto.ingredientes && (
          <Alerta tipo="error" mensaje={erroresProducto.ingredientes} />
        )}

        {/* Tabla con scroll horizontal en móvil */}
        {ingredientes.length > 0 && (
          <div className="mt-4">
            <div className="overflow-x-auto rounded-xl border border-sky-200">
              <table className="w-full text-sm min-w-[500px]">
                <thead style={{background: '#E3F2FD'}}>
                  <tr>
                    {['Ingrediente','Unidad','Cant. Comprada','Cant. Usada','Costo'].map(h =>
                      <th key={h} className="px-3 py-2 text-left" style={{color: '#1565C0'}}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ingredientes.map((ing, i) => (
                    <tr key={i} className="border-t border-sky-100">
                      <td className="px-3 py-2">{ing.nombre}</td>
                      <td className="px-3 py-2">{ing.unidad}</td>
                      <td className="px-3 py-2">{ing.cant_comprada}</td>
                      <td className="px-3 py-2">{ing.cant_usada}</td>
                      <td className="px-3 py-2 font-semibold" style={{color: '#1565C0'}}>{clp(ing.costo_proporcional)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <p className="font-semibold" style={{color: '#1565C0'}}>
                💰 Costo total: <strong>{clp(costoTotal)}</strong>
              </p>
              <button onClick={guardarProducto} disabled={cargando}
                className="w-full lg:w-auto px-8 py-3 rounded-xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
                style={{background: 'linear-gradient(135deg, #29B6F6, #1565C0)'}}>
                {cargando ? '⏳ Guardando...' : '💾 Guardar Producto'}
              </button>
            </div>
          </div>
        )}

        <Alerta tipo={alerta.tipo} mensaje={alerta.mensaje} />
      </div>
    </div>
  )
}

export default Productos