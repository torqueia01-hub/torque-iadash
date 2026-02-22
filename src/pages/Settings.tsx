import { useState, useEffect } from 'react'
import { Save, Loader2, DollarSign, Target, Settings as SettingsIcon, Wrench, Percent } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Settings() {
  const [goalId, setGoalId] = useState<string | null>(null)
  const [fixedCost, setFixedCost] = useState<number>(0)
  const [desiredProfit, setDesiredProfit] = useState<number>(0)
  const [averageOrders, setAverageOrders] = useState<number>(1)
  
  // NOVO ESTADO: Margem Mínima
  const [minMargin, setMinMargin] = useState<number>(40)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    try {
      const { data, error } = await supabase.from('financial_goals').select('*').single()
      if (data) {
        setGoalId(data.id)
        setFixedCost(Number(data.monthly_fixed_cost))
        setDesiredProfit(Number(data.desired_monthly_profit))
        setAverageOrders(Number(data.average_monthly_orders))
        
        // Puxa o dado do banco. Se não existir, usa 40 como padrão
        setMinMargin(data.min_margin_percentage ? Number(data.min_margin_percentage) : 40)
      }
    } catch (error) {
      console.error('Erro ao buscar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalId) return

    setSaving(true)
    setFeedback(null)

    try {
      const { error } = await supabase
        .from('financial_goals')
        .update({
          monthly_fixed_cost: fixedCost,
          desired_monthly_profit: desiredProfit,
          average_monthly_orders: averageOrders,
          min_margin_percentage: minMargin // Salva a nova métrica no banco
        })
        .eq('id', goalId)

      if (error) throw error
      setFeedback({ type: 'success', msg: 'Metas atualizadas com sucesso! O Dashboard foi recalculado.' })
      
      setTimeout(() => setFeedback(null), 3000)
    } catch (error) {
      setFeedback({ type: 'error', msg: 'Erro ao salvar. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }

  const previewBreakEven = averageOrders > 0 ? fixedCost / averageOrders : 0
  const previewProfit = averageOrders > 0 ? (fixedCost + desiredProfit) / averageOrders : 0
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-900/50">
        <h1 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
          Configurações da Oficina
        </h1>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-sm p-6 h-fit">
            <h2 className="text-lg font-bold text-white mb-6">Metas Financeiras Inteligentes</h2>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-rose-400" /> Custo Fixo Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={fixedCost}
                    onChange={(e) => setFixedCost(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Aluguel, folha de pagamento, energia, etc.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" /> Meta de Lucro Líquido (R$)
                  </label>
                  <input
                    type="number"
                    value={desiredProfit}
                    onChange={(e) => setDesiredProfit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Quanto você quer colocar no bolso livre.</p>
                </div>

                <div className="border-t border-slate-700 pt-6">
                  <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-400" /> Média de OS por Mês
                  </label>
                  <input
                    type="number"
                    value={averageOrders}
                    onChange={(e) => setAverageOrders(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Volume médio de carros atendidos em 30 dias.</p>
                </div>

                {/* NOVO CAMPO: Margem Mínima Aceitável */}
                <div className="border-t border-slate-700 pt-6">
                  <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-orange-400" /> Margem Mínima Aceitável (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={minMargin}
                    onChange={(e) => setMinMargin(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Define quando uma OS ou Mecânico entra na zona de alerta vermelho.</p>
                </div>
              </div>

              {feedback && (
                <div className={`p-4 rounded-lg text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {feedback.msg}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 h-fit">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Prévia do Dashboard</h3>
            
            <div className="space-y-4">
              <div className="bg-slate-800 border border-rose-500/20 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Ticket Mínimo (Pagar Contas)</p>
                <p className="text-2xl font-bold text-rose-400">{fmt(previewBreakEven)}</p>
                <p className="text-xs text-slate-500 mt-2">Valor mínimo por OS para não ter prejuízo.</p>
              </div>

              <div className="bg-slate-800 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Ticket Meta (Gerar Lucro)</p>
                <p className="text-2xl font-bold text-emerald-400">{fmt(previewProfit)}</p>
                <p className="text-xs text-slate-500 mt-2">Valor ideal por OS para bater a meta mensal.</p>
              </div>

              {/* NOVA PRÉVIA: Tolerância Operacional */}
              <div className="bg-slate-800 border border-orange-500/20 rounded-xl p-4">
                <p className="text-slate-400 text-sm mb-1">Alerta de Margem Baixa</p>
                <p className="text-2xl font-bold text-orange-400">Abaixo de {minMargin}%</p>
                <p className="text-xs text-slate-500 mt-2">Serviços que renderem menos que isso serão bloqueados ou alertados.</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-400 leading-relaxed">
                As alterações feitas aqui atualizarão imediatamente o <strong>Simulador de Esforço Operacional</strong> no Painel Executivo e as tags nas <strong>Ordens de Serviço</strong>.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}