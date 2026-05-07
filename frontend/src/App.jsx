import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import Recetas from './pages/Recetas'
import Pedidos from './pages/Pedidos'

function App() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const cerrarSidebar = () => setSidebarAbierto(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{background: 'linear-gradient(145deg, #E3F2FD 0%, #BBDEFB 30%, #ffffff 70%)'}}>

        {sidebarAbierto && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={cerrarSidebar}/>
        )}

        {/* Sidebar */}
        <div className={`fixed left-0 top-0 h-full w-64 text-white flex flex-col p-6 z-30 transition-transform duration-300
          ${sidebarAbierto ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
          style={{background: 'linear-gradient(180deg, #1565C0 0%, #1976D2 50%, #1E88E5 100%)'}}>

          <button onClick={cerrarSidebar}
            className="absolute top-4 right-4 text-white/70 hover:text-white lg:hidden text-xl">
            ✕
          </button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">🧁 Destello</h1>
            <p className="text-sm opacity-70">Pastelería & Coctelería</p>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {[
              { to: '/',        label: '🧪 Crear Producto' },
              { to: '/recetas', label: '📒 Recetas' },
              { to: '/ventas',  label: '🧾 Registrar Venta' },
              { to: '/pedidos', label: '📋 Pedidos' },
            ].map(item => (
              <NavLink key={item.to} to={item.to}
                onClick={cerrarSidebar}
                className={({isActive}) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                  ${isActive ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`
                }>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/20">
            <p className="text-xs opacity-50 text-center">✨ Hecho con amor y calidad</p>
          </div>
        </div>

        <button onClick={() => setSidebarAbierto(true)}
          className="fixed top-4 left-4 z-20 lg:hidden w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg"
          style={{background: '#1565C0'}}>
          ☰
        </button>

        <div className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
          <Routes>
            <Route path="/"        element={<Productos />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route path="/ventas"  element={<Ventas />} />
            <Route path="/pedidos" element={<Pedidos />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  )
}

export default App