'use client'

import { motion } from 'framer-motion'
import {
  GitCommit,
  Activity,
  Container,
  Layers,
  Rocket,
  HeartPulse,
  ArrowRight,
  BarChart3,
  RotateCcw,
} from 'lucide-react'

const steps = [
  { label: 'Git Push', icon: <GitCommit className="w-4 h-4" /> },
  { label: 'Webhook', icon: <Activity className="w-4 h-4" /> },
  { label: 'Build', icon: <Container className="w-4 h-4" /> },
  { label: 'Docker', icon: <Layers className="w-4 h-4" /> },
  { label: 'Deploy', icon: <Rocket className="w-4 h-4" /> },
  { label: 'Health Check', icon: <HeartPulse className="w-4 h-4" /> },
  { label: 'Traffic Switch', icon: <ArrowRight className="w-4 h-4" /> },
  { label: 'Monitor', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Rollback', icon: <RotateCcw className="w-4 h-4" /> },
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
        Pipeline
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        From push to production
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Fully automated deployment pipeline — no manual steps required.
      </p>
    </motion.div>
  )
}

export default function Pipeline() {
  return (
    <section className="py-36 px-6 bg-white/[0.01] border-y border-white/[0.04]" id="pipeline">
      <div className="max-w-7xl mx-auto">
        <SectionTitle />

        <div className="relative">
          {/* Glowing track line (desktop) */}
          <div className="absolute top-12 left-[4.5rem] right-[4.5rem] h-[1px] bg-gradient-to-r from-cyan-400/0 via-cyan-400/20 to-blue-500/0 hidden lg:block" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-6 lg:gap-2">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center relative">
                {/* Icon circle */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.08,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="relative z-10"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-shadow">
                    {step.icon}
                  </div>

                  {/* Step number badge */}
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#020617] border-2 border-cyan-400/40 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-cyan-400">{i + 1}</span>
                  </div>

                  {/* Connecting line (desktop) */}
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-4 w-8">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 + 0.3, duration: 0.4 }}
                        className="h-[1px] bg-gradient-to-r from-cyan-400/40 to-transparent origin-left"
                      />
                    </div>
                  )}
                </motion.div>

                {/* Label */}
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 + 0.15 }}
                  className="text-xs text-slate-400 mt-3 font-medium text-center"
                >
                  {step.label}
                </motion.p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
