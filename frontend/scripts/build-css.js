const postcss = require('postcss')
const tailwindcss = require('@tailwindcss/postcss')
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'styles', 'landing.css')
const dst = path.join(__dirname, '..', 'public', 'tailwind.css')

postcss([tailwindcss()])
  .process(fs.readFileSync(src, 'utf-8'), { from: src, to: dst })
  .then(result => {
    fs.writeFileSync(dst, result.css)
    console.log('✓ Generated tailwind.css (' + (result.css.length / 1024).toFixed(1) + ' KB)')
  })
  .catch(e => {
    console.error('✗ Failed to build CSS:', e.message)
    process.exit(1)
  })
