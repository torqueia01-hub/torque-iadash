import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Dados simulados dos últimos 6 meses da oficina
const data = [
  { name: 'Jan', total: 85000 },
  { name: 'Fev', total: 92000 },
  { name: 'Mar', total: 105000 },
  { name: 'Abr', total: 110000 },
  { name: 'Mai', total: 125000 },
  { name: 'Jun', total: 142350 },
]

export function RevenueChart() {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">Evolução de Faturamento</h3>
        <p className="text-sm text-slate-400">Receita bruta da oficina nos últimos 6 meses</p>
      </div>
      
      <div className="h-[300px] w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -0, bottom: 0 }}>
            <defs>
              {/* Efeito de degradê verde bonito no gráfico */}
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `R$ ${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
              itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#10b981" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}