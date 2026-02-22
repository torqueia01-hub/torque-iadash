import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function RecentOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentOrders()
  }, [])

  async function fetchRecentOrders() {
    try {
      const { data } = await supabase
        .from('ordens_servico')
        .select('*, clientes(nome), veiculos(placa, marca, modelo)')
        .order('data_abertura', { ascending: false })
        .limit(5) // Puxa apenas as 5 últimas para o Dash
      if (data) setOrders(data)
    } catch (error) {
      console.error('Erro ao buscar últimas ordens:', error)
    } finally {
      setLoading(false)
    }
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
    <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Últimas Ordens de Serviço</h3>
          <p className="text-sm text-slate-400">Acompanhamento em tempo real da oficina</p>
        </div>
        {/* Aqui está o Link funcionando! */}
        <Link to="/orders" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          Ver todas
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="text-xs uppercase bg-slate-700/50 text-slate-300 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 font-semibold">OS</th>
              <th className="px-6 py-4 font-semibold">Cliente / Veículo</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Valor</th>
              <th className="px-6 py-4 font-semibold text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Carregando...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Nenhuma ordem encontrada.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const veiculo = order.veiculos
                const cliente = order.clientes

                return (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-emerald-400">{order.numero_os}</td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{cliente?.nome || '—'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-white">{fmt(order.valor_total)}</td>
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
  )
}