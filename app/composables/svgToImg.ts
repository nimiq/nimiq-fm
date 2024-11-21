export function createTextureFromSVG(svgString, width = 512, height = 512) {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
  
    // Create an image
    const img = new Image();
    const texture = new THREE.CanvasTexture(canvas);
  
    // Load SVG content into the image
    img.onload = () => {
      // Draw the SVG onto the canvas
      ctx.drawImage(img, 0, 0, width, height);
      texture.needsUpdate = true; // Update texture once the image is drawn
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
  
    return texture;
  }