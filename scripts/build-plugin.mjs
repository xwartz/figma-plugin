import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformAsync } from '@babel/core'
import JSZip from 'jszip'
import { build } from 'vite'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(rootDir, 'dist/figma-plugin')
const zipPath = path.join(rootDir, 'dist/figma-plugin.zip')
const tempDir = path.join(rootDir, 'dist/.vite-plugin-build')
const tempHtmlPath = path.join(tempDir, 'ui.html')

const aliases = {
  '@app': path.join(rootDir, 'src/app'),
  '@common': path.join(rootDir, 'src/common'),
  '@root': rootDir,
}

async function inlineHtmlAssets() {
  const htmlPath = await findBuiltHtml(outDir)
  let html = await readFile(htmlPath, 'utf8')
  const cssMatches = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)]
  const scriptMatches = [
    ...html.matchAll(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g),
  ]

  for (const match of cssMatches) {
    const assetPath = path.join(outDir, match[1].replace(/^\//, ''))
    const css = await readFile(assetPath, 'utf8')
    html = html.replace(match[0], () => `<style>${css}</style>`)
  }

  for (const match of scriptMatches) {
    const assetPath = path.join(outDir, match[1].replace(/^\//, ''))
    const script = (await readFile(assetPath, 'utf8')).replaceAll(
      '</script',
      '<\\/script',
    )
    html = html.replace(match[0], () => `<script>${script}</script>`)
  }

  await writeFile(path.join(outDir, 'ui.html'), html)
  if (htmlPath !== path.join(outDir, 'ui.html')) {
    await rm(htmlPath, { force: true })
  }
  await rm(path.join(outDir, 'assets'), { force: true, recursive: true })
  await rm(path.join(outDir, 'dist'), { force: true, recursive: true })
}

async function findBuiltHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isFile() && entry.name.endsWith('.html')) {
      return entryPath
    }

    if (entry.isDirectory()) {
      try {
        return await findBuiltHtml(entryPath)
      } catch (error) {
        if (
          error?.code !== 'ENOENT' &&
          error?.message !== 'Vite did not emit an HTML file.'
        ) {
          throw error
        }
      }
    }
  }

  throw new Error('Vite did not emit an HTML file.')
}

async function createPluginZip() {
  const zip = new JSZip()
  const files = ['manifest.json', 'code.js', 'ui.html']

  for (const file of files) {
    zip.file(file, await readFile(path.join(outDir, file)))
  }

  await writeFile(zipPath, await zip.generateAsync({ type: 'nodebuffer' }))
}

async function buildUi() {
  await writeFile(
    tempHtmlPath,
    [
      '<div id="react-page"></div>',
      '<script type="module" src="/src/app/index.tsx"></script>',
    ].join('\n'),
  )

  await build({
    configFile: false,
    root: rootDir,
    publicDir: false,
    resolve: {
      alias: aliases,
    },
    build: {
      cssCodeSplit: false,
      emptyOutDir: true,
      outDir,
      target: 'es2015',
      rollupOptions: {
        input: {
          ui: tempHtmlPath,
        },
        output: {
          assetFileNames: 'assets/[name][extname]',
          chunkFileNames: 'assets/[name].js',
          entryFileNames: 'assets/[name].js',
        },
      },
    },
  })
}

async function buildCode() {
  await build({
    configFile: false,
    root: rootDir,
    publicDir: false,
    resolve: {
      alias: aliases,
    },
    build: {
      emptyOutDir: false,
      lib: {
        entry: path.join(rootDir, 'src/app/controller/index.ts'),
        fileName: () => 'code.js',
        formats: ['iife'],
        name: 'PluginCode',
      },
      outDir,
      target: 'es2015',
      rollupOptions: {
        output: {
          extend: false,
        },
      },
    },
  })

  await transpileControllerToEs5()
}

async function transpileControllerToEs5() {
  const codePath = path.join(outDir, 'code.js')
  const source = await readFile(codePath, 'utf8')
  const result = await transformAsync(source, {
    babelrc: false,
    configFile: false,
    compact: true,
    comments: false,
    presets: [
      [
        '@babel/preset-env',
        {
          bugfixes: true,
          modules: false,
          targets: {
            ie: '11',
          },
        },
      ],
    ],
  })

  if (!result?.code) {
    throw new Error('Babel did not emit controller code.')
  }

  await writeFile(codePath, result.code)
}

async function main() {
  await rm(outDir, { force: true, recursive: true })
  await rm(tempDir, { force: true, recursive: true })
  await mkdir(tempDir, { recursive: true })

  await buildUi()
  await inlineHtmlAssets()
  await buildCode()
  await copyFile(
    path.join(rootDir, 'manifest.json'),
    path.join(outDir, 'manifest.json'),
  )
  await createPluginZip()
  await rm(tempDir, { force: true, recursive: true })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
