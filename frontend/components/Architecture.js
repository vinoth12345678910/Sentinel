'use client'

import { motion } from 'framer-motion'
import {
  Terminal,
  GitBranch,
  Shield,
  Server,
  Container,
  Globe,
  Layers,
  BarChart3,
  Bell,
} from 'lucide-react'

const layers = [
  { label: 'Developer', icon: <Terminal className="w-4 h-4" />, color: 'from-cyan-400 to-blue-500' },
  { label: 'GitHub', icon: <GitBranch className="w-4 h-4" />, color: 'from-blue-400 to-purple-500' },
  { label: 'Sentinel Control Plane', icon: <Shield className="w-4 h-4" />, color: 'from-cyan-500 to-blue-600' },
  { label: 'Build Server', icon: <Server className="w-4 h-4" />, color: 'from-indigo-500 to-purple-600' },
  { label: 'Docker Engine', icon: <Container className="w-4 h-4" />, color: 'from-blue-500 to-indigo-600' },
  { label: 'Nginx / Reverse Proxy', icon: <Globe className="w-4 h-4" />, color: 'from-green-400 to-emerald-500' },
  { label: 'Application Containers', icon: <Layers className="w-4 h-4" />, color: 'from-purple-400 to-pink-500' },
  { label: 'Prometheus / Grafana', icon: <BarChart3 className="w-4 h-4" />, color: 'from-orange-400 to-red-500' },
  { label: 'Alerts & Notifications', icon: <Bell className="w-4 h-4" />, color: 'from-red-400 to-rose-500' },
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
        Architecture
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        Infrastructure overview
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        A clean layered architecture that scales from personal projects to production deployments.
      </p>
    </motion.div>
  )
}

export default function Architecture() {
  return (
    <section className="py-36 px-6" id="architecture">
      <div className="max-w-5xl mx-auto">
        <SectionTitle />

        <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent overflow-hidden">
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-3xl" />

          <div className="relative bg-[#060b18]/95 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-8 md:p-12">
            <div className="flex flex-col items-center gap-0">
              {layers.map((layer, i) => (
                <div key={i} className="flex flex-col items-center w-full max-w-md">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    <div
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r ${layer.color} shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group`}
                    >
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                      <div className="relative flex items-center gap-3">
                        {layer.icon}
                        <span className="text-sm font-semibold text-white">{layer.label}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Connector line */}
                  {i < layers.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      whileInView={{ opacity: 1, scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 + 0.15, duration: 0.3 }}
                      className="h-6 w-[2px] bg-gradient-to-b from-cyan-400/40 to-transparent"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
