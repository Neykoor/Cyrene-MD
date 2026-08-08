import { execSync } from 'child_process'
import fs from 'fs'

export function detectMusl() {
  if (process.platform !== 'linux') {
    return { isMusl: false, libc: 'n/a', method: 'platform', target: 'n/a' }
  }

  if (typeof process.report?.getReport === 'function') {
    try {
      const report = process.report.getReport()
      const glibc = report?.header?.glibcVersionRuntime
      if (glibc) {
        return { isMusl: false, libc: `glibc ${glibc}`, method: 'process.report', target: 'linux-x64' }
      }
    } catch {}
  }

  try {
    const output = execSync('ldd --version 2>&1', { encoding: 'utf8' })
    if (/musl/i.test(output)) {
      return { isMusl: true, libc: 'musl', method: 'ldd', target: 'linuxmusl-x64' }
    }
    const match = output.match(/glibc\s+([\d.]+)/i) || output.match(/GLIBC\s+([\d.]+)/i)
    if (match) {
      return { isMusl: false, libc: `glibc ${match[1]}`, method: 'ldd', target: 'linux-x64' }
    }
  } catch (err) {
    const combined = `${err?.stdout || ''}${err?.stderr || ''}${err?.message || ''}`
    if (/musl/i.test(combined)) {
      return { isMusl: true, libc: 'musl', method: 'ldd-stderr', target: 'linuxmusl-x64' }
    }
  }

  try {
    const release = fs.readFileSync('/etc/os-release', 'utf8')
    if (/\balpine\b/i.test(release)) {
      return { isMusl: true, libc: 'musl (alpine)', method: 'os-release', target: 'linuxmusl-x64' }
    }
  } catch {}

  try {
    fs.accessSync('/lib/ld-musl-x86_64.so.1')
    return { isMusl: true, libc: 'musl', method: 'ld-musl-file', target: 'linuxmusl-x64' }
  } catch {}

  return { isMusl: false, libc: 'glibc (asumido)', method: 'fallback', target: 'linux-x64' }
}

export function printLibcInfo(logger = console.log) {
  const info = detectMusl()
  logger(`[libc] plataforma=${process.platform} arch=${process.arch} libc=${info.libc} metodo=${info.method} prebuild=${info.target}`)
  return info
}
