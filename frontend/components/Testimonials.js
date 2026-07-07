'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Lead Engineer at Acme',
    text: 'Sentinel transformed our deployment pipeline. What used to take 30 minutes now happens in seconds. The auto-rollback alone has saved us multiple times.',
  },
  {
    name: 'Marcus Johnson',
    role: 'CTO at Stackflow',
    text: 'We evaluated Vercel, Railway, and Render. Sentinel\'s self-hosted model gives us complete control while matching their developer experience.',
  },
  {
    name: 'Priya Patel',
    role: 'DevOps at CloudScale',
    text: 'The health monitoring and auto-recovery are incredible. Our on-call rotations went from panicked to peaceful. This is how deployment should work.',
  },
]

function StarRating() {
  return (
    <div className="flex items-center gap-1 mb-5">
      {[...Array(5)].map((_, j) => (
        <svg key={j} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
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
        Testimonials
      </motion.span>
      <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
        Trusted by engineers
      </h2>
      <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Teams around the world ship faster with Sentinel.
      </p>
    </motion.div>
  )
}

export default function Testimonials() {
  return (
    <section className="py-36 px-6 bg-white/[0.01] border-y border-white/[0.04]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle />

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-400/20 transition-all relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-transparent to-blue-500/0 group-hover:from-cyan-400/[0.03] group-hover:to-blue-500/[0.03] transition-all duration-500" />

              <div className="relative">
                <StarRating />

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
