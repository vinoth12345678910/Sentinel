/**
 * Unit tests for ApiClient.request() recursion guard.
 * Run: node test/api-client.unit-test.mjs
 * Mocks fetch, localStorage, and process.env — no browser or server needed.
 */

import { ApiClient } from '../lib/api.js'

// --- Mock helpers ---
function mockFetch(fn) {
  global.fetch = fn
}

function mockLocalStorage() {
  const store = {}
  global.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
  }
}

function setupEnv() {
  if (!global.process) global.process = { env: {} }
  global.process.env = global.process.env || {}
  global.process.env.NEXT_PUBLIC_API_URL = ''
}

// --- Test runner ---
let passed = 0
let failed = 0

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  PASS: ${msg}`) }
  else { failed++; console.error(`  FAIL: ${msg}`) }
}

function assertEq(a, b, msg) {
  if (a === b) { passed++; console.log(`  PASS: ${msg} (${JSON.stringify(a)})`) }
  else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`) }
}

const originalFetch = global.fetch
const originalLS = global.localStorage

function before() {
  setupEnv()
  mockLocalStorage()
}

function cleanup() {
  delete global.fetch
  delete global.localStorage
}

// Create a response factory
function makeResponse(status, body, headers) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body || {},
    text: async () => JSON.stringify(body || {}),
    headers: new Map(Object.entries(headers || {})),
  }
}

// --- Test (a): Normal request gets 401 → refresh succeeds → retry succeeds ---
async function testNormal401RefreshSuccess() {
  before()
  let idx = 0
  const calls = []
  mockFetch(async (url, opts) => {
    calls.push({ url, method: opts?.method || 'GET' })
    const i = idx++
    if (i === 0) return makeResponse(401, { message: 'Unauthorized' })          // GET /users/me
    if (i === 1) return makeResponse(200, { accessToken: 'new-token-123' })     // POST /auth/refresh
    if (i === 2) return makeResponse(200, { id: 1, username: 'test' })          // GET /users/me retry
    throw new Error(`Unexpected fetch #${i}: ${url}`)
  })
  const client = new ApiClient()
  client.setToken('expired-token')
  const result = await client.getMe()
  assert(result?.id === 1, '(a) getMe returns user data after refresh')
  assert(client.token === 'new-token-123', '(a) token updated after refresh')
  assertEq(calls.length, 3, '(a) exactly 3 fetch calls')
  assertEq(calls[0].url, '/users/me', '(a) call 1: GET /users/me')
  assertEq(calls[1].url, '/auth/refresh', '(a) call 2: POST /auth/refresh')
  assertEq(calls[2].url, '/users/me', '(a) call 3: GET /users/me retry')
  cleanup()
}

// --- Test (b): Normal request gets 401 → refresh also 401s → clean failure ---
async function testNormal401RefreshFails() {
  before()
  let idx = 0
  const calls = []
  mockFetch(async (url, opts) => {
    calls.push({ url, method: opts?.method || 'GET' })
    const i = idx++
    if (i === 0) return makeResponse(401, { message: 'Unauthorized' })          // GET /users/me
    if (i === 1) return makeResponse(401, { message: 'No session' })            // POST /auth/refresh (no retry!)
    throw new Error(`Unexpected fetch #${i}: ${url}`)
  })
  const client = new ApiClient()
  client.setToken('expired-token')
  const result = await client.getMe()
  assert(result === null, '(b) getMe returns null when refresh fails')
  assert(client.token === null, '(b) token cleared after failed refresh')
  assertEq(calls.length, 2, '(b) exactly 2 fetch calls — NO recursion')
  assertEq(calls[0].url, '/users/me', '(b) call 1: GET /users/me')
  assertEq(calls[1].url, '/auth/refresh', '(b) call 2: POST /auth/refresh (no retry)')
  cleanup()
}

// --- Test (c): Direct 401 on /auth/refresh → no recursive refresh attempt ---
async function testDirectRefresh401() {
  before()
  let idx = 0
  const calls = []
  mockFetch(async (url, opts) => {
    calls.push({ url, method: opts?.method || 'GET' })
    const i = idx++
    if (i === 0) return makeResponse(401, { message: 'No session' })            // POST /auth/refresh → 401
    throw new Error(`Unexpected fetch #${i}: ${url}`)
  })
  const client = new ApiClient()
  const result = await client.refreshToken()
  assert(result === false, '(c) refreshToken returns false on 401')
  assertEq(calls.length, 1, '(c) exactly 1 fetch call — NO recursion')
  assertEq(calls[0].url, '/auth/refresh', '(c) single POST /auth/refresh')
  cleanup()
}

// --- Test (d): refreshToken handles network error (fetch throws) ---
async function testRefreshTokenNetworkError() {
  before()
  let callCount = 0
  mockFetch(async (url, opts) => {
    callCount++
    throw new Error('Network error')
  })
  const client = new ApiClient()
  client.setToken('some-token')
  const result = await client.refreshToken()
  assert(result === false, '(d) refreshToken returns false on network error')
  assertEq(callCount, 1, '(d) exactly 1 fetch call — error caught cleanly')
  cleanup()
}

// --- Run sequentially ---
console.log('\n=== ApiClient.request() Recursion Guard Tests ===\n')
try {
  await testNormal401RefreshSuccess()
  await testNormal401RefreshFails()
  await testDirectRefresh401()
  await testRefreshTokenNetworkError()
} catch (e) {
  console.error('UNEXPECTED ERROR:', e)
  failed++
}
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed > 0 ? 1 : 0)
