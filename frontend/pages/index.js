'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import { Shield, ArrowRight, CheckCircle, Terminal, GitBranch, Container, Globe, BarChart3, Activity, Layers, Cpu, HardDrive } from 'lucide-react'

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

function Typewriter() {
  const lines = [
    '$ git push origin main',
    '> Webhook received — sentinel.systems',
    '> Cloning repository...',
    '> Building Docker image...',
    '  ✓ Build completed in 12.4s',
    '> Deploying container...',
    '  ✓ Health check passed (3/3)',
    '> Traffic switched',
    '✓ Production deployment successful',
  ]
  const [visible, setVisible] = useState(0)
  const [char, setChar] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (visible >= lines.length) {
      const t = setTimeout(() => setDone(true), 1000)
      return () => clearTimeout(t)
    }
    const line = lines[visible]
    if (char < line.length) {
      const t = setTimeout(() => setChar(c => c + 1), 15 + Math.random() * 30)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => { setVisible(v => v + 1); setChar(0) }, 300)
    return () => clearTimeout(t)
  }, [visible, char])

  if (done) {
    return (
      <div className="space-y-1.5 opacity-80">
        {lines.map((l, i) => (
          <p key={i} className={`text-xs md:text-sm leading-6 font-mono ${
            l.startsWith('  ✓') || l.startsWith('✓') ? 'text-green-400/80' :
            l.startsWith('$') ? 'text-green-400/90' :
            l.startsWith('>') ? 'text-slate-400/80' : 'text-slate-500/60'
          }`}>{l}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {lines.slice(0, visible + 1).map((l, i) => (
        <p key={i} className={`text-xs md:text-sm leading-6 font-mono ${
          l.startsWith('  ✓') || l.startsWith('✓') ? 'text-green-400/80' :
          l.startsWith('$') ? 'text-green-400/90' :
          l.startsWith('>') ? 'text-slate-400/80' : 'text-slate-500/60'
        }`}>
          {i < visible ? l : l.slice(0, char)}
          {i === visible && char < l.length && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-cyan-400/80 ml-0.5">▊</motion.span>
          )}
        </p>
      ))}
    </div>
  )
}

const Orb = ({ size, color1, color2, top, left, delay = 0 }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ width: size, height: size, top, left, filter: 'blur(120px)' }}
    animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0], y: [0, -50, 0] }}
    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay }}
  >
    <div className="w-full h-full rounded-full" style={{ background: `radial-gradient(circle, ${color1}, ${color2})` }} />
  </motion.div>
)

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const bgY = useTransform(progress, [0, 1], [0, 150])

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden selection:bg-cyan-500/30">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0b1628] to-[#020617]" />
        <Orb size="800px" color1="rgba(34,211,238,0.1)" color2="rgba(59,130,246,0.03)" top="-20%" left="-10%" />
        <Orb size="600px" color1="rgba(139,92,246,0.06)" color2="rgba(59,130,246,0.02)" top="50%" right="-15%" delay={4} />
        <Orb size="500px" color1="rgba(34,211,238,0.04)" color2="rgba(6,182,212,0.01)" top="80%" left="20%" delay={8} />
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/4 rounded-full blur-[200px] animate-pulse" />
        </motion.div>
        <svg className="absolute inset-0 w-full h-full opacity-[0.01]" preserveAspectRatio="none">
          <defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.4" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.03)_0%,transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px 200px' }} />
      </div>

      {/* Progress */}
      <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 origin-left" style={{ scaleX: progress }} />

      {/* Nav — floating pill */}
      <nav className="fixed top-5 left-0 right-0 z-[60] flex justify-center">
        <div className="w-full max-w-5xl mx-5 px-6 h-14 flex items-center justify-between rounded-2xl bg-[#020617]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5 text-[#020617]" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Sentinel</span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Pricing'].map((link, i) => (
              <a key={link} href="#" className="text-sm text-slate-400 hover:text-white transition-colors">{link}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-white transition-colors">
              <GithubIcon className="w-5 h-5" />
            </a>
            <button onClick={() => router.push('/login')} className="relative group px-5 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-gradient-to-r from-cyan-400 to-blue-500 transition-opacity" />
              <span className="relative">Get Started</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 px-8">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-cyan-500/20 bg-cyan-500/5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-cyan-400">Open-Source Deployment Platform</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-[0.95] tracking-[-0.04em] mb-10"
              >
                Deploy without
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">the fear factor.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-slate-400 leading-relaxed max-w-lg mb-12"
              >
                Sentinel auto-builds, deploys, monitors, and rolls back your apps. Push code. That's it.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button onClick={() => router.push('/login')} className="group relative px-8 py-3.5 text-base font-semibold text-white rounded-xl overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl bg-gradient-to-r from-cyan-400 to-blue-500 transition-opacity" />
                  <span className="relative flex items-center gap-2">Start Deploying <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                </button>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="group px-8 py-3.5 text-base font-semibold border border-white/10 text-slate-300 rounded-xl hover:border-cyan-400/50 hover:text-white transition-all inline-flex items-center gap-2">
                  <GithubIcon className="w-4 h-4" /> View on GitHub
                </a>
              </motion.div>
            </div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent rounded-3xl blur-[60px]" />
              <div className="relative rounded-2xl border border-white/[0.06] bg-[#060b18]/80 backdrop-blur-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">sentinel — deploy</span>
                  <span className="flex items-center gap-1 text-[10px] text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> All Healthy
                  </span>
                </div>
                <div className="p-5 min-h-[280px]">
                  <Typewriter />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Proof: One number */}
      <section className="py-48 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-semibold tracking-[0.25em] uppercase text-slate-500 mb-6 block"
            >
              Trusted in production
            </motion.span>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-8xl md:text-9xl lg:text-[10rem] font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent leading-none tracking-[-0.04em]"
            >
              99.99%
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-lg text-slate-500 mt-6"
            >
              Deployment success rate across all projects
            </motion.p>
          </div>
        </div>
      </section>

      {/* How it works — 3 editorial blocks */}
      <section className="py-44 px-8 border-y border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-400 mb-6 block"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-24 tracking-tight leading-[1.05]"
          >
            Push to production.
            <br />
            Three steps, zero config.
          </motion.h2>

          <div className="space-y-28">
            {[
              { num: '01', icon: <Terminal className="w-6 h-6" />, title: 'Push your code', desc: 'Connect your GitHub repo and push. Sentinel catches the webhook automatically. No plugins, no CI config, no YAML files.' },
              { num: '02', icon: <Container className="w-6 h-6" />, title: 'We build & deploy', desc: 'Your code is cloned, Dockerized, and deployed with health checks, SSL, and a reverse proxy — all automatically.' },
              { num: '03', icon: <BarChart3 className="w-6 h-6" />, title: 'Monitor & recover', desc: 'Real-time metrics, live logs, and instant rollbacks. If something fails, we revert before you notice.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="grid md:grid-cols-[auto_1fr_1.5fr] gap-8 md:gap-16 items-start"
              >
                <span className="text-7xl md:text-8xl font-bold text-white/10 tracking-tight leading-none">{step.num}</span>
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border border-cyan-400/10 flex items-center justify-center text-cyan-400">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{step.title}</h3>
                </div>
                <p className="text-base md:text-lg text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prerequisites for deploying on Sentinel */}
      <section className="py-44 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-400 mb-6 block"
          >
            What your app needs
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-24 tracking-tight leading-[1.05]"
          >
            Prerequisites.
            <br />
            Minimal, intentional.
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Terminal className="w-5 h-5" />, title: 'Dockerfile', desc: 'Your repo must contain a Dockerfile at the root. Sentinel builds it automatically on every push.' },
              { icon: <Globe className="w-5 h-5" />, title: 'Port', desc: 'Your app must listen on the port you configure (default 3000). The container port is mapped to an available host port.' },
              { icon: <Activity className="w-5 h-5" />, title: 'Health check', desc: 'A GET /api/health (or custom path) that returns 200. Sentinel waits for 3 consecutive passes before switching traffic.' },
              { icon: <HardDrive className="w-5 h-5" />, title: 'No root user', desc: 'Containers run as non-root (uid:1000) with no-new-privileges and all capabilities dropped except NET_BIND_SERVICE.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-400/20 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border border-cyan-400/10 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard showcase — wide */}
      <section className="py-44 px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-[400px_1fr] gap-16 lg:gap-24 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-400 mb-6 block"
              >
                Dashboard
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]"
              >
                Everything at a glance.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-400 leading-relaxed"
              >
                CPU, memory, network, deployments, logs, and commits. One dashboard, no context switching.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/10 via-blue-500/5 to-transparent rounded-3xl blur-[80px]" />
              <div className="relative rounded-2xl border border-white/[0.06] bg-[#060b18]/80 backdrop-blur-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">sentinel — production</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> All Systems Healthy
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Deployments', value: '247', color: 'text-cyan-400' },
                      { label: 'Containers', value: '18', color: 'text-green-400' },
                      { label: 'CPU', value: '34%', color: 'text-blue-400' },
                      { label: 'Memory', value: '2.1GB', color: 'text-purple-400' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
                        <div className="text-xs text-slate-500 mb-1.5 font-medium">{s.label}</div>
                        <div className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-5">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-3">Deployments</span>
                      <svg className="w-full h-10" viewBox="0 0 200 30" preserveAspectRatio="none">
                        <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(34,211,238,0.3)" /><stop offset="100%" stopColor="rgba(34,211,238,0)" /></linearGradient></defs>
                        <path d="M0,25 Q20,22 40,18 Q60,14 80,10 Q100,8 120,4 Q140,2 160,6 Q180,10 200,3" fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="1.5" />
                        <path d="M0,25 Q20,22 40,18 Q60,14 80,10 Q100,8 120,4 Q140,2 160,6 Q180,10 200,3 L200,30 L0,30 Z" fill="url(#dg)" />
                      </svg>
                    </div>
                    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-5">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-3">Resources</span>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-400">CPU</span><span className="text-slate-300">34%</span></div>
                          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '34%' }} viewport={{ once: true }} className="h-full rounded-full bg-cyan-400" /></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-400">RAM</span><span className="text-slate-300">62%</span></div>
                          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '62%' }} viewport={{ once: true }} className="h-full rounded-full bg-blue-400" /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-48 px-8 bg-white/[0.01] border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.svg
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-8 h-8 text-cyan-400/40 mx-auto mb-8"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </motion.svg>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl lg:text-4xl text-slate-200 leading-relaxed font-medium tracking-tight mb-10"
          >
            &ldquo;We evaluated Vercel, Railway, and Render. Sentinel&rsquo;s self-hosted model gives us complete control while matching their developer experience.&rdquo;
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">MJ</div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Marcus Johnson</p>
              <p className="text-xs text-slate-500">CTO at Stackflow</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-48 px-8" id="pricing">
        <div className="max-w-lg mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.25em] uppercase text-cyan-400 mb-6 block"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight leading-[1.05]"
          >
            Open source.
            <br />
            Free forever.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mb-12"
          >
            No limits. No hidden costs. No vendor lock-in.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="p-[1px] rounded-3xl bg-gradient-to-b from-cyan-400/30 via-blue-500/20 to-transparent"
          >
            <div className="relative p-12 rounded-[calc(1.5rem-1px)] bg-[#060b18]/95 backdrop-blur-xl border border-white/[0.04]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-[10px] font-semibold text-white uppercase tracking-wider shadow-lg">Open Source</div>
              <div className="mb-8 mt-6">
                <span className="text-6xl font-bold text-white">$0</span>
                <span className="text-slate-500 ml-2 text-lg">/ month</span>
              </div>
              <ul className="space-y-3 mb-8 text-left max-w-xs mx-auto">
                {['Unlimited deployments', 'Unlimited apps', 'Unlimited team members', 'Custom domains & SSL', 'Health monitoring & rollbacks'].map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />{b}</li>
                ))}
              </ul>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all">
                <GithubIcon className="w-4 h-4" /> View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-52 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse" />
        <div className="relative max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
              Ready to ship?
            </h2>
            <p className="text-lg text-slate-400 mb-12 max-w-sm mx-auto">
              Connect your GitHub account and deploy your first app in under a minute.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => router.push('/login')} className="group relative px-8 py-3.5 text-base font-semibold text-white rounded-xl overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl bg-gradient-to-r from-cyan-400 to-blue-500 transition-opacity" />
                <span className="relative flex items-center gap-2">Deploy Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
              </button>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 text-base font-semibold border border-white/10 text-slate-300 rounded-xl hover:border-cyan-400/50 hover:text-white transition-all inline-flex items-center gap-2">
                <GithubIcon className="w-4 h-4" /> GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-8 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg"><Shield className="w-3.5 h-3.5 text-[#020617]" /></div>
            <span className="text-sm font-semibold text-white">Sentinel</span>
            <span className="text-slate-600 text-sm mx-1">—</span>
            <span className="text-sm text-slate-500">Open-source deployment platform</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">Documentation</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">GitHub</a>
            <a href="#" className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">License</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
