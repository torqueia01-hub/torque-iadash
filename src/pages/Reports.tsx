import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  AlertTriangle, Clock, Package, Car, TrendingUp, Loader2, 
  RefreshCw, CheckCircle, TrendingDown, ShoppingCart, 
  ArrowUpRight, ArrowDownRight 
} from 'lucide-react'

export function Reports() {
  const [orders, setOrders] = useState<any[]>([])
  const [closedOrders, setClosedOrders] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // NOVO: Estado para armazenar a meta financeira global
  const [goals, setGoals] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [ordersRes, closedRes, produtosRes, goalsRes] = await Promise.all([
        supabase
          .from('ordens_servico')
          .select('*, clientes(nome), veiculos(placa, marca, modelo)')
          .neq('status', 'fechada'),
        supabase
          .from('ordens_servico')
          .select('*, clientes(nome), veiculos(placa, marca, modelo)')
          .eq('status', 'fechada'),
        supabase
          .from('produtos_servicos')
          .select('*')
          .eq('ativo', true),
        // Busca a configuração de metas
        supabase
          .from('financial_goals')
          .select('*')
          .single()
      ])

      if (ordersRes.data) setOrders(ordersRes.data)
      if (closedRes.data) setClosedOrders(closedRes.data)
      if (produtosRes.data) setProdutos(produtosRes.data)
      if (goalsRes.data) setGoals(goalsRes.data)
      
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const agora = new Date()
  const diaAtual = agora.getDate()
  const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate()
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const horasParadas = (dataStr: string) => {
    if (!dataStr) return 0
    return Math.floor((agora.getTime() - new Date(dataStr).getTime()) / (1000 * 60 * 60))
  }

  const diasParados = (dataStr: string) => {
    if (!dataStr) return 0
    return Math.floor((agora.getTime() - new Date(dataStr).getTime()) / (1000 * 60 * 60 * 24))
  }

  const allOrders = [...orders, ...closedOrders]

  // Lendo a Margem Mínima do banco (ou usando 40 como fallback)
  const minMargin = goals?.min_margin_percentage ? Number(goals.min_margin_percentage) : 40

  // 1. OS paradas sem movimentação há mais de 24h
  const osParadas = orders.filter(o =>
    (o.status === 'aberta' || o.status === 'aguardando') &&
    horasParadas(o.data_abertura) > 24
  ).sort((a, b) => horasParadas(b.data_abertura) - horasParadas(a.data_abertura))

  // 2. Mecânicos com gargalo (3+ OS em aberto)
  const mechanicsMap: Record<string, number> = {}
  orders.forEach(o => {
    if (o.mecanico) mechanicsMap[o.mecanico] = (mechanicsMap[o.mecanico] || 0) + 1
  })
  const mecanicosGargalo = Object.entries(mechanicsMap)
    .filter(([, count]) => count >= 3)
    .map(([nome, count]) => ({ nome, count }))
    .sort((a, b) => b.count - a.count)

  // 3. Peças paradas sem giro
  const pecasParadas = produtos.filter(p =>
    p.tipo === 'peca' && Number(p.estoque_atual) > Number(p.estoque_minimo) * 2
  ).sort((a, b) => Number(b.estoque_atual) - Number(a.estoque_atual))

  // 4. Carros prontos não buscados
  const carrosProntos = orders.filter(o =>
    o.data_conclusao && o.status !== 'fechada'
  ).sort((a, b) => diasParados(b.data_conclusao) - diasParados(a.data_conclusao))

  // 5. OS com Margem abaixo da configurada (Agora é DINÂMICO!)
  const osBaixaMargem = allOrders.filter(o => 
    o.margem_lucro !== null && Number(o.margem_lucro) < minMargin
  ).sort((a, b) => Number(a.margem_lucro) - Number(b.margem_lucro))

  // 6. Risco de Ruptura (Peças Faltando)
  const pecasEmRisco = produtos.filter(p => 
    p.tipo === 'peca' && Number(p.estoque_atual) <= Number(p.estoque_minimo)
  ).sort((a, b) => {
    const proporcaoA = Number(a.estoque_minimo) > 0 ? Number(a.estoque_atual) / Number(a.estoque_minimo) : 0
    const proporcaoB = Number(b.estoque_minimo) > 0 ? Number(b.estoque_atual) / Number(b.estoque_minimo) : 0
    return proporcaoA - proporcaoB
  })

  // 7. CÁLCULO DE CRESCIMENTO
  const mesAtual = agora.getMonth()
  const anoAtual = agora.getFullYear()
  const mesPassado = mesAtual === 0 ? 11 : mesAtual - 1
  const anoPassado = mesAtual === 0 ? anoAtual - 1 : anoAtual

  let faturamentoAcumulado = 0
  let faturamentoMesPassadoAteHoje = 0

  closedOrders.forEach(o => {
    if (!o.data_abertura) return
    const dataOs = new Date(o.data_abertura)
    
    if (dataOs.getMonth() === mesAtual && dataOs.getFullYear() === anoAtual) {
      faturamentoAcumulado += Number(o.valor_total || 0)
    }
    if (dataOs.getMonth() === mesPassado && dataOs.getFullYear() === anoPassado && dataOs.getDate() <= diaAtual) {
      faturamentoMesPassadoAteHoje += Number(o.valor_total || 0)
    }
  })

  const crescimentoPercentual = faturamentoMesPassadoAteHoje > 0 
    ? ((faturamentoAcumulado / faturamentoMesPassadoAteHoje) - 1) * 100 
    : 100
  
  const mediaDiaria = diaAtual > 0 ? faturamentoAcumulado / diaAtual : 0
  const projecao = mediaDiaria * diasNoMes
  const diasRestantes = diasNoMes - diaAtual

  const totalAlerts = osParadas.length + mecanicosGargalo.length + pecasParadas.length + carrosProntos.length + osBaixaMargem.length + pecasEmRisco.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Central de Alertas e Tomada de Decisão
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-slate-400">Analisando dados estratégicos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Resumo geral */}
            <div className={`rounded-2xl border p-5 flex items-center justify-between ${
              totalAlerts === 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
            }`}>
              <div className="flex items-center gap-3">
                {totalAlerts === 0 ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <AlertTriangle className="w-6 h-6 text-rose-400" />}
                <div>
                  <p className={`font-bold text-lg ${totalAlerts === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalAlerts === 0 ? 'Tudo sob controle!' : `${totalAlerts} alertas pendentes de ação`}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {totalAlerts === 0 ? 'Nenhum gargalo identificado na operação.' : 'Aja agora para evitar perda de dinheiro e atrasos.'}
                  </p>
                </div>
              </div>
            </div>

            {/* SEÇÃO ESTRATÉGICA: PROJEÇÃO E TERMÔMETRO */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-white font-semibold">Termômetro de Crescimento & Projeção</h2>
                </div>
                <span className="text-xs text-slate-500">Dia {diaAtual} de {diasNoMes} ({Math.round((diaAtual / diasNoMes) * 100)}% concluído)</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Faturado (Mês Atual)</p>
                  <p className="text-2xl font-bold text-white mt-1">{fmt(faturamentoAcumulado)}</p>
                  <p className="text-slate-500 text-xs mt-1">Acumulado até hoje</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 relative overflow-hidden">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Mês Passado (Até dia {diaAtual})</p>
                  <p className="text-2xl font-bold text-slate-300 mt-1">{fmt(faturamentoMesPassadoAteHoje)}</p>
                  <div className={`mt-1.5 flex items-center gap-1 text-xs font-bold ${crescimentoPercentual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {crescimentoPercentual >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    <span>{Math.abs(crescimentoPercentual).toFixed(1)}% {crescimentoPercentual >= 0 ? 'de crescimento' : 'de queda'}</span>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-emerald-400/80 text-xs uppercase tracking-wider">Projeção Final do Mês</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(projecao)}</p>
                  <p className="text-emerald-500/70 text-xs mt-1">Mantendo {fmt(mediaDiaria)}/dia</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">Tempo Restante</p>
                  <p className="text-2xl font-bold text-white mt-1">{diasRestantes} dias</p>
                  <p className="text-slate-500 text-xs mt-1">Para o fechamento de caixa</p>
                </div>
              </div>
            </div>

            {/* ALERTA: LISTA DE COMPRAS URGENTE (Ruptura) */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className={`px-6 py-4 flex items-center justify-between border-b ${
                pecasEmRisco.length > 0 ? 'border-orange-500/20 bg-orange-500/5' : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <ShoppingCart className={`w-5 h-5 ${pecasEmRisco.length > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
                  <h2 className="text-white font-semibold">Risco de Ruptura (Lista de Compras)</h2>
                  {pecasEmRisco.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">{pecasEmRisco.length}</span>}
                </div>
              </div>
              
              {pecasEmRisco.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Estoque protegido. Nenhuma peça abaixo do limite.
                </div>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0 z-10 border-b border-slate-700 shadow-sm">
                      <tr>
                        <th className="px-6 py-4">Produto / Peça</th>
                        <th className="px-6 py-4 text-center">Estoque Atual</th>
                        <th className="px-6 py-4 text-center">Mínimo Segurança</th>
                        <th className="px-6 py-4 text-center">Situação</th>
                        <th className="px-6 py-4 text-right">Potencial Venda Unit.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {pecasEmRisco.map(p => {
                        const proporcao = Number(p.estoque_minimo) > 0 ? (Number(p.estoque_atual) / Number(p.estoque_minimo)) * 100 : 0
                        const isZerado = Number(p.estoque_atual) <= 0
                        return (
                          <tr key={p.id} className="hover:bg-slate-700/30">
                            <td className="px-6 py-4 text-white font-medium">{p.descricao}</td>
                            <td className={`px-6 py-4 text-center font-bold text-lg ${isZerado ? 'text-rose-500' : 'text-orange-400'}`}>{p.estoque_atual}</td>
                            <td className="px-6 py-4 text-center text-slate-500">{p.estoque_minimo}</td>
                            <td className="px-6 py-4 text-center">
                              {isZerado ? (
                                <span className="px-2.5 py-1.5 rounded text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">ESGOTADO</span>
                              ) : (
                                <span className="px-2.5 py-1.5 rounded text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">{proporcao.toFixed(0)}% da Margem</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-emerald-400 font-medium">{fmt(p.preco_venda)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ALERTA: OS com Baixa Margem */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className={`px-6 py-4 flex items-center justify-between border-b ${
                osBaixaMargem.length > 0 ? 'border-rose-500/20 bg-rose-500/5' : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <TrendingDown className={`w-5 h-5 ${osBaixaMargem.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
                  <h2 className="text-white font-semibold">OS com Baixa Rentabilidade</h2>
                  {osBaixaMargem.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">{osBaixaMargem.length}</span>}
                </div>
                {/* O TEXTO AGORA É DINÂMICO! */}
                <span className="text-xs text-slate-500">Margem abaixo de {minMargin}% (Risco Operacional)</span>
              </div>
              
              {osBaixaMargem.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Nenhuma OS abaixo da meta de lucro
                </div>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0 z-10 border-b border-slate-700 shadow-sm">
                      <tr>
                        <th className="px-6 py-4">OS</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Vendedor</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Valor Venda</th>
                        <th className="px-6 py-4 text-center">Margem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {osBaixaMargem.map(o => (
                        <tr key={o.id} className="hover:bg-slate-700/30">
                          <td className="px-6 py-4 text-emerald-400 font-medium">{o.numero_os}</td>
                          <td className="px-6 py-4 text-white">{o.clientes?.nome || '—'}</td>
                          <td className="px-6 py-4">{o.vendedor || '—'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${o.status === 'fechada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-white font-medium">{fmt(o.valor_total)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2.5 py-1.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">{Number(o.margem_lucro).toFixed(1)}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ALERTA: OS Paradas */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className={`px-6 py-4 flex items-center justify-between border-b ${
                osParadas.length > 0 ? 'border-orange-500/20 bg-orange-500/5' : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${osParadas.length > 0 ? 'text-orange-400' : 'text-slate-500'}`} />
                  <h2 className="text-white font-semibold">OS Paradas sem Movimentação</h2>
                  {osParadas.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">{osParadas.length}</span>}
                </div>
              </div>
              
              {osParadas.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Nenhuma OS parada
                </div>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0 z-10 border-b border-slate-700 shadow-sm">
                      <tr>
                        <th className="px-6 py-4">OS</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Mecânico</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Tempo Parada</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {osParadas.map(o => {
                        const horas = horasParadas(o.data_abertura)
                        return (
                          <tr key={o.id} className="hover:bg-slate-700/30">
                            <td className="px-6 py-4 text-emerald-400 font-medium">{o.numero_os}</td>
                            <td className="px-6 py-4 text-white">{o.clientes?.nome || '—'}</td>
                            <td className="px-6 py-4">{o.mecanico || '⚠️ Sem mecânico'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${o.status === 'aguardando' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold ${horas > 48 ? 'text-rose-400' : 'text-orange-400'}`}>{horas > 24 ? `${Math.floor(horas / 24)}d ${horas % 24}h` : `${horas}h`}</span>
                            </td>
                            <td className="px-6 py-4 text-right text-white font-medium">{fmt(o.valor_total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ALERTA: Mecânicos com Gargalo */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                mecanicosGargalo.length > 0 ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${mecanicosGargalo.length > 0 ? 'text-yellow-400' : 'text-slate-500'}`} />
                  <h2 className="text-white font-semibold">Mecânicos com Gargalo</h2>
                  {mecanicosGargalo.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-slate-900">{mecanicosGargalo.length}</span>}
                </div>
              </div>
              
              {mecanicosGargalo.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Nenhum gargalo identificado
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto max-h-80">
                  {mecanicosGargalo.map(m => (
                    <div key={m.nome} className="bg-slate-900/50 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{m.nome}</p>
                        <p className="text-slate-400 text-xs mt-0.5">OS em aberto</p>
                      </div>
                      <span className="text-2xl font-bold text-yellow-400">{m.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ALERTA: Peças Paradas */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className={`px-6 py-4 flex items-center justify-between border-b ${
                pecasParadas.length > 0 ? 'border-purple-500/20 bg-purple-500/5' : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Package className={`w-5 h-5 ${pecasParadas.length > 0 ? 'text-purple-400' : 'text-slate-500'}`} />
                  <h2 className="text-white font-semibold">Peças Paradas sem Giro</h2>
                  {pecasParadas.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white">{pecasParadas.length}</span>}
                </div>
              </div>
              
              {pecasParadas.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Nenhuma peça com excesso de estoque
                </div>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0 z-10 border-b border-slate-700 shadow-sm">
                      <tr>
                        <th className="px-6 py-4">Peça</th>
                        <th className="px-6 py-4 text-center">Estoque Atual</th>
                        <th className="px-6 py-4 text-center">Estoque Mínimo</th>
                        <th className="px-6 py-4 text-right">Valor Parado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {pecasParadas.map(p => (
                        <tr key={p.id} className="hover:bg-slate-700/30">
                          <td className="px-6 py-4 text-white font-medium">{p.descricao}</td>
                          <td className="px-6 py-4 text-center text-purple-400 font-bold">{p.estoque_atual}</td>
                          <td className="px-6 py-4 text-center text-slate-400">{p.estoque_minimo}</td>
                          <td className="px-6 py-4 text-right text-white font-medium">{fmt(Number(p.estoque_atual) * Number(p.preco_custo))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ALERTA: Carros Prontos não Buscados */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              <div className={`px-6 py-4 flex items-center justify-between border-b ${
                carrosProntos.length > 0 ? 'border-blue-500/20 bg-blue-500/5' : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Car className={`w-5 h-5 ${carrosProntos.length > 0 ? 'text-blue-400' : 'text-slate-500'}`} />
                  <h2 className="text-white font-semibold">Carros Prontos Não Buscados</h2>
                  {carrosProntos.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">{carrosProntos.length}</span>}
                </div>
              </div>
              
              {carrosProntos.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Nenhum carro aguardando retirada
                </div>
              ) : (
                <div className="overflow-y-auto max-h-80">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-800 text-slate-300 sticky top-0 z-10 border-b border-slate-700 shadow-sm">
                      <tr>
                        <th className="px-6 py-4">OS</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4 text-center">Pronto há</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {carrosProntos.map(o => {
                        const dias = diasParados(o.data_conclusao)
                        return (
                          <tr key={o.id} className="hover:bg-slate-700/30">
                            <td className="px-6 py-4 text-emerald-400 font-medium">{o.numero_os}</td>
                            <td className="px-6 py-4 text-white">{o.clientes?.nome || '—'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold ${dias >= 2 ? 'text-rose-400' : 'text-blue-400'}`}>
                                {dias === 0 ? 'Hoje' : `${dias} dia${dias > 1 ? 's' : ''}`}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-white font-medium">{fmt(o.valor_total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}