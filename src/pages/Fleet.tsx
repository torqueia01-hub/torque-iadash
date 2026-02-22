import { useState, useEffect } from 'react'
import { Car, Search, Filter, History, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Fleet() {
  const [fleetData, setFleetData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchVeiculos()
  }, [])

  async function fetchVeiculos() {
    try {
      // MUDANÇA 1: Pedimos ao Supabase para trazer também as OS vinculadas a este veículo!
      const { data } = await supabase
        .from('veiculos')
        .select('*, clientes(nome), ordens_servico(valor_total, data_abertura, status)')
      
      if (data) {
        // MUDANÇA 2: O Cérebro Matemático! Calculamos LTV e Visitas reais baseados na tabela de OS.
        const frotaCalculada = data.map(car => {
          const ordens = car.ordens_servico || []
          
          // Filtramos apenas as ordens fechadas para calcular o LTV (dinheiro que já entrou)
          const fechadas = ordens.filter((o: any) => o.status === 'fechada')
          const ltvReal = fechadas.reduce((sum: number, o: any) => sum + Number(o.valor_total), 0)
          
          // Pegamos a data da OS mais recente
          const ordensOrdenadas = [...ordens].sort((a: any, b: any) => 
            new Date(b.data_abertura).getTime() - new Date(a.data_abertura).getTime()
          )
          const ultimaOs = ordensOrdenadas[0]
          const dataUltimaVisita = ultimaOs ? ultimaOs.data_abertura.split('T')[0] : car.ultima_visita

          return {
            ...car,
            visitas_reais: ordens.length, // Conta o total de visitas (OS abertas + fechadas)
            ltv_real: ltvReal,            // Soma financeira real
            ultima_visita_real: dataUltimaVisita
          }
        })
        
        // Ordena a lista para mostrar quem visitou mais recentemente primeiro
        frotaCalculada.sort((a, b) => new Date(b.ultima_visita_real).getTime() - new Date(a.ultima_visita_real).getTime())

        setFleetData(frotaCalculada)
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = fleetData.filter(car =>
    car.placa?.toLowerCase().includes(search.toLowerCase()) ||
    car.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    car.marca?.toLowerCase().includes(search.toLowerCase()) ||
    car.clientes?.nome?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="h-16 border-b border-slate-800 flex items-center px-8 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide">Histórico de Frota</h1>
          <p className="text-xs text-slate-400 mt-0.5">Dossiê completo de veículos atendidos</p>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa (ex: ABC-1234) ou modelo..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium flex items-center space-x-2 hover:bg-slate-700 transition-colors">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-700/50 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4">Placa / Veículo</th>
                <th className="px-6 py-4">Proprietário</th>
                <th className="px-6 py-4 text-center">Visitas</th>
                <th className="px-6 py-4">Último Serviço</th>
                <th className="px-6 py-4 text-right">LTV (Gasto Total)</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                    <p>Calculando histórico da frota...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600">
                          <Car className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-white font-bold tracking-wider">{car.placa}</p>
                          <p className="text-xs text-slate-400">{car.marca} {car.modelo} {car.ano ? `• ${car.ano}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">{car.clientes?.nome || '—'}</td>
                    
                    {/* MUDANÇA 3: Renderizando os dados calculados ao invés dos fixos */}
                    <td className="px-6 py-4 text-center font-medium">{car.visitas_reais}</td>
                    <td className="px-6 py-4">{formatDate(car.ultima_visita_real)}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-400">{fmt(car.ltv_real)}</td>
                    
                    <td className="px-6 py-4 text-center">
                      <button className="text-emerald-400 hover:text-emerald-300 flex items-center justify-center space-x-1 mx-auto text-xs font-medium border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-md transition-colors">
                        <History className="w-4 h-4" />
                        <span>Ver Dossiê</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}