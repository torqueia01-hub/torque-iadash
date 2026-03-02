import { LayoutGrid, Users, Wrench, Car, BarChart3, Package, LogOut, Settings, UserCog, ShoppingBag, AlertTriangle } from 'lucide-react'
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">

      {/* AQUI ENTRA A LOGO 3 (TEXTO) */}
      <div className="h-16 flex items-center justify-center px-6 border-b border-slate-800">
        <img src="/logo-texto.png" alt="Torque IA" className="h-8 object-contain" />
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              to={item.href}
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
  )
}