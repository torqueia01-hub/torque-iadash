import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Loader2, Wrench, Package, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Margin() {
  const [marginData, setMarginData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<'todos' | 'servico' | 'peca'>('todos')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  useEffect(() => {
    fetchProdutos()
  }, [])

  async function fetchProdutos() {
    try {
      const { data } = await supabase
        .from('produtos_servicos')
        .select('*')
        .eq('ativo', true)
        .order('margem_lucro', { ascending: false })
      if (data) setMarginData(data)
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const getMarginStatus = (margem: number) => {
    if (margem >= 55) return { label: 'Excelente', color: 'bg-emerald-500/20 text-emerald-400' }
    if (margem >= 40) return { label: 'Bom',       color: 'bg-blue-500/20 text-blue-400' }
    if (margem >= 25) return { label: 'Atenção',   color: 'bg-orange-500/20 text-orange-400' }
    return               { label: 'Crítico',       color: 'bg-rose-500/20 text-rose-400' }
  }

  const filtered = marginData.filter(item => {
    const matchSearch = item.descricao?.toLowerCase().includes(search.toLowerCase())
    const matchTipo = filterTipo === 'todos' || item.tipo === filterTipo
    const itemDate = new Date(item.created_at)
    const matchInicio = dataInicio ? itemDate >= new Date(dataInicio) : true
    const matchFim = dataFim ? itemDate <= new Date(dataFim + 'T23:59:59') : true
    return matchSearch && matchTipo && matchInicio && matchFim
  })

  const servicos = filtered.filter(i => i.tipo === 'servico')
  const pecas = filtered.filter(i => i.tipo === 'peca')

  const margemMedia = filtered.length > 0
    ? filtered.reduce((sum, i) => sum + Number(i.margem_lucro), 0) / filtered.length : 0
  const margemMediaServicos = servicos.length > 0
    ? servicos.reduce((sum, i) => sum + Number(i.margem_lucro), 0) / servicos.length : 0
  const margemMediaPecas = pecas.length > 0
    ? pecas.reduce((sum, i) => sum + Number(i.margem_lucro), 0) / pecas.length : 0

  const maisRentavel = servicos.length > 0
    ? servicos.reduce((max, i) => Number(i.margem_lucro) > Number(max.margem_lucro) ? i : max, servicos[0])
    : filtered[0]
  const menosRentavel = pecas.length > 0
    ? pecas.reduce((min, i) => Number(i.margem_lucro) < Number(min.margem_lucro) ? i : min, pecas[0])
    : filtered[filtered.length - 1]

  const limparFiltros = () => {
    setSearch('')
    setFilterTipo('todos')
    setDataInicio('')
    setDataFim('')
  }

  const temFiltro = search || filterTipo !== 'todos' || dataInicio || dataFim

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-8 md:py-0 md:h-16 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Inteligência de Margem
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Análise de rentabilidade de peças e serviços</p>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm flex flex-col justify-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Média Geral</p>
            <h3 className="text-2xl font-bold text-white mt-1">{margemMedia.toFixed(1)}%</h3>
            <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Catálogo Todo
            </p>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm flex flex-col justify-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-purple-400" /> Média Serviços
            </p>
            <h3 className="text-2xl font-bold text-purple-400 mt-1">{margemMediaServicos.toFixed(1)}%</h3>
            <p className="text-slate-500 text-xs mt-1">Lucro sobre mão de obra</p>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm flex flex-col justify-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-blue-400" /> Média Peças
            </p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{margemMediaPecas.toFixed(1)}%</h3>
            <p className="text-slate-500 text-xs mt-1">Lucro sobre revenda</p>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm flex flex-col justify-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Top Serviço</p>
            <h3 className="text-base font-bold text-white mt-1 truncate" title={maisRentavel?.descricao}>
              {maisRentavel?.descricao || '—'}
            </h3>
            <p className="text-emerald-400 text-xs mt-1 font-medium">{maisRentavel?.margem_lucro?.toFixed(1)}% de Margem</p>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm flex flex-col justify-center">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pior Peça</p>
            <h3 className="text-base font-bold text-white mt-1 truncate" title={menosRentavel?.descricao}>
              {menosRentavel?.descricao || '—'}
            </h3>
            <p className="text-rose-400 text-xs mt-1 font-medium">{menosRentavel?.margem_lucro?.toFixed(1)}% de Margem</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px] relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar item..."
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(['todos', 'servico', 'peca'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFilterTipo(tipo)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  filterTipo === tipo
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {tipo === 'todos' ? 'Todos' : tipo === 'servico' ? 'Serviços' : 'Peças'}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          {temFiltro && (
            <button
              onClick={limparFiltros}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              Limpar
            </button>
          )}
          <div className="flex items-center gap-1 text-slate-500 text-xs ml-auto">
            <Filter className="w-3.5 h-3.5" />
            <span>{filtered.length} itens</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-slate-700/50 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4">Item (Peça / Serviço)</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Custo de Aquisição</th>
                  <th className="px-6 py-4 text-right">Preço de Venda</th>
                  <th className="px-6 py-4 text-right">Lucro Bruto</th>
                  <th className="px-6 py-4 text-center">Margem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                      <p>Buscando dados...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Nenhum item encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const lucro = Number(item.preco_venda) - Number(item.preco_custo)
                    const status = getMarginStatus(Number(item.margem_lucro))
                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 text-white font-medium">{item.descricao}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs border ${
                            item.tipo === 'servico'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          }`}>
                            {item.tipo === 'servico' ? 'Serviço' : 'Peça'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">{fmt(item.preco_custo)}</td>
                        <td className="px-6 py-4 text-right font-medium text-white">{fmt(item.preco_venda)}</td>
                        <td className="px-6 py-4 text-right text-emerald-400 font-medium">{fmt(lucro)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                            {Number(item.margem_lucro).toFixed(1)}%
                          </span>
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