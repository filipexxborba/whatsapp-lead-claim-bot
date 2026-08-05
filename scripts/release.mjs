import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Precisa bater com o publish.owner/publish.repo do electron-builder.yml.
const GITHUB_OWNER = 'filipexxborba'
const GITHUB_REPO = 'whatsapp-lead-claim-bot'

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

// O electron-builder, quando a release ainda não existe, dispara duas chamadas
// de criação em paralelo (uma por arquivo publicado) e elas colidem — a segunda
// falha com "Published releases must have a valid tag". Pré-criar a release
// aqui evita essa corrida: o electron-builder só precisa subir os arquivos numa
// release que já existe.
async function ensureGithubRelease() {
  const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
  const tag = `v${version}`
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'lead-claim-bot-release-script'
  }

  const existing = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${tag}`,
    { headers }
  )
  if (existing.status === 200) return

  console.log(`\n> Criando release ${tag} no GitHub antes do build...\n`)
  const created = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_name: tag, name: version, draft: false })
  })
  if (!created.ok) {
    console.error(`Falha ao criar a release ${tag}: ${created.status} ${await created.text()}`)
    process.exit(1)
  }
}

await ensureGithubRelease()

run('npm', ['run', 'build'])

for (const platform of platforms) {
  console.log(`\n> Publicando release para ${platform}...\n`)
  run('npx', ['electron-builder', PLATFORM_FLAGS[platform], '--publish', 'always'])
}
