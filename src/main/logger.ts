import { app } from 'electron'
import pino from 'pino'
import { join } from 'node:path'
import { existsSync, mkdirSync, statSync, renameSync } from 'node:fs'

const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024

const logDir = join(app.getPath('userData'), 'logs')
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })

const logFilePath = join(logDir, 'app.log')

// Rotação simples: sem isso, um app que fica meses rodando em segundo plano
// acumula um log.txt sem fim. Não precisa de nada elaborado — só evitar que
// cresça pra sempre.
try {
  if (existsSync(logFilePath) && statSync(logFilePath).size > MAX_LOG_SIZE_BYTES) {
    renameSync(logFilePath, join(logDir, 'app.log.old'))
  }
} catch {
  // Best effort — se a rotação falhar, seguimos logando no arquivo existente.
}

/**
 * Logger compartilhado por todo o processo principal. Escreve tanto no
 * console (útil em dev, via `npm run dev`) quanto num arquivo em
 * userData/logs/app.log — sem o arquivo, um problema que aconteça com o app
 * rodando sozinho na bandeja não deixa nenhum rastro pra investigar depois.
 */
export const logger = pino(
  { level: 'info', timestamp: pino.stdTimeFunctions.isoTime },
  pino.multistream([
    { stream: process.stdout },
    // sync: true — com sync: false o arquivo abre de forma assíncrona e, se o
    // processo sair antes disso (ex.: segunda instância barrada pelo
    // single-instance lock), o flushSync do pino no exit lança
    // "sonic boom is not ready yet". Volume de log é baixo, custo desprezível.
    { stream: pino.destination({ dest: logFilePath, sync: true, mkdir: true }) }
  ])
)

export function getLogFilePath(): string {
  return logFilePath
}
