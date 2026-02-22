import { useState, useEffect } from 'react'
import { TrendingUp, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function MarginWidget() {
  const [margins, setMargins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMargins()
  }, [])

  async function fetchMargins() {
    try {
      const { data } = await supabase
        .from('produtos_servicos')
        .select('*')
        .eq('ativo', true)
        .order('margem_lucro', { ascending: false })
        .limit(4) // Traz apenas o Top 4 de rentabilidade para o widget
      
      if (data) setMargins(data)
    } catch (error) {
      console.error('Erro ao buscar margens:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para definir a cor da barra baseada nas nossas regras de negócio
  const getStatusColor = (margem: number) => {
    if (margem >= 55) return 'bg-emerald-400'
    if (margem >= 40) return 'bg-blue-400'
    return 'bg-rose-400'
  }

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm flex-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Inteligência de Margem
          </h3>
          <p className="text-sm text-slate-400">Itens com maior rentabilidade atual</p>
        </div>
        
        {/* Transformado em Link real para a página completa */}
        <Link to="/margin" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          Ver todas
        </Link>
      </div>
      
      <div className="space-y-4 mt-6">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : margins.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-700/20 rounded-lg border border-slate-700/50">
            Nenhum item encontrado.
          </div>
        ) : (
          margins.map((item) => {
            const margemValor = Number(item.margem_lucro) || 0
            const colorClass = getStatusColor(margemValor)
            
            return (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-sm text-slate-300 truncate pr-4" title={item.descricao}>
                  {item.descricao}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${colorClass}`}
                      // Math.min garante que a barra não passe de 100% no visual
                      style={{ width: `${Math.min(margemValor, 100)}%` }} 
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-12 text-right">
                    {margemValor.toFixed(1)}%
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}