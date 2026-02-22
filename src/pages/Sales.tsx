import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Loader2, DollarSign, Target, TrendingUp, TrendingDown, AlertTriangle, User, ShoppingBag } from 'lucide-react'

export function Sales() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  
  // NOVO: Estado para guardar a margem mínima dinâmica
  const [minMargin, setMinMargin] = useState<number>(40)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [ordersRes, goalsRes] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select('vendedor, valor_total, custo_total, margem_lucro, status, data_abertura')
          .not('vendedor', 'is', null),
        supabase
          .from('financial_goals')
          .select('min_margin_percentage')
          .single()
      ])

      if (ordersRes.data) setOrders(ordersRes.data)
      if (goalsRes.data && goalsRes.data.min_margin_percentage) {
        setMinMargin(Number(goalsRes.data.min_margin_percentage))
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredOrders = () => {
    return orders.filter(o => {
      if (!o.data_abertura) return true
      const data = new Date(o.data_abertura)
      const matchInicio = dataInicio ? data >= new Date(dataInicio) : true
      const matchFim = dataFim ? data <= new Date(dataFim + 'T23:59:59') : true
      return matchInicio && matchFim
    })
  }

  const filteredOrders = getFilteredOrders()

  const salesMap: Record<string, any> = {}
  filteredOrders.forEach(o => {
    const nome = o.vendedor
    if (!salesMap[nome]) {
      salesMap[nome] = {
        nome,
        totalOS: 0,
        osFechadas: 0,
        osAbertas: 0,
        faturamento: 0,
        custoTotal: 0,
        margens: [],
      }
    }
    const s = salesMap[nome]
    s.totalOS++
    if (o.status === 'fechada') {
      s.osFechadas++
      s.faturamento += Number(o.valor_total || 0)
      s.custoTotal += Number(o.custo_total || 0)
    } else {
      s.osAbertas++
    }
    if (o.margem_lucro) s.margens.push(Number(o.margem_lucro))
  })

  const salespeople = Object.values(salesMap).map((s: any) => ({
    ...s,
    ticketMedio: s.osFechadas > 0 ? s.faturamento / s.osFechadas : 0,
    margemMedia: s.margens.length > 0 ? s.margens.reduce((a: number, b: number) => a + b, 0) / s.margens.length : 0,
    lucro: s.faturamento - s.custoTotal,
    taxaConversao: s.totalOS > 0 ? (s.osFechadas / s.totalOS) * 100 : 0,
  })).sort((a, b) => b.faturamento - a.faturamento)

  const totalOS = salespeople.reduce((s, v) => s + v.totalOS, 0)
  const totalFaturamento = salespeople.reduce((s, v) => s + v.faturamento, 0)
  const totalOsFechadas = salespeople.reduce((s, v) => s + v.osFechadas, 0)
  const ticketMedioGeral = totalOsFechadas > 0 ? totalFaturamento / totalOsFechadas : 0
  const taxaConversaoGeral = totalOS > 0 ? (totalOsFechadas / totalOS) * 100 : 0
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  // Função dinâmica baseada na margem configurada
  const getMargemStyle = (margem: number) => {
    if (margem >= minMargin + 15) return { color: 'text-emerald-400', icon: TrendingUp,    label: 'Excelente' }
    if (margem >= minMargin)      return { color: 'text-blue-400',    icon: TrendingUp,    label: 'Bom' }
    if (margem >= minMargin - 10) return { color: 'text-orange-400',  icon: TrendingDown,  label: 'Atenção' }
    return                        { color: 'text-rose-400',           icon: AlertTriangle, label: 'Crítico' }
  }

  const getMedalhao = (index: number) => {
    if (index === 0) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    if (index === 1) return 'bg-slate-400/20 text-slate-300 border-slate-400/30'
    if (index === 2) return 'bg-orange-700/20 text-orange-400 border-orange-700/30'
    return 'bg-slate-700/50 text-slate-400 border-slate-600/30'
  }

  const getConversaoStyle = (taxa: number) => {
    if (taxa >= 70) return 'text-emerald-400'
    if (taxa >= 50) return 'text-blue-400'
    if (taxa >= 30) return 'text-orange-400'
    return 'text-rose-400'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            Desempenho de Vendas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Ranking e produtividade dos vendedores</p>
        </div>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Vendedores Ativos
            </p>
            <h3 className="text-3xl font-bold text-white mt-1">{salespeople.length}</h3>
            <p className="text-slate-500 text-xs mt-1">no período selecionado</p>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" /> OS no Período
            </p>
            <h3 className="text-3xl font-bold text-white mt-1">{totalOS}</h3>
            <p className="text-slate-500 text-xs mt-1">
              conversão: <span className={getConversaoStyle(taxaConversaoGeral)}>{taxaConversaoGeral.toFixed(1)}%</span>
            </p>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" /> Faturamento Total
            </p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1">{fmt(totalFaturamento)}</h3>
            <p className="text-slate-500 text-xs mt-1">OS fechadas</p>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Ticket Médio Geral
            </p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1">{fmt(ticketMedioGeral)}</h3>
            <p className="text-slate-500 text-xs mt-1">{totalOsFechadas} OS fechadas</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-white font-semibold">Ranking de Vendas</h2>
            <span className="text-xs text-slate-500">{salespeople.length} vendedores</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-slate-700/50 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Vendedor</th>
                  <th className="px-6 py-4 text-center">OS Total</th>
                  <th className="px-6 py-4 text-center">Fechadas</th>
                  <th className="px-6 py-4 text-center">Em Aberto</th>
                  <th className="px-6 py-4 text-center">Conversão</th>
                  <th className="px-6 py-4 text-right">Faturamento</th>
                  <th className="px-6 py-4 text-right">Lucro Gerado</th>
                  <th className="px-6 py-4 text-right">Ticket Médio</th>
                  <th className="px-6 py-4 text-center">Margem Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                      <p className="text-slate-400">Carregando vendedores...</p>
                    </td>
                  </tr>
                ) : salespeople.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                      Nenhum dado encontrado para o período.
                    </td>
                  </tr>
                ) : (
                  salespeople.map((vend, index) => {
                    const margemStyle = getMargemStyle(vend.margemMedia)
                    const MargemIcon = margemStyle.icon
                    return (
                      <tr key={vend.nome} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${getMedalhao(index)}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-300" />
                            </div>
                            <span className="text-white font-medium">{vend.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-white">{vend.totalOS}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {vend.osFechadas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            vend.osAbertas > 0
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-slate-700/50 text-slate-500 border-slate-600/30'
                          }`}>
                            {vend.osAbertas}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold text-sm ${getConversaoStyle(vend.taxaConversao)}`}>
                            {vend.taxaConversao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-white">{fmt(vend.faturamento)}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-400">{fmt(vend.lucro)}</td>
                        <td className="px-6 py-4 text-right font-medium text-purple-400">{fmt(vend.ticketMedio)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className={`flex items-center justify-center gap-1.5 ${margemStyle.color}`}>
                            <MargemIcon className="w-4 h-4" />
                            <span className="font-bold">{vend.margemMedia.toFixed(1)}%</span>
                            <span className="text-xs opacity-70">({margemStyle.label})</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerta de Baixa Conversão */}
        {salespeople.filter(v => v.taxaConversao < 50).length > 0 && (
          <div className="mt-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-rose-400 font-semibold">Atenção: Vendedores com Baixa Taxa de Conversão</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {salespeople.filter(v => v.taxaConversao < 50).map(v => (
                <div key={v.nome} className="bg-slate-800 border border-rose-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
                  <User className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{v.nome}</p>
                    <p className="text-rose-400 text-xs">{v.taxaConversao.toFixed(1)}% de conversão</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOVO: Alerta de Margem Abaixo da Meta Dinâmica */}
        {salespeople.filter(v => v.margemMedia < minMargin).length > 0 && (
          <div className="mt-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="text-orange-400 font-semibold">Atenção: Vendedores Abaixo da Meta de Margem ({minMargin}%)</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {salespeople.filter(v => v.margemMedia < minMargin).map(v => (
                <div key={v.nome} className="bg-slate-800 border border-orange-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
                  <User className="w-4 h-4 text-orange-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{v.nome}</p>
                    <p className="text-orange-400 text-xs">{v.margemMedia.toFixed(1)}% de margem média</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}