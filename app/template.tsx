export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: 'fadeIn 0.22s ease' }}>
      {children}
    </div>
  )
}
