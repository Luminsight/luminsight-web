'use client'

export default function NewsCardSkeleton() {
  return (
    <article
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(139,127,212,0.08)',
      }}
    >
      {/* 헤더 바 */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #f8f7fd',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div className="skeleton-pulse" style={{ width: 44, height: 22, borderRadius: 8 }} />
        <div className="skeleton-pulse" style={{ width: 24, height: 22, borderRadius: 6 }} />
        <div className="skeleton-pulse" style={{ width: 60, height: 18, borderRadius: 6, marginLeft: 'auto' }} />
      </div>

      {/* 본문 */}
      <div style={{ padding: '18px 20px', background: '#faf9fe' }}>
        {/* 제목 */}
        <div className="space-y-2 mb-4">
          <div className="skeleton-pulse" style={{ width: '90%', height: 18, borderRadius: 6 }} />
          <div className="skeleton-pulse" style={{ width: '70%', height: 18, borderRadius: 6 }} />
        </div>
        {/* 내용 */}
        <div className="space-y-2 mb-4">
          <div className="skeleton-pulse" style={{ width: '100%', height: 13, borderRadius: 4 }} />
          <div className="skeleton-pulse" style={{ width: '95%', height: 13, borderRadius: 4 }} />
          <div className="skeleton-pulse" style={{ width: '80%', height: 13, borderRadius: 4 }} />
        </div>
        {/* AI 감성 박스 */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #ede9f8',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 14,
          }}
        >
          <div className="skeleton-pulse" style={{ width: 80, height: 14, borderRadius: 4, marginBottom: 8 }} />
          <div className="space-y-2">
            <div className="skeleton-pulse" style={{ width: '100%', height: 13, borderRadius: 4 }} />
            <div className="skeleton-pulse" style={{ width: '85%', height: 13, borderRadius: 4 }} />
          </div>
        </div>
        {/* 푸터 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(139,127,212,0.08)' }}>
          <div className="skeleton-pulse" style={{ width: 80, height: 14, borderRadius: 4 }} />
          <div className="skeleton-pulse" style={{ width: 60, height: 14, borderRadius: 4 }} />
        </div>
      </div>
    </article>
  )
}
