'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import { Shield, Menu, X } from 'lucide-react'

const GithubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pipeline', href: '#pipeline' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 origin-left"
        style={{ scaleX: progress }}
      />

      <nav className="fixed top-0 left-0 right-0 z-50">
        <div
          className={`absolute inset-0 border-b transition-all duration-500 ${
            scrolled
              ? 'bg-[#020617]/80 backdrop-blur-2xl border-white/[0.06]'
              : 'bg-transparent border-transparent'
          }`}
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/30 transition-shadow"
              >
                <Shield className="w-5 h-5 text-[#020617]" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent"
              >
                Sentinel
              </motion.span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-10">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
            </div>

            {/* Right actions */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <GithubIcon className="w-4 h-4" />
              </a>

              <button
                onClick={() => router.push('/login')}
                className="relative group px-5 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-gradient-to-r from-cyan-400 to-blue-500 transition-opacity" />
                <span className="relative">Get Started</span>
              </button>

              <button
                className="md:hidden p-2 text-slate-400 hover:text-white cursor-pointer"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 pt-20 bg-[#020617]/95 backdrop-blur-2xl md:hidden"
          >
            <div className="px-6 py-8 space-y-6">
              {[...navLinks, { label: 'GitHub', href: 'https://github.com' }].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-lg text-slate-300 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => { setMobileOpen(false); router.push('/login') }}
                className="w-full py-3 text-center font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
