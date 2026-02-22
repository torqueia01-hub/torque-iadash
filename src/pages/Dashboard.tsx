import { useState, useEffect } from 'react'
import { RevenueChart } from '../components/dashboard/RevenueChart'
import { RecentOrders } from '../components/dashboard/RecentOrders'
import { RetentionWidget } from '../components/dashboard/RetentionWidget'
import { MarginWidget } from '../components/dashboard/MarginWidget'
import { MetricCard } from '../components/dashboard/MetricCard'
import { TicketIntelligenceWidget } from '../components/dashboard/TicketIntelligenceWidget'
import { supabase } from '../lib/supabase'
import { DollarSign, Wrench, Car, Target } from 'lucide-react'

export function Dashboard() {
  const [goals, setGoals] = useState<any>(null)
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [goalsRes, ordersRes] = await Promise.all([
      supabase.from('financial_goals').select('*').single(),
      supabase.from('ordens_servico').select('valor_total, custo_total, status, data_abertura')
    ])
    if (goalsRes.data) setGoals(goalsRes.data)
    if (ordersRes.data) setAllOrders(ordersRes.data)
  }

  const getFilteredOrders = () => {
    return allOrders.filter(o => {
      if (!o.data_abertura) return true
      const data = new Date(o.data_abertura)
      const matchInicio = dataInicio ? data >= new Date(dataInicio) : true
      const matchFim = dataFim ? data <= new Date(dataFim + 'T23:59:59') : true
      return matchInicio && matchFim
    })
  }

  const filteredOrders = getFilteredOrders()
  const veiculosNaOficina = allOrders.filter(o => o.status !== 'fechada').length
  const closedOrders = filteredOrders.filter(o => o.status === 'fechada')
  const totalRevenue = closedOrders.reduce((sum, o) => sum + Number(o.valor_total || 0), 0)
  const currentTicket = closedOrders.length > 0 ? totalRevenue / closedOrders.length : 0
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50">
        <h1 className="text-xl font-semibold text-white tracking-wide">Visão Geral do Negócio</h1>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          {(dataInicio || dataFim) && (
            <button
              onClick={() => { setDataInicio(''); setDataFim('') }}
              className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Ticket Médio"
            value={fmt(currentTicket)}
            icon={<Target className="w-6 h-6 text-purple-400" />}
            trend="Período"
            trendUp={true}
          />
          <MetricCard
            title="Faturamento"
            value={fmt(totalRevenue)}
            icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
            trend="Período"
            trendUp={true}
          />
          <MetricCard
            title="OS Fechadas"
            value={String(closedOrders.length)}
            icon={<Wrench className="w-6 h-6 text-blue-400" />}
            trend="Período"
            trendUp={true}
          />
          <MetricCard
            title="Veículos na Oficina"
            value={String(veiculosNaOficina)}
            icon={<Car className="w-6 h-6 text-orange-400" />}
            trend="Pátio atual"
            trendUp={true}
          />
        </div>

        <div className="mt-6">
          <TicketIntelligenceWidget orders={closedOrders} goals={goals} />
        </div>

        <RevenueChart />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <RetentionWidget />
          <MarginWidget />
        </div>

        <RecentOrders />

      </main>
    </div>
  )
}