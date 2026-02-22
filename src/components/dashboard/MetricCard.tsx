import { ReactNode } from 'react'

interface MetricCardProps {
  title: string
  value: string
  icon: ReactNode
  trend: string
  trendUp: boolean
}

export function MetricCard({ title, value, icon, trend, trendUp }: MetricCardProps) {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        </div>
        <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend}
        </span>
        <span className="text-slate-500 text-sm ml-2">vs. mês anterior</span>
      </div>
    </div>
  )
}