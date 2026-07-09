/**
 * Build output verification tests.
 * Runs against the static export in out/ after `npm run build`.
 * Usage: node test/verify-build.js
 */
var fs = require('fs')
var path = require('path')
var execSync = require('child_process').execSync

var OUT = path.join(__dirname, '..', 'out')
var PASS = 0
var FAIL = 0

function assert(condition, msg) {
  if (condition) { PASS++; console.log('  PASS: ' + msg) }
  else { FAIL++; console.error('  FAIL: ' + msg) }
}

function grepFile(filePath, pattern) {
  var content = fs.readFileSync(filePath, 'utf-8')
  return content.indexOf(pattern) !== -1
}

// Run the QA smoke test for non-root container support in deploy scripts
try {
  var qaResult = execSync('bash "' + path.join(__dirname, '..', '..', 'test', 'qa-smoke.sh') + '"', { stdio: 'pipe', encoding: 'utf-8', timeout: 15000 })
  console.log(qaResult.stdout)
  assert(true, 'QA smoke test passed')
} catch (qaErr) {
  var output = qaErr.stdout || ''
  console.log(output)
  assert(false, 'QA smoke test failed: ' + (qaErr.stderr || qaErr.message))
}

function read(file) {
  return fs.readFileSync(path.join(OUT, file), 'utf-8')
}

function exists(file) {
  return fs.existsSync(path.join(OUT, file))
}

console.log('\n=== Build Output Verification ===\n')

// 1. Verify output directory exists
assert(exists('index.html'), 'out/index.html exists')
assert(exists('login.html'), 'out/login.html exists')
assert(exists('dashboard.html'), 'out/dashboard.html exists')
assert(exists('tailwind.css'), 'out/tailwind.css exists')
assert(exists('styles/globals.css'), 'out/styles/globals.css exists')

// 2. Landing page — no dashboard CSS bleed
var landing = read('index.html')
assert(!landing.includes('sidebar'), 'Landing page: no "sidebar" class name')
assert(!landing.includes('app-layout'), 'Landing page: no "app-layout" class name')
assert(!landing.includes('sidebar-nav'), 'Landing page: no "sidebar-nav" class name')
assert(!landing.includes('main-content'), 'Landing page: no "main-content" class name')
assert(!landing.includes('nav-item'), 'Landing page: no "nav-item" class name')

// 3. Landing page — page metadata correct
assert(landing.includes('"page":"/"'), 'Landing page: __NEXT_DATA__ page is "/"')
assert(landing.includes('"assetPrefix":"/sentinel"'), 'Landing page: assetPrefix is /sentinel')
assert(landing.includes('"nextExport":true'), 'Landing page: nextExport is true')

// 4. Landing page — tailwind.css is the only CSS link (no globals.css)
var cssLinks = landing.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || []
assert(cssLinks.length === 1, 'Landing page: exactly 1 CSS link')
assert(cssLinks[0].includes('/sentinel/tailwind.css'), 'Landing page: CSS link points to /sentinel/tailwind.css')

// 5. Import page (GitHub repo picker — dynamic content renders client-side)
var importPage = read('dashboard/import.html')
assert(importPage.includes('Import App'), 'Import page: title is "Import App"')
assert(importPage.includes('sidebar'), 'Import page: has dashboard sidebar')

// Find and check the import JS chunk for API references
var CHUNKS = path.join(OUT, '_next/static/chunks/pages/dashboard')
var importChunkFile = fs.readdirSync(CHUNKS).filter(function(f) { return f.startsWith('import-') && f.endsWith('.js') })[0]
var importChunkContent = importChunkFile ? fs.readFileSync(path.join(CHUNKS, importChunkFile), 'utf-8') : ''
assert(importChunkContent.includes('getGithubRepos'), 'Import JS bundle: references getGithubRepos API call')
assert(importChunkContent.includes('importGithubRepo'), 'Import JS bundle: references importGithubRepo API call')
assert(importChunkContent.includes('/dashboard/create'), 'Import JS bundle: has link to manual setup wizard')

// 6. Create page (manual wizard — pre-rendered form fields)
var createPage = read('dashboard/create.html')
assert(createPage.includes('Create New App'), 'Create page: contains "Create New App" heading')
assert(createPage.includes('GitHub Repository URL'), 'Create page: has GitHub repo URL field')
assert(createPage.includes('Create App'), 'Create page: Layout title is "Create App"')
assert(createPage.includes('Next: Environment'), 'Create page: has step-2 navigation button')

// 7. Login page
var login = read('login.html')
assert(login.includes('Sign In'), 'Login page: contains "Sign In"')
assert(login.includes('Create Account'), 'Login page: contains "Create Account"')
assert(login.includes('Enter your username'), 'Login page: has username field')
assert(login.includes('Enter your password'), 'Login page: has password field')
assert(login.includes('Back to home'), 'Login page: has "Back to home" link')

// 8. Login page — loads globals.css for styling
var loginCss = login.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || []
assert(loginCss.length >= 2, 'Login page: loads at least 2 CSS files (tailwind.css + globals.css)')
var hasGlobals = loginCss.some(function(l) { return l.includes('/sentinel/styles/globals.css') })
assert(hasGlobals, 'Login page: loads globals.css with /sentinel prefix')

// 9. Dashboard page
var dash = read('dashboard.html')
assert(dash.includes('sidebar'), 'Dashboard page: has sidebar')
assert(dash.includes('app-layout'), 'Dashboard page: has app-layout')
assert(dash.includes('Dashboard'), 'Dashboard page: contains "Dashboard" heading')

var dashCss = dash.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || []
var hasDashGlobals = dashCss.some(function(l) { return l.includes('/sentinel/styles/globals.css') })
assert(hasDashGlobals, 'Dashboard page: loads globals.css with /sentinel prefix')

// 10. Asset URLs — all prefixed with /sentinel
var allPages = landing + login + dash + importPage + createPage
var allSrc = allPages.match(/src="\/[^"]+/g) || []
var allSrcOk = allSrc.every(function(s) { return s.startsWith('src="/sentinel/') || s.startsWith('src="https://') })
assert(allSrcOk, 'All src attributes start with /sentinel/ (or are external)')

var allHref = allPages.match(/href="\/[^"]+/g) || []
var externalOk = [/^href="\/sentinel(\/|"|$)/, /^href="\/\/localhost/, /^href="https?:\/\//]
var allHrefOk = allHref.every(function(h) {
  return externalOk.some(function(re) { return re.test(h) })
})
assert(allHrefOk, 'All href attributes (non-external) start with /sentinel/')

// 11. Build manifest
assert(exists('_next/static'), 'Static assets directory exists')

// 12. No hardcoded localhost:3000 fallback in source (env-var-inlined values are fine)
// Check source JS for the pattern `|| 'http://localhost:3000'` which indicates a
// production-unsafe fallback. Inlined env var values (from .env.local) will appear
// as the plain string without the `||` prefix.
function walkDir(dir) {
  var results = []
  var list = fs.readdirSync(dir)
  list.forEach(function(file) {
    var full = path.join(dir, file)
    var stat = fs.statSync(full)
    if (stat.isDirectory()) results = results.concat(walkDir(full))
    else if (file.endsWith('.js')) results.push(full)
  })
  return results
}
var jsFiles = walkDir(OUT)
var leakFiles = jsFiles.filter(function(f) {
  var content = fs.readFileSync(f, 'utf-8')
  // Pattern: a JS string literal `http://localhost:3000` preceded by `||`
  // (env var inlining produces just the value without `||`)
  return /\|\|\s*['"]http:\/\/localhost:3000['"]/.test(content)
})
assert(leakFiles.length === 0, 'No hardcoded localhost:3000 fallback in JS bundles (files: ' + leakFiles.join(', ') + ')')

// 13. No next export command needed check
assert(!fs.existsSync(path.join(OUT, 'export-detail.json')), 'No export-detail.json (using output:export)')

// Summary
console.log('\n=== Results: ' + PASS + ' passed, ' + FAIL + ' failed ===\n')
process.exit(FAIL > 0 ? 1 : 0)
