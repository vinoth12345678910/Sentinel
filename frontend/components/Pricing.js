'use client'

import { motion } from 'framer-motion'
import { Shield, CheckCircle, ArrowRight } from 'lucide-react'

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const benefits = [
  'Unlimited deployments',
  'Unlimited apps',
  'Unlimited team members',
  'Custom domains & SSL',
  'Health monitoring & rollbacks',
  'All features included',
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
        Pricing
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        Open source. Free forever.
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        No hidden costs, no usage limits, no vendor lock-in.
      </p>
    </motion.div>
  )
}

export default function Pricing() {
  return (
    <section className="py-36 px-6" id="pricing">
      <div className="max-w-lg mx-auto">
        <SectionTitle />

        <div className="relative group p-[1px] rounded-3xl bg-gradient-to-b from-cyan-400/30 via-blue-500/20 to-transparent hover:from-cyan-400/40 hover:via-blue-500/30 transition-all duration-500">
          {/* Outer glow on hover */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />

          <div className="relative p-10 md:p-12 rounded-[calc(1.5rem-1px)] bg-[#060b18]/95 backdrop-blur-xl text-center border border-white/[0.04]">
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-[10px] font-semibold text-white uppercase tracking-wider shadow-lg">
              Open Source
            </div>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border border-cyan-400/10 flex items-center justify-center mx-auto mb-8 mt-4">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>

            {/* Price */}
            <div className="mb-8">
              <span className="text-6xl font-bold text-white">$0</span>
              <span className="text-slate-500 ml-2 text-lg">/ month</span>
            </div>

            {/* Feature checklist */}
            <ul className="text-left space-y-4 mb-10 max-w-xs mx-auto">
              {benefits.map((benefit, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  {benefit}
                </motion.li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-4 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl hover:shadow-xl hover:shadow-cyan-500/20 transition-all group"
            >
              <GithubIcon className="w-5 h-5" />
              View on GitHub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
