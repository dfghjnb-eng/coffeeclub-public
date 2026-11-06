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
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
      <div className="neu-inset" style={{
        flex: 1,
        borderRadius: 'var(--sz-radius)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* 검색 아이콘 */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--p-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6.5"/>
          <path d="M16 16l4 4"/>
        </svg>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="원두명 / 원산지 / 맛 노트"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: 'var(--sz-body)',
            color: 'var(--p-ink)',
          }}
        />
        {value && (
          <button type="button" onClick={() => { setValue(''); router.push('/') }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--p-muted)', fontSize: 'calc(var(--sz-body) * 0.857)', fontFamily: 'Inter', padding: 0 }}>
            지우기
          </button>
        )}
      </div>
      <button type="submit" className="neu-sm" style={{
        borderRadius: 'var(--sz-radius)',
        padding: '0 20px',
        fontSize: 'calc(var(--sz-body) * 0.929)',
        fontWeight: 700,
        color: 'var(--p-ink)',
        fontFamily: 'Inter',
        border: 'none',
        cursor: 'pointer',
      }}>
        검색
      </button>
    </form>
  )
}
