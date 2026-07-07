'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Container,
  Terminal,
  GitCommit,
  Activity,
  Cpu,
  HardDrive,
  Rocket,
} from 'lucide-react'

const deployments = [
  { app: 'api-gateway', status: 'Live', hash: 'a3f2c1', time: '2m ago', cpu: '24%', mem: '128MB' },
  { app: 'frontend', status: 'Deploying', hash: 'b7e4d9', time: '5m ago', cpu: '56%', mem: '256MB' },
  { app: 'worker', status: 'Healthy', hash: 'f1a3b2', time: '12m ago', cpu: '12%', mem: '64MB' },
  { app: 'cron-sync', status: 'Live', hash: 'd4c5e6', time: '24m ago', cpu: '8%', mem: '32MB' },
]

const commits = [
  { msg: 'feat: add auto-scaling', author: 'vinothz', time: '12m ago' },
  { msg: 'fix: health check timeout', author: 'vinothz', time: '34m ago' },
  { msg: 'chore: update deps', author: 'vinothz', time: '1h ago' },
]

const timeline = [
  { time: '14:32', event: 'Push detected', status: 'done' },
  { time: '14:33', event: 'Build started', status: 'done' },
  { time: '14:34', event: 'Deploying', status: 'active' },
  { time: '14:35', event: 'Health check', status: 'pending' },
]

const tabs = [
  { id: 'deployments', label: 'Deployments', icon: <Rocket className="w-3.5 h-3.5" /> },
  { id: 'metrics', label: 'Metrics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'containers', label: 'Containers', icon: <Container className="w-3.5 h-3.5" /> },
  { id: 'logs', label: 'Logs', icon: <Terminal className="w-3.5 h-3.5" /> },
  { id: 'git', label: 'Git', icon: <GitCommit className="w-3.5 h-3.5" /> },
]

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
        Dashboard
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        Full observability
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Monitor every aspect of your deployments in real-time.
      </p>
    </motion.div>
  )
}

function Bar({ height, delay = 0 }) {
  return (
    <motion.div
      initial={{ height: 0 }}
      whileInView={{ height: `${height}%` }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-gradient-to-t from-cyan-400/40 to-blue-500/20 rounded-sm"
    />
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('deployments')

  return (
    <section className="py-36 px-6 bg-white/[0.01] border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto">
        <SectionTitle />

        <div className="relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/8 via-blue-500/5 to-transparent rounded-3xl blur-[100px]" />

          <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 rounded-3xl" />

            <div className="relative bg-[#060b18]/95 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-6 px-6 py-4 border-b border-white/[0.06] overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dashboard body */}
              <div className="p-6 lg:p-8">
                <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
                  {/* Left: Timeline + Deployments */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Deployment graph */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          Deployment Timeline
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-[10px] text-slate-500">Live</span>
                        </div>
                      </div>

                      {/* Sparkline */}
                      <svg className="w-full h-16" viewBox="0 0 400 40" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="tl-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(34,211,238,0.25)" />
                            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,30 Q20,28 40,32 Q60,36 80,25 Q100,14 120,18 Q140,22 160,12 Q180,4 200,8 Q220,12 240,6 Q260,2 280,10 Q300,18 320,8 Q340,2 360,6 Q380,10 400,4"
                          fill="none"
                          stroke="rgba(34,211,238,0.6)"
                          strokeWidth="2"
                        />
                        <path
                          d="M0,30 Q20,28 40,32 Q60,36 80,25 Q100,14 120,18 Q140,22 160,12 Q180,4 200,8 Q220,12 240,6 Q260,2 280,10 Q300,18 320,8 Q340,2 360,6 Q380,10 400,4 L400,40 L0,40 Z"
                          fill="url(#tl-grad)"
                        />
                      </svg>

                      {/* Timeline cards */}
                      <div className="grid grid-cols-4 gap-3 mt-4">
                        {timeline.map((evt, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  evt.status === 'done'
                                    ? 'bg-green-400'
                                    : evt.status === 'active'
                                      ? 'bg-cyan-400 animate-pulse'
                                      : 'bg-slate-600'
                                }`}
                              />
                              <span className="text-[10px] font-mono text-slate-500">{evt.time}</span>
                            </div>
                            <span
                              className={`text-xs ${
                                evt.status === 'pending' ? 'text-slate-500' : 'text-slate-300'
                              }`}
                            >
                              {evt.event}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deployments table */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          Active Deployments
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">4 running</span>
                      </div>
                      <div className="space-y-2">
                        {deployments.map((d, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  d.status === 'Live' || d.status === 'Healthy'
                                    ? 'bg-green-400'
                                    : 'bg-cyan-400 animate-pulse'
                                }`}
                              />
                              <span className="text-sm text-white font-medium">{d.app}</span>
                              <span className="text-[11px] text-slate-600 font-mono">{d.hash}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[11px] text-slate-500">{d.cpu} CPU</span>
                              <span className="text-[11px] text-slate-500">{d.mem}</span>
                              <span className="text-[11px] text-slate-600">{d.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="space-y-4">
                    {/* CPU */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                      <div className="flex items-center gap-2 mb-5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">CPU</span>
                      </div>
                      <div className="mb-3">
                        <span className="text-4xl font-bold text-cyan-400">34</span>
                        <span className="text-sm text-slate-500 ml-1">%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '34%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        />
                      </div>
                      <div className="mt-3 flex justify-between text-[10px] text-slate-500">
                        <span>Used: 1.2GHz</span>
                        <span>Total: 3.5GHz</span>
                      </div>
                    </div>

                    {/* Memory */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                      <div className="flex items-center gap-2 mb-5">
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Memory</span>
                      </div>
                      <div className="mb-3">
                        <span className="text-4xl font-bold text-blue-400">2.1</span>
                        <span className="text-sm text-slate-500 ml-1">GB</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: '62%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                        />
                      </div>
                      <div className="mt-3 flex justify-between text-[10px] text-slate-500">
                        <span>Used: 2.1GB</span>
                        <span>Total: 3.4GB</span>
                      </div>
                    </div>

                    {/* Network */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                      <div className="flex items-center gap-2 mb-5">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Network</span>
                      </div>
                      <div className="flex items-center gap-6 mb-3">
                        <div>
                          <span className="text-xl font-bold text-green-400">1.2</span>
                          <span className="text-[10px] text-slate-500 ml-1">GB↓</span>
                        </div>
                        <div>
                          <span className="text-xl font-bold text-cyan-400">0.4</span>
                          <span className="text-[10px] text-slate-500 ml-1">GB↑</span>
                        </div>
                      </div>
                      {/* Bar chart */}
                      <div className="flex gap-1 items-end h-8">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="flex-1 h-full rounded-sm bg-white/[0.04] overflow-hidden flex flex-col justify-end">
                            <Bar height={20 + Math.random() * 80} delay={i * 0.05} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Git commits */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <GitCommit className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Recent Commits</span>
                      </div>
                      <div className="space-y-2.5">
                        {commits.map((c, i) => (
                          <div key={i} className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                            <span className="text-[11px] text-slate-300 truncate flex-1">{c.msg}</span>
                            <span className="text-[10px] text-slate-600 shrink-0">{c.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
