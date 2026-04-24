'use client'
import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const LABELS: Record<string, string> = {
  acidity: '산미', sweetness: '단맛', body: '바디감',
  bitterness: '쓴맛', aroma: '향', balance: '균형감',
}
const KEYS = ['acidity', 'sweetness', 'body', 'bitterness', 'aroma', 'balance']

export default function FlavorChart({ fg }: { fg: Record<string, number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    if (chartRef.current) chartRef.current.destroy()

    const labels = KEYS.map(k => LABELS[k])
    const values = KEYS.map(k => fg[k] ?? 0)

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: 'rgba(61,214,140,0.12)',
          borderColor: '#3DD68C',
          borderWidth: 2.5,
          pointBackgroundColor: '#111',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.35,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0, max: 10,
            ticks: { stepSize: 2, color: '#AAA', font: { size: 10 } },
            grid: { color: '#F0F0F0' },
          },
          x: {
            ticks: { color: '#666', font: { size: 11, weight: 'bold' } },
            grid: { display: false },
          },
        },
        plugins: { legend: { display: false } },
      },
    })

    return () => { chartRef.current?.destroy() }
  }, [fg])

  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
