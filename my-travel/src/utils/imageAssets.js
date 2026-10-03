const LOCAL_IMAGE_PATTERN = /^\/images\/(.+)\.(jpe?g|png)$/i

export function getWebpImagePath(imagePath) {
  if (typeof imagePath !== 'string') return ''
  return imagePath.replace(LOCAL_IMAGE_PATTERN, '/images/$1.webp')
}

export function getImageFormatSources(imagePath) {
  const fallback = typeof imagePath === 'string' ? imagePath : ''
  return {
    webp: getWebpImagePath(fallback),
    fallback,
  }
}

export function getImageMimeType(imagePath) {
  if (/\.png$/i.test(imagePath)) return 'image/png'
  if (/\.webp$/i.test(imagePath)) return 'image/webp'
  return 'image/jpeg'
}

export function getOptimizedImageStyle(imagePath) {
  const { webp, fallback } = getImageFormatSources(imagePath)
  if (!fallback) return { backgroundImage: 'none' }
  if (webp === fallback) return { backgroundImage: `url("${fallback}")` }

  return {
    backgroundImage: `image-set(url("${webp}") type("image/webp"), url("${fallback}") type("${getImageMimeType(fallback)}"))`,
  }
}

