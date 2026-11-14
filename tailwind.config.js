export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { ink: '#070B14', panel: '#0E1422', teal: '#2EE6C5', violet: '#8B7CFF', amber: '#FFB547', ok: '#22C55E', alert: '#FF5A5F', wa: '#25D366' },
    fontFamily: { sans: ['Inter','Noto Sans Devanagari','sans-serif'], head: ['Sora','Noto Sans Devanagari','sans-serif'], mono: ['JetBrains Mono','monospace'] },
  } },
  plugins: [],
}
