import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const tokenArg = args.find((arg) => arg.startsWith('--token='))
const token = tokenArg ? tokenArg.slice('--token='.length) : process.env.GH_TOKEN
const platforms = args.filter((arg) => !arg.startsWith('--token='))

if (!token) {
  console.error('Faltou o token do GitHub. Use: npm run release -- --token=SEU_GH_TOKEN')
  process.exit(1)
}

if (platforms.length === 0) {
  console.error('Nenhuma plataforma informada (win/mac/linux).')
  process.exit(1)
}

const PLATFORM_FLAGS = { win: '--win', mac: '--mac', linux: '--linux' }
for (const platform of platforms) {
  if (!PLATFORM_FLAGS[platform]) {
    console.error(`Plataforma desconhecida: "${platform}" (use win, mac ou linux).`)
    process.exit(1)
  }
}

const env = { ...process.env, GH_TOKEN: token }

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', env, shell: true })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('npm', ['run', 'build'])

for (const platform of platforms) {
  console.log(`\n> Publicando release para ${platform}...\n`)
  run('npx', ['electron-builder', PLATFORM_FLAGS[platform], '--publish', 'always'])
}
