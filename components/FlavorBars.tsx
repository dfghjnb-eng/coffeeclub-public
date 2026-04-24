const LABELS: Record<string, string> = {
  acidity: '산미', sweetness: '단맛', body: '바디감',
  bitterness: '쓴맛', aroma: '향', balance: '균형감',
}

export default function FlavorBars({ fg }: { fg: Record<string, number> }) {
  const keys = ['acidity', 'sweetness', 'body', 'bitterness', 'aroma', 'balance']
  return (
    <div className="space-y-3">
      {keys.map(k => {
        const val = fg[k] ?? 0
        const pct = (val / 10) * 100
        return (
          <div key={k} className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-[#AAAAAA] w-12 text-right flex-shrink-0">{LABELS[k]}</span>
            <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#3DD68C] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[13px] font-black text-[#25B872] w-5 text-right flex-shrink-0">{val}</span>
          </div>
        )
      })}
    </div>
  )
}
