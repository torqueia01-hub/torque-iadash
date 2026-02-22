import { useState, useEffect } from 'react'
import { MessageCircle, Clock, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function RetentionWidget() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRetentionAlerts()
  }, [])

  async function fetchRetentionAlerts() {
    try {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .gte('dias_sem_retorno', 90) // Pega só quem sumiu há mais de 3 meses
        .eq('ativo', true)
        .order('dias_sem_retorno', { ascending: false })
        .limit(3) // Traz apenas os 3 piores casos para o widget
      
      if (data) setAlerts(data)
    } catch (error) {
      console.error('Erro ao buscar alertas de retenção:', error)
    } finally {
      setLoading(false)
    }
  }

  // Lógica para pegar o telefone e montar o link do WhatsApp
  const getPhone = (c: any) => c.whatsapp || c.celular || c.telefone || ''
  
  const getWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (!cleaned) return '#'
    const withCountry = cleaned.startsWith('55') && cleaned.length >= 12 ? cleaned : `55${cleaned}`
    return `https://wa.me/${withCountry}`
  }

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm flex-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Máquina de Retenção
          </h3>
          <p className="text-sm text-slate-400">Clientes no momento ideal de retorno</p>
        </div>
        
        {/* MUDANÇA 1: Botão transformado em Link real para a página completa */}
        <Link to="/retention" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          Ver todas
        </Link>
      </div>
      
      <div className="space-y-4 mt-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm bg-slate-700/20 rounded-lg border border-slate-700/50">
            Nenhum cliente com risco de evasão.
          </div>
        ) : (
          alerts.map((alert) => {
            const phone = getPhone(alert)
            const link = getWhatsAppLink(phone)

            return (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div>
                  <p className="text-white font-medium text-sm">{alert.nome}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ausente há <span className="text-rose-400 font-medium">{alert.dias_sem_retorno} dias</span>
                  </p>
                </div>
                
                {/* MUDANÇA 2: Botão agora é uma tag <a> que abre o WhatsApp direto */}
                <a 
                  href={link !== '#' ? link : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => link === '#' && e.preventDefault()}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border ${
                    link !== '#' 
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{link !== '#' ? 'WhatsApp' : 'Sem N°'}</span>
                </a>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}