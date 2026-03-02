import { useState, useEffect } from 'react'
import { Package, Search, Filter, Loader2, AlertTriangle, CheckCircle2, TrendingDown, DollarSign } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Inventory() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    try {
      const { data } = await supabase
        .from('produtos_servicos')
        .select('*')
        .eq('tipo', 'peca')
        .eq('ativo', true)
        .order('estoque_atual', { ascending: false })
      if (data) setInventory(data)
    } catch (error) {
      console.error('Erro ao buscar estoque:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInventoryIntelligence = (atual: number, minimo: number) => {
    if (atual === 0) {
      return { 
        status: 'Zerado', 
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', 
        icon: AlertTriangle,
        action: 'Urgente: Comprar imediatamente. Risco de perder vendas.' 
      }
    }
    if (atual < minimo) {
      return { 
        status: 'Baixo', 
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', 
        icon: TrendingDown,
        action: `Repor estoque. Faltam ${minimo - atual} para o mínimo de segurança.` 
      }
    }
    if (minimo > 0 && atual >= minimo * 3) {
      return { 
        status: 'Capital Parado', 
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', 
        icon: DollarSign,
        action: 'Criar combo ou promoção para girar esse dinheiro urgente.' 
      }
    }
    return { 
      status: 'Saudável', 
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 
      icon: CheckCircle2,
      action: 'Nenhuma ação necessária. Manter fluxo normal.' 
    }
  }

  const capitalImobilizado = inventory.reduce((sum, item) => sum + (Number(item.preco_custo) * Number(item.estoque_atual)), 0)
  const itensEmAlerta = inventory.filter(i => i.estoque_atual < i.estoque_minimo).length

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-8 md:py-0 md:h-16 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Inteligência de Estoque
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Gestão de giro e capital imobilizado</p>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Dinheiro na Prateleira (Custo)</p>
            <h3 className="text-3xl font-bold text-white mt-2">{fmt(capitalImobilizado)}</h3>
            <p className="text-purple-400 text-sm mt-2 font-medium">Capital imobilizado hoje</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Peças Cadastradas</p>
            <h3 className="text-3xl font-bold text-white mt-2">{inventory.length}</h3>
            <p className="text-blue-400 text-sm mt-2 font-medium">Itens monitorados pela IA</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-rose-500/30 shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Risco de Ruptura (Falta)</p>
            <h3 className="text-3xl font-bold text-rose-400 mt-2">{itensEmAlerta}</h3>
            <p className="text-rose-400 text-sm mt-2 font-medium">Itens abaixo do estoque mínimo</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar peça por nome ou código..." 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-slate-700 transition-colors">
            <Filter className="w-5 h-5" />
            <span>Filtrar</span>
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-slate-700/50 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Peça</th>
                  <th className="px-6 py-4 font-semibold text-center">Atual</th>
                  <th className="px-6 py-4 font-semibold text-center">Mínimo</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold">Sugestão da IA (Torque)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
                      <p>Analisando prateleiras...</p>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Nenhuma peça cadastrada no estoque.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const intelligence = getInventoryIntelligence(item.estoque_atual, item.estoque_minimo)
                    const StatusIcon = intelligence.icon

                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{item.descricao}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Custo: {fmt(item.preco_custo)} / Venda: {fmt(item.preco_venda)}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-white">{item.estoque_atual}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-slate-500 font-medium">{item.estoque_minimo}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${intelligence.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {intelligence.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`text-xs font-medium ${
                            intelligence.status === 'Capital Parado' ? 'text-purple-400' :
                            intelligence.status === 'Baixo' || intelligence.status === 'Zerado' ? 'text-rose-400' :
                            'text-slate-400'
                          }`}>
                            {intelligence.action}
                          </p>
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