/**
 * Analyzes an image to extract the most prominent colors as hex codes
 * @param imageDataUrl - The data URL of the image to analyze
 * @returns Promise<Array<string>> - Array of hex color codes (up to 6)
 */
export async function analyzeImageColors(imageDataUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Could not get canvas context');
          resolve([]);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        // Sample pixels and count color frequencies
        const colorCounts = new Map<string, number>();
        const sampleRate = Math.max(1, Math.floor(pixels.length / 4 / 1000)); // Sample every nth pixel

        for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize colors to reduce noise
          const quantizedR = Math.min(255, Math.max(0, Math.round(r / 32) * 32));
          const quantizedG = Math.min(255, Math.max(0, Math.round(g / 32) * 32));
          const quantizedB = Math.min(255, Math.max(0, Math.round(b / 32) * 32));

          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
          colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
        }

        // Sort by frequency and get top 6 colors
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([colorKey]) => {
            const [r, g, b] = colorKey.split(',').map(Number);
            return rgbToHex(r, g, b);
          });

        resolve(sortedColors);
      } catch (error) {
        console.error('Error analyzing colors:', error);
        resolve([]);
      }
    };

    img.onerror = () => {
      console.error('Error loading image for color analysis');
      resolve([]);
    };

    img.src = imageDataUrl;
  });
}

/**
 * Converts RGB values to hex color code
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color code string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return "#" + toHex(r) + toHex(g) + toHex(b);
}
