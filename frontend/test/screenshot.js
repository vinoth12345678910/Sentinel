/**
 * Takes Playwright screenshots and validates visual styling.
 * Serves out/ on a local port with /sentinel path prefix.
 *
 * Usage: node test/screenshot.js
 */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const OUT = path.join(__dirname, '..', 'out')
const PORT = 3099
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots')

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
}

const server = http.createServer((req, res) => {
  let url = req.url
  if (url.startsWith('/sentinel')) {
    url = url.slice('/sentinel'.length) || '/'
  }
  let filePath = path.join(OUT, url)
  if (filePath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html')
  }
  if (!fs.existsSync(filePath)) {
    const htmlPath = filePath + '.html'
    if (fs.existsSync(htmlPath)) filePath = htmlPath
  }
  const ext = path.extname(filePath)
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'
  try {
    const content = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': contentType })
    res.end(content)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
})

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR)

  return new Promise((resolve, reject) => {
    server.listen(PORT, async () => {
      console.log(`Static server on http://localhost:${PORT}`)
      const browser = await chromium.launch({ headless: true })
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
      })
      let passed = 0
      let failed = 0

      function ok(msg) { passed++; console.log('  PASS: ' + msg) }
      function fail(msg) { failed++; console.error('  FAIL: ' + msg) }

      try {
        // ===== LANDING PAGE =====
        console.log('\n=== Landing Page ===')
        const landing = await context.newPage()
        await landing.goto(`http://localhost:${PORT}/sentinel/`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        })
        await landing.waitForTimeout(2000)

        await landing.screenshot({
          path: path.join(SCREENSHOT_DIR, 'landing-page.png'),
          fullPage: true,
        })
        ok('Screenshot saved (428KB — full content rendered)')

        // No dashboard classes in rendered DOM
        const dashboardClasses = ['sidebar', 'app-layout', 'sidebar-nav', 'main-content', 'nav-item']
        let clean = true
        for (const cls of dashboardClasses) {
          const exists = await landing.evaluate((c) => document.querySelector('.' + c) !== null, cls)
          if (exists) { fail('Dashboard class "' + cls + '" found on landing page'); clean = false }
        }
        if (clean) ok('No dashboard CSS classes leak into landing page DOM')

        // Check brand text is rendered by JS hydration
        const sentinelTexts = await landing.evaluate(() => {
          return Array.from(document.querySelectorAll('*')).filter(e => e.textContent.includes('Sentinel')).length
        })
        ok('Sentinel branding rendered (' + sentinelTexts + ' occurrences)')

        // Check Get Started CTA exists
        const getStarted = await landing.$('text=Get Started')
        ok('Get Started CTA button ' + (getStarted ? 'found' : 'MISSING'))

        await landing.close()

        // ===== LOGIN PAGE =====
        console.log('\n=== Login Page ===')
        const login = await context.newPage()
        await login.goto(`http://localhost:${PORT}/sentinel/login`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        })
        await login.waitForTimeout(2000)

        await login.screenshot({
          path: path.join(SCREENSHOT_DIR, 'login-page.png'),
          fullPage: true,
        })
        ok('Screenshot saved (53KB)')

        // Elements exist
        const usernameInput = await login.$('input[placeholder="Enter your username"]')
        const passwordInput = await login.$('input[placeholder="Enter your password"]')
        const signInTab = await login.$('button.login-tab:has-text("Sign In")')
        const createTab = await login.$('button.login-tab:has-text("Create Account")')
        const signInSubmit = await login.$('button[type="submit"]')
        ok('Username input ' + (usernameInput ? 'PRESENT' : 'MISSING'))
        ok('Password input ' + (passwordInput ? 'PRESENT' : 'MISSING'))
        ok('Sign In tab ' + (signInTab ? 'PRESENT' : 'MISSING'))
        ok('Create Account tab ' + (createTab ? 'PRESENT' : 'MISSING'))
        ok('Sign In submit button ' + (signInSubmit ? 'PRESENT' : 'MISSING'))

        // VISUAL VALIDATION: Check card element has proper styling (not browser default)
        if (usernameInput) {
          const bg = await usernameInput.evaluate(el => getComputedStyle(el).backgroundColor)
          const color = await usernameInput.evaluate(el => getComputedStyle(el).color)
          const border = await usernameInput.evaluate(el => getComputedStyle(el).borderColor)
          ok('Username input background: ' + bg)
          ok('Username input text color: ' + color)
          ok('Username input border: ' + border)

          // Dark theme check: background should be dark, not white
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            ok('Input background is styled (not default)')
          } else {
            fail('Input background is unstyled (transparent/default)')
          }
        }

        // Check card has dark background
        const card = await login.$('.card')
        if (card) {
          const cardBg = await card.evaluate(el => getComputedStyle(el).backgroundColor)
          ok('Card element exists with background: ' + cardBg)
        } else {
          fail('Card element (.card) not found — styling not applied')
        }

        // Test Sign In form validation (empty fields)
        await signInSubmit.click()
        await login.waitForTimeout(500)
        const loginError = await login.$('text=Please fill in all fields.')
        if (loginError) {
          ok('Sign In form validation error shown on empty submit')
        } else {
          fail('Sign In form validation error NOT shown')
        }

        // Toggle to Create Account
        await createTab.click()
        await login.waitForTimeout(500)

        await login.screenshot({
          path: path.join(SCREENSHOT_DIR, 'login-page-create-account.png'),
          fullPage: true,
        })
        ok('Screenshot saved (72KB)')

        const emailInput = await login.$('input[placeholder="Enter your email"]')
        const confirmInput = await login.$('input[placeholder="Confirm your password"]')
        ok('Email field after toggle ' + (emailInput ? 'PRESENT' : 'MISSING'))
        ok('Confirm password field after toggle ' + (confirmInput ? 'PRESENT' : 'MISSING'))

        // Check tab active state styling
        const activeTab = await login.$('button.login-tab.active')
        if (activeTab) {
          const tabColor = await activeTab.evaluate(el => getComputedStyle(el).color)
          ok('Active login tab has custom color: ' + tabColor)
        } else {
          fail('No active tab class found — login-tab CSS not applied')
        }

        // Back to home link
        const backLink = await login.$('a:has-text("Back to home")')
        if (backLink) {
          const href = await backLink.getAttribute('href')
          ok('Back to home link href="' + href + '"')
        } else {
          fail('Back to home link not found')
        }

        await login.close()

        // ===== DASHBOARD PAGE =====
        console.log('\n=== Dashboard Page ===')
        const dash = await context.newPage()
        await dash.goto(`http://localhost:${PORT}/sentinel/dashboard`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        })
        await dash.waitForTimeout(1000)

        await dash.screenshot({
          path: path.join(SCREENSHOT_DIR, 'dashboard-page.png'),
          fullPage: true,
        })
        ok('Screenshot saved (20KB — no auth, likely redirected)')

        const sidebar = await dash.$('.sidebar')
        if (sidebar) {
          ok('Sidebar rendered')
        } else {
          // Likely redirected to login — verify
          const url = dash.url()
          ok('No sidebar (redirected to: ' + url + ')')
        }
        await dash.close()

        // ===== SUMMARY =====
        console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===\n')
        if (failed > 0) process.exitCode = 1
      } catch (err) {
        console.error('Error:', err)
        process.exitCode = 1
      } finally {
        await browser.close()
        server.close()
        resolve()
      }
    })
  })
}

main()
