'use client'

import { motion } from 'framer-motion'

const technologies = [
  'Docker',
  'GitHub',
  'Nginx',
  'Node.js',
  'Redis',
  'PostgreSQL',
  'AWS',
  'Prometheus',
  'Grafana',
  'Kubernetes',
]

export default function Trust() {
  return (
    <section className="py-24 px-6 border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs font-semibold tracking-[0.25em] uppercase text-slate-500 mb-12"
        >
          Built with technologies developers love
        </motion.p>

        <div className="flex flex-wrap justify-center gap-4">
          {technologies.map((tech, i) => (
            <motion.div
              key={tech}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="px-6 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-slate-400 hover:border-cyan-400/30 hover:text-cyan-400 hover:bg-white/[0.04] transition-all cursor-default"
            >
              {tech}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
