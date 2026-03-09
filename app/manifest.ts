import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LuminSight - AI 투자 동반자',
    short_name: 'LuminSight',
    description: 'AI가 시장을 읽고, 내 투자 습관을 분석해주는 투자 공부 동반자',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f4fa',
    theme_color: '#8b7fd4',
    orientation: 'portrait-primary',
    categories: ['finance', 'productivity'],
    lang: 'ko',
    icons: [
      { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
      { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
      { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: '투자 일지',
        short_name: '일지',
        description: '오늘의 매매를 기록하세요',
        url: '/journal',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: '알림',
        short_name: '알림',
        description: '감성 변화 알림 확인',
        url: '/alerts',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
  }
}
