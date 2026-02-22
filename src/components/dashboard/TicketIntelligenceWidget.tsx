import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { AlertTriangle, TrendingUp, ShoppingBag } from 'lucide-react'

interface Props {
  orders: any[]
  goals: any
}

export function TicketIntelligenceWidget({ orders, goals }: Props) {
  if (!goals || orders.length === 0) return null

  // 1. Cálculos Financeiros Atuais
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.valor_total || 0), 0)
  const totalCost = orders.reduce((sum, o) => sum + Number(o.custo_total || 0), 0)
  
  const currentTicket = totalRevenue / orders.length
  const currentMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
  
  // Quanto de "lucro em dinheiro" cada carro deixa em média
  const profitPerCar = currentTicket * (currentMargin / 100)

  // 2. Projeções de Volume (Quantos carros a oficina precisa atender?)
  // Previne divisão por zero se a oficina estiver operando no prejuízo
  const carsToBreakEven = profitPerCar > 0 ? Math.ceil(goals.monthly_fixed_cost / profitPerCar) : 0
  const carsToTarget = profitPerCar > 0 ? Math.ceil((goals.monthly_fixed_cost + goals.desired_monthly_profit) / profitPerCar) : 0
  const currentCars = orders.length
  const averageVolume = goals.average_monthly_orders

  // 3. O Cérebro da IA (Regras de Alerta)
  let alert = {
    type: 'success',
    title: 'Cenário Sustentável',
    message: `Sua margem e ticket atuais estão ótimos! Você paga as contas atendendo ${carsToBreakEven} carros. O que vier a partir do ${carsToBreakEven + 1}º carro já é lucro líquido indo para o seu bolso.`,
    icon: TrendingUp,
    colors: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    iconColor: 'text-emerald-400'
  }

  if (profitPerCar <= 0) {
    alert = {
      type: 'danger',
      title: 'Prejuízo Operacional',
      message: 'Sua margem atual está negativa ou zerada! Cada carro atendido está gerando prejuízo. Revise imediatamente os custos das peças e a tabela de preços cobrados!',
      icon: AlertTriangle,
      colors: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      iconColor: 'text-rose-400'
    }
  } else if (carsToBreakEven > averageVolume) {
    alert = {
      type: 'danger',
      title: 'Risco Operacional Crítico!',
      message: `Você precisa de ${carsToBreakEven} carros só para pagar as contas, mas sua média mensal é de ${averageVolume} carros. Aumente o ticket médio urgente oferecendo "Combos de Revisão" ou higienização de ar-condicionado na entrega!`,
      icon: AlertTriangle,
      colors: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      iconColor: 'text-rose-400'
    }
  } else if (carsToTarget > averageVolume) {
    alert = {
      type: 'warning',
      title: 'Atenção à Meta de Lucro',
      message: `Para bater a meta de lucro você precisará de ${carsToTarget} carros. Tente oferecer produtos de venda rápida no balcão (aditivos, palhetas, cheirinho) para subir o ticket e bater a meta com menos esforço.`,
      icon: ShoppingBag,
      colors: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      iconColor: 'text-orange-400'
    }
  }

  // 4. Dados para desenhar o Gráfico
  const chartData = [
    { name: 'Pagar Contas', carros: carsToBreakEven, fill: '#f43f5e' }, // Vermelho
    { name: 'Bater Meta', carros: carsToTarget, fill: '#10b981' }, // Verde
    { name: 'Feitos no Mês', carros: currentCars, fill: '#3b82f6' } // Azul
  ]

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const AlertIcon = alert.icon

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm col-span-1 lg:col-span-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Simulador de Esforço Operacional
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Quantos carros você precisa atender com o Ticket de <strong className="text-white">{fmt(currentTicket)}</strong> e Margem de <strong className="text-white">{currentMargin.toFixed(1)}%</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gráfico Horizontal de Barras */}
        <div className="md:col-span-2 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val} carros`} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
              <Tooltip 
                cursor={{fill: '#334155', opacity: 0.4}}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                formatter={(value: number) => [`${value} Carros`, 'Volume Necessário']}
              />
              {/* Linha pontilhada mostrando a média de carros da oficina */}
              <ReferenceLine x={averageVolume} stroke="#8b5cf6" strokeDasharray="3 3" label={{ position: 'top', value: `Média (${averageVolume})`, fill: '#8b5cf6', fontSize: 10 }} />
              
              <Bar dataKey="carros" radius={[0, 4, 4, 0]} barSize={28}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quadro Inteligente de Alerta e Ação */}
        <div className="flex flex-col justify-center">
          <div className={`p-5 rounded-xl border ${alert.colors} flex flex-col gap-3 h-full justify-center`}>
            <div className="flex items-center gap-2">
              <AlertIcon className={`w-6 h-6 ${alert.iconColor}`} />
              <h4 className="font-bold text-white tracking-wide">{alert.title}</h4>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              {alert.message}
            </p>
            {/* Dica bônus de Matemática se não estiver no cenário perfeito */}
            {alert.type !== 'success' && profitPerCar > 0 && (
               <div className="mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                 <p className="text-xs text-slate-400">
                   <strong>Dica do Torque IA:</strong> Cada <strong className="text-white">R$ 50,00</strong> adicionados no ticket médio atual reduz a sua meta mensal de esforço em aproximadamente <strong className="text-white">{Math.ceil((goals.monthly_fixed_cost + goals.desired_monthly_profit) / ((currentTicket + 50) * (currentMargin / 100))) - carsToTarget} carros</strong>.
                 </p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}