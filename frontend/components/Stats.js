'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function AnimatedCounter({ value, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView.current) {
          isInView.current = true
          const num = parseFloat(value)
          const duration = 2000
          const steps = 60
          const increment = num / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= num) {
              setCount(num)
              clearInterval(timer)
            } else {
              setCount(current)
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  )
}

const stats = [
  { value: '99.99', suffix: '%', label: 'Deployment Success' },
  { value: '2', prefix: '<', suffix: 's', label: 'Rollback Time' },
  { value: '24', suffix: '/7', label: 'Health Monitoring' },
  { value: '100', suffix: '%', label: 'Self Hosted' },
]

export default function Stats() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-32 px-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-400/20 transition-all overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 via-transparent to-blue-500/0 group-hover:from-cyan-400/[0.03] group-hover:to-blue-500/[0.03] transition-all duration-500" />

              <div className="relative text-center">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  <AnimatedCounter
                    value={s.value}
                    prefix={s.prefix || ''}
                    suffix={s.suffix || ''}
                  />
                </div>
                <p className="text-sm text-slate-500 tracking-wide font-medium">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
