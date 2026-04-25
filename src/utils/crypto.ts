const ITERATIONS = 100_000
const VERIFY_PLAIN = 'slotpaste-ok'

function bytesToHex(b: Uint8Array) {
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
}
function hexToBytes(h: string) {
  const a = new Uint8Array(h.length / 2)
  for (let i = 0; i < a.length; i++) a[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  return a
}
function toBase64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}
function fromBase64(s: string) {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0))
}

export function generateSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
}

export async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text))
  return `${bytesToHex(iv)}:${toBase64(ct)}`
}

export async function decryptText(enc: string, key: CryptoKey): Promise<string> {
  const sep = enc.indexOf(':')
  const iv = hexToBytes(enc.slice(0, sep))
  const ct = fromBase64(enc.slice(sep + 1))
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(plain)
}

export async function createVerifyToken(key: CryptoKey) {
  return encryptText(VERIFY_PLAIN, key)
}

export async function verifyKey(key: CryptoKey, token: string): Promise<boolean> {
  try {
    return await decryptText(token, key) === VERIFY_PLAIN
  } catch {
    return false
  }
}

export function maskText(blockId: string): string {
  const CHARS = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;'
  let seed = Array.from(blockId).reduce((acc, c, i) => acc ^ (c.charCodeAt(0) << (i % 16)), 0x12345678)
  return Array.from({ length: 52 }, () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return CHARS[seed % CHARS.length]
  }).join('')
}

export interface CrackEstimate {
  label: string
  hint: string
  level: 'weak' | 'medium' | 'strong' | 'extreme'
}

export function estimateCrackTime(password: string): CrackEstimate | null {
  if (!password) return null

  let charset = 0
  if (/\d/.test(password)) charset += 10
  if (/[a-z]/.test(password)) charset += 26
  if (/[A-Z]/.test(password)) charset += 26
  if (/[^a-zA-Z0-9]/.test(password)) charset += 33
  if (charset === 0) charset = 10

  const combinations = Math.pow(charset, password.length)
  const seconds = combinations / 500 // conservative: ~500 H/s on CPU for PBKDF2-SHA256 100k

  const MIN = 60, HOUR = 3600, DAY = 86400, YEAR = DAY * 365

  if (seconds < MIN)         return { label: 'under a minute',               hint: 'shorter than a TikTok 🎵',                       level: 'weak' }
  if (seconds < HOUR)        return { label: `~${Math.ceil(seconds / MIN)} minutes`,   hint: 'shorter than a lunch break 🥪',       level: 'weak' }
  if (seconds < DAY)         return { label: `~${Math.ceil(seconds / HOUR)} hours`,    hint: 'a few Marvel movies back to back 🦸',     level: 'medium' }
  if (seconds < DAY * 30)    return { label: `~${Math.ceil(seconds / DAY)} days`,      hint: 'a Death Stranding 2 playthrough 🧵',      level: 'medium' }
  if (seconds < YEAR)        return { label: `~${Math.ceil(seconds / (DAY * 30))} months`, hint: 'a Game of Thrones season rewatch 🐉', level: 'strong' }
  if (seconds < YEAR * 100)  return { label: `~${Math.ceil(seconds / YEAR)} years`,    hint: 'still faster than Winds of Winter 📚',    level: 'strong' }
  if (seconds < YEAR * 1e6)  return { label: 'thousands of years',            hint: 'since the fall of Rome 🏛️',                      level: 'extreme' }
  if (seconds < YEAR * 1e9)  return { label: 'millions of years',             hint: 'back when T-Rex roamed the Earth 🦖',             level: 'extreme' }
  if (seconds < YEAR * 1e12) return { label: 'billions of years',             hint: 'half the age of Earth itself 🌍',                 level: 'extreme' }
  return                            { label: 'heat death of the universe',     hint: '',                                                level: 'extreme' }
}
