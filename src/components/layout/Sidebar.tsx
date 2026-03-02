import { useState } from 'react'
import { LayoutGrid, Users, Wrench, Car, BarChart3, Package, LogOut, Settings, UserCog, ShoppingBag, AlertTriangle, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const navigation = [
  { name: 'Painel Executivo',        href: '/',          icon: LayoutGrid    },
  { name: 'Central de Alertas',      href: '/reports',   icon: AlertTriangle },
  { name: 'Máquina de Retenção',     href: '/retention', icon: Users         },
  { name: 'Ordens de Serviço',       href: '/orders',    icon: Wrench        },
  { name: 'Histórico de Frota',      href: '/fleet',     icon: Car           },
  { name: 'Inteligência de Margem',  href: '/margin',    icon: BarChart3     },
  { name: 'Inteligência de Estoque', href: '/inventory', icon: Package       },
  { name: 'Equipe de Mecânicos',     href: '/mechanics', icon: UserCog       },
  { name: 'Equipe de Vendas',        href: '/sales',     icon: ShoppingBag   },
  { name: 'Configurações',           href: '/settings',  icon: Settings      },
]

export function Sidebar() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Botão Flutuante para abrir o menu no Celular */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 p-3.5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-transform active:scale-95"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Fundo escuro embaçado quando o menu está aberto no celular */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Lateral (Fixo no PC, Gaveta Deslizante no Celular) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* CABEÇALHO DO MENU */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-slate-800 overflow-hidden">
          <div className="flex-1 min-w-0 flex items-center mr-2">
            <img 
              src="/logo-texto.png" 
              alt="Torque IA" 
              className="h-9 md:h-10 w-auto max-w-full object-contain" 
            />
          </div>
          {/* Botão de Fechar o menu no celular */}
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white p-2 shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>

      </div>
    </>
  )
}