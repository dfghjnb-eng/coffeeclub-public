'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CatalogSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="원두 이름, 원산지, 맛 노트 검색..."
        className="flex-1 px-4 py-3 rounded-xl border border-[#E8E8E8] bg-white text-[14px] font-medium outline-none focus:border-[#111] transition-colors"
      />
      <button
        type="submit"
        className="px-5 py-3 bg-[#111] text-white rounded-xl font-bold text-[14px]"
      >
        검색
      </button>
    </form>
  )
}
