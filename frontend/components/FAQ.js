'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'How does the deployment process work?',
    a: 'Push to any branch on your GitHub repository. Sentinel receives the webhook, clones the repo, builds a Docker image, deploys it with health checks, configures Nginx, and provisions SSL — all automatically.',
  },
  {
    q: 'Can I self-host Sentinel?',
    a: 'Yes. Sentinel is fully open-source and designed to be self-hosted on any Linux server with Docker. Deploy in minutes with our one-command setup script.',
  },
  {
    q: 'Does Sentinel support Docker?',
    a: 'Absolutely. Every deployment runs in an isolated Docker container with resource limits, dropped Linux capabilities, and non-root user execution for maximum security.',
  },
  {
    q: 'How does rollback work?',
    a: 'We keep the previous Docker image for every deployment. Rollback is a single click — we stop the current container and start the previous one, re-running health verification.',
  },
  {
    q: 'Can I use custom domains?',
    a: 'Yes. Add custom domains with one click. SSL certificates are automatically provisioned and renewed via Let\'s Encrypt with zero manual intervention.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Sentinel is free and open-source. Self-host on your own infrastructure with no usage limits, no hidden costs, and no vendor lock-in.',
  },
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
        FAQ
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        Frequently asked questions
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Everything you need to know about Sentinel.
      </p>
    </motion.div>
  )
}

export default function FAQ() {
  const [active, setActive] = useState(null)

  return (
    <section className="py-36 px-6 bg-white/[0.01] border-y border-white/[0.04]">
      <div className="max-w-3xl mx-auto">
        <SectionTitle />

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.10] transition-colors"
            >
              <button
                onClick={() => setActive(active === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                    active === i ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {active === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/[0.04] pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
