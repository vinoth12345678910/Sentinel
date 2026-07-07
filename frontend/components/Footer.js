'use client'

import { Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-[#020617]" />
            </div>
            <span className="text-sm font-semibold text-white">Sentinel</span>
            <span className="text-slate-600 text-sm mx-1">—</span>
            <span className="text-sm text-slate-500">Open-source deployment platform</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="#"
              className="text-sm text-slate-500 hover:text-cyan-400 transition-colors"
            >
              License
            </a>
          </div>
        </div>

        {/* Divider + copyright */}
        <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
          <p className="text-xs text-slate-600">
            Made with dedication for developers everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
