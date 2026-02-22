import { useState, useEffect } from 'react'
import { Search, Filter, MoreVertical, Loader2, AlertTriangle, TrendingUp, Activity, Target, User } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Orders() {
  const [ordersList, setOrdersList] = useState<any[]>([])
  const [goals, setGoals] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    try {
      const [ordersRes, goalsRes] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select('*, clientes(nome), veiculos(placa, marca, modelo)')
          .order('data_abertura', { ascending: false }),
        supabase.from('financial_goals').select('*').single()
      ])
      if (ordersRes.data) setOrdersList(ordersRes.data)
      if (goalsRes.data) setGoals(goalsRes.data)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const profitTicket = goals
    ? (goals.monthly_fixed_cost + goals.desired_monthly_profit) / goals.average_monthly_orders
    : null
  const breakEvenTicket = goals
    ? goals.monthly_fixed_cost / goals.average_monthly_orders
    : null
    
  // Lendo a Margem Mínima do banco (ou usando 40 como fallback)
  const minMargin = goals?.min_margin_percentage ? Number(goals.min_margin_percentage) : 40

  const getMarginIntelligence = (value: number, cost: number) => {
    const profit = value - cost
    const marginPercentage = value > 0 ? (profit / value) * 100 : 0
    
    if (marginPercentage < minMargin) return { label: 'Abaixo da Meta', value: `${marginPercentage.toFixed(1)}%`, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: AlertTriangle }
    if (marginPercentage >= minMargin + 15) return { label: 'Excelente', value: `${marginPercentage.toFixed(1)}%`, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: TrendingUp }
    
    return { label: 'Meta Atingida', value: `${marginPercentage.toFixed(1)}%`, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Activity }
  }

  const getTicketAlert = (value: number) => {
    if (!profitTicket || !breakEvenTicket) return null
    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
    if (value >= profitTicket) return { text: 'Meta de lucro atingida ✓', color: 'text-emerald-400' }
    if (value >= breakEvenTicket) return { text: `Faltam ${fmt(profitTicket - value)} p/ lucro`, color: 'text-orange-400' }
    return { text: `Faltam ${fmt(breakEvenTicket - value)} p/ pagar contas`, color: 'text-rose-400' }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'fechada':    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'aberta':     return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'aguardando': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      case 'orcamento':  return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default:           return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'fechada':    return 'Concluído'
      case 'aberta':     return 'Em Andamento'
      case 'aguardando': return 'Aguardando'
      case 'orcamento':  return 'Orçamento'
      default:           return status
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50">
        <h1 className="text-xl font-semibold text-white tracking-wide">Gestão de Ordens de Serviço</h1>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">

        {goals && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 border border-rose-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                <span className="text-slate-400 text-sm">Ticket mínimo (pagar contas)</span>
              </div>
              <span className="text-rose-400 font-bold">{fmt(breakEvenTicket!)}</span>
            </div>
            <div className="bg-slate-800 border border-emerald-500/20 rounded-xl px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 text-sm">Ticket meta (lucro)</span>
              </div>
              <span className="text-emerald-400 font-bold">{fmt(profitTicket!)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input type="text" placeholder="Buscar por OS, cliente ou placa..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium flex items-center space-x-2 hover:bg-slate-700 transition-colors">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-slate-700/50 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">OS</th>
                  <th className="px-6 py-4">Cliente</th>
                  {/* NOVA COLUNA ADICIONADA AQUI */}
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Valor Final</th>
                  <th className="px-6 py-4 text-center">Meta de Ticket</th>
                  <th className="px-6 py-4 text-center">Margem</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    {/* COLSPAN ATUALIZADO PARA 8 */}
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                      <p>Buscando dados na nuvem...</p>
                    </td>
                  </tr>
                ) : ordersList.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Nenhuma ordem encontrada.</td></tr>
                ) : (
                  ordersList.map((order) => {
                    const intelligence = getMarginIntelligence(order.valor_total, order.custo_total || 0)
                    const MarginIcon = intelligence.icon
                    const ticketAlert = getTicketAlert(order.valor_total)
                    const veiculo = order.veiculos
                    const cliente = order.clientes

                    return (
                      <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-emerald-400">{order.numero_os}</td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{cliente?.nome || '—'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {veiculo ? `${veiculo.marca} ${veiculo.modelo} • ${veiculo.placa}` : '—'}
                          </p>
                        </td>
                        
                        {/* NOVO DADO DO VENDEDOR AQUI */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-300">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-sm">{order.vendedor || '—'}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-white">{fmt(order.valor_total)}</td>
                        <td className="px-6 py-4 text-center">
                          {ticketAlert ? (
                            <span className={`text-xs font-medium ${ticketAlert.color}`}>{ticketAlert.text}</span>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg border ${intelligence.color}`}>
                            <MarginIcon className="w-4 h-4" />
                            <div className="flex flex-col items-start">
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{intelligence.label}</span>
                              <span className="font-bold text-sm leading-none">{intelligence.value}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button className="text-slate-500 hover:text-emerald-400 transition-colors p-1 rounded-md hover:bg-slate-700">
                            <MoreVertical className="w-5 h-5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}