import { useState, useEffect } from 'react'
import { MessageCircle, Clock, Search, Filter, Calendar, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Retention() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    try {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .gte('dias_sem_retorno', 90)
        .eq('ativo', true)
        .order('dias_sem_retorno', { ascending: false })
      if (data) setOpportunities(data)
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (dias: number) => {
    if (dias >= 365) return { label: 'Crítico',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    if (dias >= 180) return { label: 'Atrasado', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    return { label: 'Em breve', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
  }

  const getProbability = (dias: number) => {
    if (dias >= 365) return { label: 'Baixa',  color: 'text-rose-400 font-medium' }
    if (dias >= 180) return { label: 'Média',  color: 'text-orange-400 font-medium' }
    return { label: 'Alta', color: 'text-emerald-400 font-medium' }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  const getPhone = (c: any) => c.whatsapp || c.celular || c.telefone || ''
  
  const getWhatsAppLink = (phone: string, nome: string, dias: number) => {
    const cleaned = phone.replace(/\D/g, '')
    if (!cleaned) return '#'
    const withCountry = cleaned.startsWith('55') && cleaned.length >= 12 ? cleaned : `55${cleaned}`
    const primeiroNome = nome.split(' ')[0]
    const mensagem = `Olá ${primeiroNome}, tudo bem? Aqui é do Torque IA Auto Center. Notamos que sua última revisão foi há ${dias} dias. Que tal agendarmos um check-up para garantir a segurança do seu veículo?`
    return `https://wa.me/${withCountry}?text=${encodeURIComponent(mensagem)}`
  }

  const filtered = opportunities.filter(item =>
    item.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-8 md:py-0 md:h-16 bg-slate-900/50">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-wide">Máquina de Retenção</h1>
          <p className="text-xs text-slate-400 mt-0.5">Oportunidades de venda ativas baseadas no histórico</p>
        </div>
        <button className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors">
          <Calendar className="w-5 h-5" />
          <span>Agendar Lembretes</span>
        </button>
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar cliente pelo nome..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-500"
            />
          </div>
          <button className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-slate-700 transition-colors">
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-slate-400">Buscando oportunidades...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-800 rounded-2xl border border-slate-700 border-dashed">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Fila Zerada!</h3>
            <p className="text-slate-400 text-center">Você contatou todas as oportunidades de retenção.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((item) => {
              const status = getStatus(item.dias_sem_retorno)
              const probability = getProbability(item.dias_sem_retorno)
              const phone = getPhone(item)
              const whatsappLink = getWhatsAppLink(phone, item.nome, item.dias_sem_retorno)

              return (
                <div key={item.id} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col hover:border-slate-600 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{item.nome}</h3>
                      <p className="text-sm text-slate-400">{phone || 'Sem telefone cadastrado'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center text-sm">
                      <Clock className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                      <span className="text-slate-300">Ausente há <span className="text-rose-400 font-medium">{item.dias_sem_retorno} dias</span></span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                      <span className="text-slate-300">Última visita: {formatDate(item.ultima_visita)}</span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg mt-2 border border-slate-700/50">
                      <p className="text-xs text-slate-400">Probabilidade de fecho: <span className={probability.color}>{probability.label}</span></p>
                    </div>
                  </div>

                  <a
                    href={whatsappLink !== '#' ? whatsappLink : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (whatsappLink === '#') e.preventDefault()
                    }}
                    className={`mt-6 w-full py-2.5 rounded-lg flex items-center justify-center space-x-2 font-medium shadow-sm transition-colors ${
                      whatsappLink !== '#'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="truncate">{whatsappLink !== '#' ? 'Enviar Oferta via WhatsApp' : 'Sem número'}</span>
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}