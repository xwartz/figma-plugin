import { createReadStream } from 'node:fs'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const communityReleaseDir = path.join(rootDir, 'docs/community-release')
const sourceDir = path.join(communityReleaseDir, 'source')
const assetsDir = path.join(communityReleaseDir, 'assets')
const renderDir = path.join(communityReleaseDir, 'render')
const sourceHtmlPath = path.join(
  sourceDir,
  'design_handoff_bridge_community_2.html',
)
const sourceIconPath = path.join(
  sourceDir,
  'design_handoff_bridge_icon_2.svg',
)

const frames = [
  {
    index: 0,
    renderFileName: 'thumbnail-1920x1080.html',
    outputFileName: 'thumbnail-1920x1080.png',
    width: 1920,
    height: 1080,
  },
  {
    index: 1,
    renderFileName: 'carousel-01-export-tokens.html',
    outputFileName: 'carousel-01-export-tokens.png',
    width: 1600,
    height: 900,
  },
  {
    index: 2,
    renderFileName: 'carousel-02-create-token-issue.html',
    outputFileName: 'carousel-02-create-token-issue.png',
    width: 1600,
    height: 900,
  },
  {
    index: 3,
    renderFileName: 'carousel-03-primitive-handoff.html',
    outputFileName: 'carousel-03-primitive-handoff.png',
    width: 1600,
    height: 900,
  },
  {
    index: 4,
    renderFileName: 'carousel-04-github-settings.html',
    outputFileName: 'carousel-04-github-settings.png',
    width: 1600,
    height: 900,
  },
  {
    index: 5,
    renderFileName: 'carousel-05-synced-result.html',
    outputFileName: 'carousel-05-synced-result.png',
    width: 1600,
    height: 900,
  },
]

const iconFrame = {
  renderFileName: 'icon-128x128.html',
  outputFileName: 'icon-128x128.png',
  width: 128,
  height: 128,
}

function getStyleBlock(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/)
  return match?.[1] ?? ''
}

function getAssetSections(html) {
  return html
    .split(/\n {8}<section class="asset">\n/)
    .slice(1)
    .map((section) => {
      const [content] = section.split(/\n {8}<\/section>/)
      return `<section class="asset">\n${content}\n</section>`
    })
}

function createStandaloneFrameHtml({ sectionHtml, styleBlock, width, height }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      ${styleBlock}
      body {
        margin: 0;
        width: ${width}px;
        height: ${height}px;
        overflow: hidden;
        background: #ffffff;
      }

      .page {
        padding: 0 !important;
      }

      .stack,
      .asset {
        display: block !important;
        gap: 0 !important;
      }

      .asset-label {
        display: none !important;
      }

      .viewport {
        width: ${width}px !important;
        height: ${height}px !important;
        overflow: hidden !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    </style>
  </head>
  <body><main class="page"><div class="stack">${sectionHtml}</div></main></body>
</html>`
}

function createIconHtml(svg) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        display: grid;
        margin: 0;
        width: 128px;
        height: 128px;
        place-items: center;
        background: #ffffff;
      }

      svg {
        width: 128px;
        height: 128px;
        display: block;
      }
    </style>
  </head>
  <body>${svg}</body>
</html>`
}

function createPlaygroundSvg() {
  return `<svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Design Handoff Bridge playground</title>
  <desc id="desc">A Figma playground starter with variable tokens, primitive cards, and GitHub handoff placeholders.</desc>
  <rect width="1920" height="1080" fill="#F6F6F2"/>
  <rect x="80" y="80" width="1760" height="920" rx="48" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
  <text x="144" y="184" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="900">Try Design Handoff Bridge</text>
  <text x="144" y="248" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">Import this SVG into a Figma file, then create variables and primitives from the labeled sections.</text>
  <g transform="translate(144 336)">
    <rect width="488" height="504" rx="32" fill="#F6F6F2" stroke="#000000" stroke-width="4"/>
    <text x="40" y="72" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="900">Variable collection</text>
    <circle cx="64" cy="144" r="24" fill="#000000"/>
    <text x="112" y="156" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">color.background</text>
    <circle cx="64" cy="224" r="24" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
    <text x="112" y="236" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">color.foreground</text>
    <rect x="40" y="296" width="176" height="64" rx="32" fill="#000000"/>
    <text x="72" y="338" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">Light</text>
    <rect x="232" y="296" width="176" height="64" rx="32" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
    <text x="264" y="338" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900">Dark</text>
    <rect x="40" y="408" width="344" height="32" rx="16" fill="#000000"/>
  </g>
  <g transform="translate(716 336)">
    <rect width="488" height="504" rx="32" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
    <text x="40" y="72" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="900">Primitive samples</text>
    <rect x="40" y="120" width="184" height="88" rx="24" fill="#000000"/>
    <text x="84" y="176" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">Button</text>
    <rect x="40" y="248" width="384" height="88" rx="24" fill="#F6F6F2" stroke="#000000" stroke-width="4"/>
    <text x="80" y="304" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">Input field</text>
    <rect x="40" y="376" width="384" height="88" rx="24" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
    <text x="80" y="432" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">Card surface</text>
  </g>
  <g transform="translate(1288 336)">
    <rect width="488" height="504" rx="32" fill="#000000"/>
    <text x="40" y="72" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="900">GitHub handoff</text>
    <rect x="40" y="120" width="408" height="80" rx="24" fill="#FFFFFF"/>
    <text x="72" y="172" fill="#000000" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">Design Token Issue</text>
    <rect x="40" y="240" width="408" height="32" rx="16" fill="#FFFFFF"/>
    <rect x="40" y="304" width="328" height="32" rx="16" fill="#FFFFFF"/>
    <rect x="40" y="368" width="248" height="32" rx="16" fill="#FFFFFF"/>
    <text x="40" y="456" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800">Sync design-tokens.json</text>
  </g>
</svg>
`
}

function contentTypeFor(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (filePath.endsWith('.svg')) return 'image/svg+xml'
  if (filePath.endsWith('.png')) return 'image/png'
  return 'application/octet-stream'
}

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
      const safePath = path
        .normalize(decodeURIComponent(requestUrl.pathname))
        .replace(/^(\.\.[/\\])+/, '')
      const filePath = path.join(rootDir, safePath)

      if (!filePath.startsWith(rootDir)) {
        response.writeHead(403)
        response.end('Forbidden')
        return
      }

      const fileStat = await stat(filePath)

      if (!fileStat.isFile()) {
        response.writeHead(404)
        response.end('Not found')
        return
      }

      response.writeHead(200, { 'Content-Type': contentTypeFor(filePath) })
      createReadStream(filePath).pipe(response)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()

  if (!address || typeof address === 'string') {
    throw new Error('Could not start local release asset server.')
  }

  return { server, port: address.port }
}

async function runPlaywrightScreenshot({
  port,
  renderFileName,
  outputFileName,
  width,
  height,
}) {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      command,
      [
        'dlx',
        'playwright',
        'screenshot',
        '--timeout',
        '30000',
        '--viewport-size',
        `${width},${height}`,
        '--wait-for-timeout',
        '1500',
        `http://127.0.0.1:${port}/docs/community-release/render/${renderFileName}`,
        path.join(assetsDir, outputFileName),
      ],
      {
        cwd: rootDir,
        stdio: 'inherit',
      },
    )

    child.on('error', reject)
    child.on('close', resolve)
  })

  if (exitCode !== 0) {
    throw new Error(`Failed to capture ${outputFileName}`)
  }
}

async function verifyPngDimensions({ outputFileName, width, height }) {
  const buffer = await readFile(path.join(assetsDir, outputFileName))
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47

  if (!isPng) {
    throw new Error(`${outputFileName} is not a PNG file.`)
  }

  const actualWidth = buffer.readUInt32BE(16)
  const actualHeight = buffer.readUInt32BE(20)

  if (actualWidth !== width || actualHeight !== height) {
    throw new Error(
      `${outputFileName} is ${actualWidth}x${actualHeight}, expected ${width}x${height}.`,
    )
  }
}

async function writeRenderFiles() {
  await rm(renderDir, { recursive: true, force: true })
  await mkdir(renderDir, { recursive: true })
  await mkdir(assetsDir, { recursive: true })

  const html = await readFile(sourceHtmlPath, 'utf8')
  const svg = await readFile(sourceIconPath, 'utf8')
  const styleBlock = getStyleBlock(html)
  const sections = getAssetSections(html)

  await writeFile(
    path.join(renderDir, iconFrame.renderFileName),
    createIconHtml(svg),
  )

  for (const frame of frames) {
    const sectionHtml = sections[frame.index]

    if (!sectionHtml) {
      throw new Error(`Missing source section for ${frame.outputFileName}`)
    }

    await writeFile(
      path.join(renderDir, frame.renderFileName),
      createStandaloneFrameHtml({
        sectionHtml,
        styleBlock,
        width: frame.width,
        height: frame.height,
      }),
      'utf8',
    )
  }

  await writeFile(
    path.join(assetsDir, 'playground-file-import.svg'),
    createPlaygroundSvg(),
    'utf8',
  )
}

async function main() {
  await writeRenderFiles()

  const { server, port } = await startStaticServer()

  try {
    const allTargets = [iconFrame, ...frames]

    for (const target of allTargets) {
      await runPlaywrightScreenshot({ port, ...target })
      await verifyPngDimensions(target)
    }

    console.log(
      `Figma Community assets generated in ${path.relative(rootDir, assetsDir)}`,
    )
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
