import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { spots } from '../src/data.js'

import {
  getImageFormatSources,
  getOptimizedImageStyle,
  getWebpImagePath,
} from '../src/utils/imageAssets.js'

const readSource = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('lazy loads heavy overlay components from the app shell', () => {
  const source = readSource('src/App.vue')

  assert.match(source, /defineAsyncComponent/)
  assert.doesNotMatch(source, /import Routes from '\.\/views\/Routes\.vue'/)
  assert.doesNotMatch(source, /import Statistics from '\.\/views\/Statistics\.vue'/)
  assert.doesNotMatch(source, /import AIAssistant from '\.\/views\/AIAssistant\.vue'/)
  assert.match(source, /import\('\.\/views\/Routes\.vue'\)/)
  assert.match(source, /import\('\.\/views\/Statistics\.vue'\)/)
  assert.match(source, /import\('\.\/views\/AIAssistant\.vue'\)/)
})

test('keeps the AI assistant entry mounted while loading its async chunk', () => {
  const source = readSource('src/App.vue')

  assert.match(source, /<AIAssistant\s*\/>/)
  assert.doesNotMatch(source, /assistantReady/)
  assert.doesNotMatch(
    source,
    /requestIdleCallback\(\(\)\s*=>\s*\{\s*assistantReady\.value\s*=\s*true/,
  )
})

test('registers only used Vant components instead of the full plugin', () => {
  const source = readSource('src/main.js')

  assert.doesNotMatch(source, /import Vant from 'vant'/)
  assert.doesNotMatch(source, /app\.use\(Vant\)/)
  for (const component of ['Button', 'Icon']) {
    assert.match(source, new RegExp(`\\b${component}\\b`))
  }
})

test('builds WebP-first image sources with original image fallback', () => {
  assert.equal(getWebpImagePath('/images/达西村1.jpg'), '/images/达西村1.webp')
  assert.equal(getWebpImagePath('/images/logo.png'), '/images/logo.webp')
  assert.equal(getWebpImagePath('https://example.com/a.jpg'), 'https://example.com/a.jpg')

  assert.deepEqual(getImageFormatSources('/images/达西村1.jpg'), {
    webp: '/images/达西村1.webp',
    fallback: '/images/达西村1.jpg',
  })

  assert.equal(
    getOptimizedImageStyle('/images/达西村1.jpg').backgroundImage,
    'image-set(url("/images/达西村1.webp") type("image/webp"), url("/images/达西村1.jpg") type("image/jpeg"))',
  )
})

test('ships WebP copies for local homepage and detail image assets', () => {
  const imagePaths = spots.map((spot) => spot.image)

  assert.ok(imagePaths.length > 0)
  for (const imagePath of imagePaths) {
    const webpPath = getWebpImagePath(imagePath)
    const fileUrl = new URL(`../public${webpPath}`, import.meta.url)
    assert.equal(existsSync(fileUrl), true, `${webpPath} should exist`)
  }
})
