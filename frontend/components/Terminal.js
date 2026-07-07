'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const lines = [
  { text: '$ git push origin main', color: 'text-green-400' },
  { text: '', color: '' },
  { text: '> Webhook received — sentinel.systems', color: 'text-cyan-400' },
  { text: '> Cloning repository: vinothz/api-gateway', color: 'text-slate-400' },
  { text: '', color: '' },
  { text: '> Building Docker image...', color: 'text-yellow-400' },
  { text: '  #1 [internal] load build definition from Dockerfile', color: 'text-slate-500' },
  { text: '  #2 [internal] load metadata for node:20-alpine', color: 'text-slate-500' },
  { text: '  #3 [build 1/5] RUN npm ci --omit=dev', color: 'text-slate-500' },
  { text: '  #4 [build 2/5] COPY . .', color: 'text-slate-500' },
  { text: '  #5 [build 3/5] RUN npm run build', color: 'text-slate-500' },
  { text: '  \u2713 Build completed in 12.4s', color: 'text-green-400' },
  { text: '', color: '' },
  { text: '> Deploying container: api-gateway:latest', color: 'text-blue-400' },
  { text: '> Running health check on port 3000...', color: 'text-purple-400' },
  { text: '  \u2713 Health check passed (3/3)', color: 'text-green-400' },
  { text: '> Configuring Nginx reverse proxy...', color: 'text-slate-400' },
  { text: '> Provisioning SSL certificate...', color: 'text-cyan-400' },
  { text: '> Traffic switched to new container', color: 'text-green-400' },
  { text: '', color: '' },
  { text: '\u2713 Production deployment successful (23.7s)', color: 'text-green-400 font-bold' },
  { text: '\u21bb Rollback available: api-gateway:v42', color: 'text-slate-500' },
]

function Typewriter() {
  const [visible, setVisible] = useState(0)
  const [char, setChar] = useState(0)

  useEffect(() => {
    if (visible >= lines.length) return
    const line = lines[visible].text
    if (char < line.length) {
      const t = setTimeout(() => setChar((c) => c + 1), 20 + Math.random() * 40)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setVisible((v) => v + 1)
        setChar(0)
      }, 400)
      return () => clearTimeout(t)
    }
  }, [visible, char])

  return (
    <>
      {lines.slice(0, visible + 1).map((line, i) => (
        <p key={i} className={`${line.color} whitespace-pre-wrap leading-6`}>
          {i < visible ? line.text : line.text.slice(0, char)}
          {i === visible && char < line.text.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-cyan-400 ml-0.5"
            >
              ▊
            </motion.span>
          )}
        </p>
      ))}
    </>
  )
}

function SectionTitle() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="text-center max-w-4xl mx-auto mb-24 md:mb-32"
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-cyan-400 mb-5"
      >
        Terminal
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        One command away
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Push your code and let Sentinel handle the rest. Watch the live deployment unfold.
      </p>
    </motion.div>
  )
}

export default function TerminalSection() {
  return (
    <section className="py-36 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionTitle />

        <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.02] shadow-2xl shadow-cyan-500/5 overflow-hidden">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-6 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-xs text-slate-500 font-mono ml-3">terminal — ~/project — zsh</span>
            <span className="ml-auto text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Connected
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-6 md:p-8 font-mono text-sm leading-relaxed bg-[#03050a] min-h-[480px]">
            <Typewriter />
          </div>
        </div>
      </div>
    </section>
  )
}
