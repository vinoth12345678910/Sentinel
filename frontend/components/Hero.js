'use client'

import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Zap, RotateCcw, Container } from 'lucide-react'

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const FloatingBadge = ({ icon, label, x, y, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
    transition={{
      opacity: { delay: 1.2 + delay },
      scale: { delay: 1.2 + delay },
      y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
    }}
    className="absolute hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-2xl"
    style={{ top: y, left: x }}
  >
    <span className="text-cyan-400">{icon}</span>
    <span className="text-xs font-medium text-white/80 whitespace-nowrap">{label}</span>
  </motion.div>
)

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex items-center pt-24 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.06)_0%,transparent_60%)]" />

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center min-h-[calc(100vh-8rem)]">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-cyan-500/20 bg-cyan-500/5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-cyan-400">
                Open-Source Deployment Platform
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-8xl xl:text-9xl font-bold text-white mb-8 leading-[0.95] tracking-[-0.03em]">
              Deploy.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Monitor.
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Recover. Auto.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
              Sentinel is an intelligent self-hosted deployment platform that automatically builds,
              deploys, monitors, heals, and rolls back your applications with zero downtime.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/login')}
                className="group relative px-10 py-4 text-lg font-semibold text-white rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl bg-gradient-to-r from-cyan-400 to-blue-500" />
                <span className="relative flex items-center gap-3">
                  Start Deploying
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-10 py-4 text-lg font-semibold border border-white/10 text-slate-300 rounded-2xl hover:border-cyan-400/50 hover:text-white transition-all inline-flex items-center gap-3"
              >
                <GithubIcon className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            {/* Floating badges */}
            <div className="relative mt-16 hidden lg:block h-16">
              <FloatingBadge icon={<Zap className="w-3.5 h-3.5" />} label="Zero Downtime" x="0" y="0" delay={0} />
              <FloatingBadge icon={<RotateCcw className="w-3.5 h-3.5" />} label="Auto Rollback" x="140" y="40" delay={1} />
              <FloatingBadge icon={<Container className="w-3.5 h-3.5" />} label="Docker Native" x="280" y="10" delay={2} />
              <FloatingBadge icon={<Shield className="w-3.5 h-3.5" />} label="Self Hosted" x="400" y="30" delay={0.5} />
            </div>
          </motion.div>

          {/* Right: Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Glow behind dashboard */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent rounded-3xl blur-[80px]" />

            <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 rounded-3xl" />
              <div className="relative bg-[#060b18]/95 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] overflow-hidden">
                {/* Dashboard header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">sentinel — production</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      All Systems Healthy
                    </span>
                  </div>
                </div>

                {/* Dashboard content */}
                <div className="p-5 space-y-4">
                  {/* Metrics row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Deployments', value: '247', change: '+12', color: 'text-cyan-400' },
                      { label: 'Containers', value: '18', change: '6 running', color: 'text-green-400' },
                      { label: 'CPU', value: '34%', change: '-2%', color: 'text-blue-400' },
                      { label: 'Memory', value: '2.1GB', change: '44% used', color: 'text-purple-400' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                        <div className="text-[10px] text-slate-500 mb-1 font-medium">{s.label}</div>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-lg font-bold tracking-tight ${s.color}`}>{s.value}</span>
                          <span className="text-[10px] text-slate-500">{s.change}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Two-column layout */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Left: Deployments */}
                    <div className="col-span-2 space-y-3">
                      {/* Deployment graph */}
                      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            Deployments
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono">+247 today</span>
                        </div>
                        <svg className="w-full h-10" viewBox="0 0 200 30" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="graph-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(34,211,238,0.3)" />
                              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,25 Q10,20 20,22 Q30,24 40,18 Q50,12 60,15 Q70,18 80,10 Q90,5 100,8 Q110,11 120,4 Q130,2 140,6 Q150,10 160,3 Q170,1 180,5 Q190,8 200,2"
                            fill="none"
                            stroke="rgba(34,211,238,0.5)"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M0,25 Q10,20 20,22 Q30,24 40,18 Q50,12 60,15 Q70,18 80,10 Q90,5 100,8 Q110,11 120,4 Q130,2 140,6 Q150,10 160,3 Q170,1 180,5 Q190,8 200,2 L200,30 L0,30 Z"
                            fill="url(#graph-grad)"
                          />
                        </svg>
                      </div>

                      {/* Recent deployments */}
                      <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            Recent Deployments
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Live
                          </span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { app: 'api-gateway', status: 'Live', hash: 'a3f2c1', time: '2m ago', branch: 'main' },
                            { app: 'frontend', status: 'Deploying', hash: 'b7e4d9', time: '5m ago', branch: 'feat/auth' },
                            { app: 'worker', status: 'Healthy', hash: 'f1a3b2', time: '12m ago', branch: 'main' },
                            { app: 'cron-sync', status: 'Live', hash: 'd4c5e6', time: '24m ago', branch: 'staging' },
                          ].map((d, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${d.status === 'Live' || d.status === 'Healthy' ? 'bg-green-400' : 'bg-cyan-400 animate-pulse'}`}
                                />
                                <span className="text-xs text-white font-medium">{d.app}</span>
                                <span className="text-[10px] text-slate-600 font-mono">{d.hash}</span>
                                <span className="text-[10px] text-slate-600">({d.branch})</span>
                              </div>
                              <span className="text-[10px] text-slate-500">{d.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Resources */}
                    <div className="space-y-3">
                      {[
                        { label: 'CPU', value: '34', unit: '%', color: 'text-cyan-400', bar: 'bg-cyan-400', width: '34%', delay: 0.5 },
                        { label: 'RAM', value: '62', unit: '%', color: 'text-blue-400', bar: 'bg-blue-400', width: '62%', delay: 0.7 },
                        { label: 'Network', value: '28', unit: 'MB/s', color: 'text-purple-400', bar: 'bg-purple-400', width: '28%', delay: 0.9 },
                        { label: 'Containers', value: '6', unit: 'running', color: 'text-green-400', bar: null, width: null, delay: 1.1 },
                      ].map((r, i) => (
                        <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-2 block">
                            {r.label}
                          </span>
                          <div className="mb-2">
                            <span className={`text-2xl font-bold ${r.color}`}>{r.value}</span>
                            <span className="text-xs text-slate-500 ml-1">{r.unit}</span>
                          </div>
                          {r.bar && (
                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: r.width }}
                                transition={{ duration: 1, delay: r.delay }}
                                className={`h-full rounded-full ${r.bar}`}
                              />
                            </div>
                          )}
                          {!r.bar && (
                            <div className="flex gap-1">
                              {[...Array(6)].map((_, j) => (
                                <div
                                  key={j}
                                  className="w-2 h-2 rounded-full bg-green-400/60 animate-pulse"
                                  style={{ animationDelay: `${j * 0.3}s` }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
