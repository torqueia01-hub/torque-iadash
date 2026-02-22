import { Target, AlertTriangle, TrendingUp, Minus } from 'lucide-react'

interface TicketGoalCardProps {
  currentTicket: number
  fixedCost: number
  desiredProfit: number
  monthlyOrders: number
}

export function TicketGoalCard({ currentTicket, fixedCost, desiredProfit, monthlyOrders }: TicketGoalCardProps) {
  const breakEvenTicket = monthlyOrders > 0 ? fixedCost / monthlyOrders : 0
  const profitTicket = monthlyOrders > 0 ? (fixedCost + desiredProfit) / monthlyOrders : 0

  const getStatus = () => {
    if (currentTicket >= profitTicket) return { label: 'Lucro garantido!', color: 'text-emerald-400', icon: TrendingUp, bg: 'bg-emerald-500/10 border-emerald-500/30' }
    if (currentTicket >= breakEvenTicket) return { label: 'Pagando contas, sem lucro', color: 'text-orange-400', icon: Minus, bg: 'bg-orange-500/10 border-orange-500/30' }
    return { label: 'Abaixo do ponto de equilíbrio!', color: 'text-rose-400', icon: AlertTriangle, bg: 'bg-rose-500/10 border-rose-500/30' }
  }

  const status = getStatus()
  const StatusIcon = status.icon

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className={`bg-slate-800 p-6 rounded-2xl border shadow-sm ${status.bg}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-slate-400 text-sm font-medium">Ticket Médio</p>
          <h3 className="text-2xl font-bold text-white mt-1">{fmt(currentTicket)}</h3>
        </div>
        <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center">
          <Target className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      <div className={`flex items-center space-x-2 mb-4 ${status.color}`}>
        <StatusIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{status.label}</span>
      </div>

      <div className="space-y-2 border-t border-slate-700 pt-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
            Mín. pagar contas
          </span>
          <span className="text-rose-400 font-bold">{fmt(breakEvenTicket)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            Meta de lucro
          </span>
          <span className="text-emerald-400 font-bold">{fmt(profitTicket)}</span>
        </div>
        {currentTicket < profitTicket && (
          <div className="mt-3 bg-slate-900/60 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-slate-400">Faltam <span className="text-white font-bold">{fmt(profitTicket - currentTicket)}</span> por OS para atingir a meta de lucro</p>
          </div>
        )}
      </div>
    </div>
  )
}