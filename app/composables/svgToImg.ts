import * as THREE from 'three'

export function createTextureFromSVG(svgString: string, width = 512, height = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  const img = new Image()
  const texture = new THREE.CanvasTexture(canvas)

  img.onload = () => {
    ctx.drawImage(img, 0, 0, width, height)
    texture.needsUpdate = true
  }
  img.src = `data:image/svg+xml;base64,${btoa(svgString)}`

  return texture
}
