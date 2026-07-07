'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  GitBranch,
  Container,
  HeartPulse,
  RotateCcw,
  Terminal,
  BarChart3,
  Box,
  Globe,
  Variable,
  KeyRound,
  Users,
} from 'lucide-react'

const features = [
  { icon: <Zap className="w-5 h-5" />, title: 'One-Click Deployments', desc: 'Push to GitHub, auto-deploy with zero config. The webhook triggers clone, build, deploy, verify — fully automated.' },
  { icon: <GitBranch className="w-5 h-5" />, title: 'GitHub Webhooks', desc: 'Automatic deployments triggered by every push. Branch-based preview deployments included.' },
  { icon: <Container className="w-5 h-5" />, title: 'Automatic Docker Builds', desc: 'Every deployment produces an optimized Docker image with resource limits, capability drops, and non-root users.' },
  { icon: <HeartPulse className="w-5 h-5" />, title: 'Health Checks', desc: 'Configurable health check endpoints with automatic rollback on failure. 3 consecutive passes required.' },
  { icon: <RotateCcw className="w-5 h-5" />, title: 'Zero Downtime Rollbacks', desc: 'Instant rollback to any previous successful deployment. Previous image preserved for immediate recovery.' },
  { icon: <Terminal className="w-5 h-5" />, title: 'Live Logs', desc: 'Real-time log streaming via SSE. Filter by deployment ID, follow logs as they happen.' },
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Real-Time Metrics', desc: 'Container CPU, memory, network, and block I/O metrics. Prometheus endpoint for external monitoring.' },
  { icon: <Box className="w-5 h-5" />, title: 'Container Isolation', desc: 'Each app runs in its own Docker container with strict resource limits, dropped capabilities, and non-root execution.' },
  { icon: <Globe className="w-5 h-5" />, title: 'Reverse Proxy', desc: 'Auto-configured Nginx reverse proxy with custom domains. SSL certificates provisioned via Let\'s Encrypt.' },
  { icon: <KeyRound className="w-5 h-5" />, title: 'SSL Automation', desc: 'Every app gets auto-provisioned Let\'s Encrypt SSL. Custom domain support with automatic certificate renewal.' },
  { icon: <Variable className="w-5 h-5" />, title: 'Environment Variables', desc: 'Encrypted env var storage with AES-256-GCM. Automatically injected into containers at deploy time.' },
  { icon: <Users className="w-5 h-5" />, title: 'Role Based Access', desc: 'Admin, member, and viewer roles. Per-user quotas for apps and daily deployments.' },
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
        Features
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        Why developers love Sentinel
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Everything you need to ship production-ready applications with confidence.
      </p>
    </motion.div>
  )
}

export default function Features() {
  return (
    <section className="py-36 px-6" id="features">
      <div className="max-w-7xl mx-auto">
        <SectionTitle />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.06] to-transparent hover:from-cyan-400/30 hover:to-blue-500/10 transition-all duration-500"
            >
              {/* Gradient border glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent group-hover:from-cyan-400/[0.08] group-hover:to-blue-500/[0.03] transition-all duration-500" />

              {/* Card body */}
              <div className="relative h-full p-6 rounded-2xl bg-[#060b18]/90 backdrop-blur-xl group-hover:bg-[#060b18]/70 transition-all duration-500">
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border border-cyan-400/10 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-500/10 transition-all duration-300">
                  {f.icon}
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold text-white mb-2.5 group-hover:text-cyan-200 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
