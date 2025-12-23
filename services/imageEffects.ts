
export interface GengaConfig {
    outline: string;
    shadow: string;
    highlight: string;
}

// Applies a Gaussian blur to a grayscale image data array to reduce noise.
export const applyGaussianBlur = (grayValues: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray => {
    const output = new Uint8ClampedArray(grayValues.length);
    const kernel = [
        [1, 2, 1],
        [2, 4, 2],
        [1, 2, 1]
    ];
    const kernelWeight = 16;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let sum = 0;
            for (let j = -1; j <= 1; j++) {
                for (let i = -1; i <= 1; i++) {
                    const gray = grayValues[(y + j) * width + (x + i)];
                    sum += gray * kernel[j + 1][i + 1];
                }
            }
            output[y * width + x] = sum / kernelWeight;
        }
    }
    for (let y = 0; y < height; y++) {
        output[y * width] = grayValues[y * width];
        output[y * width + width - 1] = grayValues[y * width + width - 1];
    }
     for (let x = 0; x < width; x++) {
        output[x] = grayValues[x];
        output[(height-1) * width + x] = grayValues[(height-1) * width + x];
    }
    return output;
};


export const applyPencilSketchEffect = (ctx: any, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const sketchData = ctx.createImageData(width, height);
    const sketch = sketchData.data;

    const grayValues = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayValues[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    const threshold = 15;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            const pixelIndex = i * 4;
            let finalColor = 255;
            
            if (y < height - 1) { 
                const neighborIndex = i + width;
                const currentGray = grayValues[i];
                const neighborGray = grayValues[neighborIndex];
                const diff = Math.abs(currentGray - neighborGray);
                
                if (diff > threshold) {
                    finalColor = 20;
                }
            }

            sketch[pixelIndex] = finalColor;
            sketch[pixelIndex + 1] = finalColor;
            sketch[pixelIndex + 2] = finalColor;
            sketch[pixelIndex + 3] = 255;
        }
    }

    ctx.putImageData(sketchData, 0, 0);
};

export const applyCelShadingEffect = (ctx: any, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const outputData = ctx.createImageData(width, height);
    const output = outputData.data;

    const levels = 4; 
    const step = 255 / (levels - 1);
    const edgeThreshold = 30;

    const grayValues = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayValues[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x);
            const pixelIndex = i * 4;
            
            const currentGray = grayValues[i];
            const rightGray = (x < width - 1) ? grayValues[i + 1] : currentGray;
            const downGray = (y < height - 1) ? grayValues[i + width] : currentGray;
            const gradX = Math.abs(currentGray - rightGray);
            const gradY = Math.abs(currentGray - downGray);
            const isEdge = (gradX + gradY) > edgeThreshold;

            if (isEdge) {
                output[pixelIndex] = 0; 
                output[pixelIndex + 1] = 0;
                output[pixelIndex + 2] = 0;
            } else {
                output[pixelIndex] = Math.round(data[pixelIndex] / step) * step;
                output[pixelIndex + 1] = Math.round(data[pixelIndex + 1] / step) * step;
                output[pixelIndex + 2] = Math.round(data[pixelIndex + 2] / step) * step;
            }
            output[pixelIndex + 3] = 255; 
        }
    }

    ctx.putImageData(outputData, 0, 0);
};

export const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};

export const applyGengaEffect = (ctx: any, width: number, height: number, config: GengaConfig, improveQuality: boolean, lineThreshold: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const outputData = ctx.createImageData(width, height);
    const output = outputData.data;

    const outlineColor = config.outline === 'colorful' ? 'colorful' : hexToRgb(config.outline);
    const shadowColor = config.shadow === 'colorful' ? 'colorful' : hexToRgb(config.shadow);
    const highlightColor = config.highlight === 'colorful' ? 'colorful' : hexToRgb(config.highlight);

    const initialGrayValues = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        initialGrayValues[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    const grayValues = improveQuality ? applyGaussianBlur(initialGrayValues, width, height) : initialGrayValues;
    
    for (let i = 0; i < output.length; i += 4) {
        output[i] = 255;
        output[i + 1] = 255;
        output[i + 2] = 255;
        output[i + 3] = 255;
    }

    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
    const strongEdgeThreshold = 150; 

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gradX = 0;
            let gradY = 0;
            
            for (let j = -1; j <= 1; j++) {
                for (let i = -1; i <= 1; i++) {
                    const gray = grayValues[(y + j) * width + (x + i)];
                    gradX += gray * sobelX[j + 1][i + 1];
                    gradY += gray * sobelY[j + 1][i + 1];
                }
            }

            const magnitude = Math.sqrt(gradX * gradX + gradY * gradY);
            const outputIndex = (y * width + x) * 4;

            const drawPixel = (colorConfig: 'colorful' | [number, number, number] | null) => {
                if (!colorConfig) return;
                let finalColor: [number, number, number];
                if (colorConfig === 'colorful') {
                    finalColor = [data[outputIndex], data[outputIndex + 1], data[outputIndex + 2]];
                } else {
                    finalColor = colorConfig;
                }
                output[outputIndex] = finalColor[0];
                output[outputIndex + 1] = finalColor[1];
                output[outputIndex + 2] = finalColor[2];
            };

            if (magnitude > strongEdgeThreshold) {
                drawPixel(outlineColor);
            } else if (magnitude > lineThreshold) {
                const originalGray = initialGrayValues[y * width + x]; 
                if (originalGray < 85) {
                    drawPixel(shadowColor);
                } else if (originalGray > 170) {
                    drawPixel(highlightColor);
                }
            }
        }
    }
    ctx.putImageData(outputData, 0, 0);
};

const findClosestColor = (r: number, g: number, b: number, palette: [number, number, number][]) => {
    let closestColor = palette[0];
    let minDistance = Infinity;
    for (const color of palette) {
        const distance = Math.sqrt(
            Math.pow(r - color[0], 2) +
            Math.pow(g - color[1], 2) +
            Math.pow(b - color[2], 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color;
        }
    }
    return closestColor;
};

const EIGHT_BIT_PALETTE: [number, number, number][] = [
    [0, 0, 0],       
    [255, 255, 255], 
    [136, 0, 0],     
    [170, 255, 238], 
    [204, 68, 68],   
    [0, 204, 85],    
    [0, 0, 170],     
    [238, 238, 119], 
    [221, 136, 85],  
    [102, 68, 0],    
    [255, 119, 119], 
    [51, 204, 204],  
    [119, 119, 255], 
    [255, 119, 255], 
    [119, 255, 119], 
    [170, 170, 170]  
];

export const apply8BitEffect = (ctx: any, width: number, height: number, pixelSize: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const outputData = ctx.createImageData(width, height);
    const output = outputData.data;

    for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
            let r_sum = 0, g_sum = 0, b_sum = 0, count = 0;

            for (let py = y; py < y + pixelSize && py < height; py++) {
                for (let px = x; px < x + pixelSize && px < width; px++) {
                    const i = (py * width + px) * 4;
                    r_sum += data[i];
                    g_sum += data[i + 1];
                    b_sum += data[i + 2];
                    count++;
                }
            }
            
            if (count === 0) continue;

            const r_avg = r_sum / count;
            const g_avg = g_sum / count;
            const b_avg = b_sum / count;
            
            const [pr, pg, pb] = findClosestColor(r_avg, g_avg, b_avg, EIGHT_BIT_PALETTE);

            for (let py = y; py < y + pixelSize && py < height; py++) {
                for (let px = x; px < x + pixelSize && px < width; px++) {
                    const i = (py * width + px) * 4;
                    output[i] = pr;
                    output[i + 1] = pg;
                    output[i + 2] = pb;
                    output[i + 3] = 255;
                }
            }
        }
    }
    ctx.putImageData(outputData, 0, 0);
};

export const applySilhouetteEffect = (ctx: any, width: number, height: number, threshold: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const outputData = ctx.createImageData(width, height);
    const output = outputData.data;

    const bgColor = [255, 255, 255]; 

    for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        if (luminance < threshold) {
            output[i] = 0;
            output[i + 1] = 0;
            output[i + 2] = 0;
        } else {
            output[i] = bgColor[0];
            output[i + 1] = bgColor[1];
            output[i + 2] = bgColor[2];
        }
        output[i + 3] = 255;
    }
    ctx.putImageData(outputData, 0, 0);
};

export const applyLineArtEffect = (ctx: any, width: number, height: number, threshold: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const outputData = ctx.createImageData(width, height);
    const output = outputData.data;
    output.fill(255); 

    const grayValues = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        grayValues[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gradX = 0, gradY = 0;
            
            for (let j = -1; j <= 1; j++) {
                for (let i = -1; i <= 1; i++) {
                    const gray = grayValues[(y + j) * width + (x + i)];
                    gradX += gray * sobelX[j + 1][i + 1];
                    gradY += gray * sobelY[j + 1][i + 1];
                }
            }

            const magnitude = Math.sqrt(gradX * gradX + gradY * gradY);
            
            if (magnitude > threshold) {
                const outputIndex = (y * width + x) * 4;
                output[outputIndex] = 0;     
                output[outputIndex + 1] = 0; 
                output[outputIndex + 2] = 0; 
            }
        }
    }
    ctx.putImageData(outputData, 0, 0);
};

/**
 * Chroma Key (Global Color Removal)
 * Removes all pixels that match the corner colors within a threshold.
 * This is good for "Green Screen" style removal where the background is uniform.
 */
export const applyChromaKeyTransparency = (ctx: any, width: number, height: number, threshold: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Sample corners to find background color heuristic
    // Top-Left, Top-Right, Bottom-Left, Bottom-Right
    const corners = [0, (width - 1) * 4, (height - 1) * width * 4, (width * height - 1) * 4];
    
    // For now, we take the top-left as the primary key, 
    // but in a more advanced version we could vote or allow user selection.
    const keyR = data[0];
    const keyG = data[1];
    const keyB = data[2];

    for (let i = 0; i < data.length; i += 4) {
        // Skip already transparent pixels
        if (data[i + 3] === 0) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance in RGB
        const dist = Math.sqrt(
            Math.pow(r - keyR, 2) + 
            Math.pow(g - keyG, 2) + 
            Math.pow(b - keyB, 2)
        );

        if (dist < threshold) {
            data[i + 3] = 0;
        }
    }
    ctx.putImageData(imageData, 0, 0);
};

/**
 * Flood Fill Transparency (Magic Wand)
 * Starts from the corners and removes contiguous pixels that match the start color.
 * This prevents removing "inner" pixels that happen to match the background color.
 */
export const applyFloodFillTransparency = (ctx: any, width: number, height: number, threshold: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Track visited pixels to avoid infinite loops and re-processing
    // Using a typed array for performance. 0 = unvisited, 1 = visited
    const visited = new Uint8Array(width * height);

    // Stack for iterative DFS (to avoid recursion stack overflow)
    // Storing indices (0 to width*height - 1)
    const stack: number[] = [];

    // Add 4 corners to the stack as starting points
    const startPoints = [
        { x: 0, y: 0 },
        { x: width - 1, y: 0 },
        { x: 0, y: height - 1 },
        { x: width - 1, y: height - 1 }
    ];

    for (const p of startPoints) {
        const idx = p.y * width + p.x;
        if (visited[idx]) continue;
        
        // Push to stack
        stack.push(idx);
        visited[idx] = 1;
    }

    // Process stack
    while (stack.length > 0) {
        const idx = stack.pop()!;
        const x = idx % width;
        const y = Math.floor(idx / width);
        const pixelOffset = idx * 4;

        // Get current pixel color
        const r = data[pixelOffset];
        const g = data[pixelOffset + 1];
        const b = data[pixelOffset + 2];
        const a = data[pixelOffset + 3];

        if (a === 0) {
            // Already transparent, treat as match for propagation but don't need to clear
            // (continue to neighbors)
        } else {
             // Check against the START color? Or Current Neighbor?
             // Standard "Background Removal" usually compares against the "Key" color (e.g. top-left).
             // However, for gradients, we might compare to neighbor.
             // Here we use the Top-Left pixel of the *Image* as the reference Key for simplicity in this mode,
             // assuming the background is somewhat uniform.
             
             // Let's use Top-Left (0,0) as the reference "Background Color" for the whole operation.
             const refR = data[0];
             const refG = data[1];
             const refB = data[2];

             const dist = Math.sqrt(
                Math.pow(r - refR, 2) + 
                Math.pow(g - refG, 2) + 
                Math.pow(b - refB, 2)
             );

             if (dist > threshold) {
                 // It's not background, stop propagation here
                 continue;
             }
             
             // It IS background, make transparent
             data[pixelOffset + 3] = 0;
        }

        // Add neighbors
        const neighbors = [
            { nx: x + 1, ny: y },
            { nx: x - 1, ny: y },
            { nx: x, ny: y + 1 },
            { nx: x, ny: y - 1 }
        ];

        for (const { nx, ny } of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (visited[nIdx] === 0) {
                    visited[nIdx] = 1;
                    stack.push(nIdx);
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
};

// 視認性を高めるための高密度文字セット
const ASCII_CHARS_DENSE = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^'. ";

interface OutlineConfig {
    threshold: number;
}
interface TransparentBgConfig {
    threshold: number;
}

export const convertImageToAscii = (
    ctx: any, 
    canvasWidth: number, 
    canvasHeight: number, 
    asciiWidth: number, 
    outlineConfig?: OutlineConfig, 
    transparentBgConfig?: TransparentBgConfig,
    invert?: boolean
): string => {
    // インバート処理
    const charSet = invert ? ASCII_CHARS_DENSE : ASCII_CHARS_DENSE.split('').reverse().join('');

    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;
    
    let bgMask: boolean[] | null = null;
    if (transparentBgConfig) {
        const bgColor = [data[0], data[1], data[2]];
        bgMask = new Array(canvasWidth * canvasHeight).fill(false);
        for (let i = 0; i < data.length; i += 4) {
            const distance = Math.sqrt(
                Math.pow(data[i] - bgColor[0], 2) + 
                Math.pow(data[i + 1] - bgColor[1], 2) + 
                Math.pow(data[i + 2] - bgColor[2], 2)
            );
            if (distance < transparentBgConfig.threshold) {
                bgMask[i / 4] = true;
            }
        }
    }
    
    let grayValues: Uint8ClampedArray;

    if (outlineConfig) {
        const originalGray = new Uint8ClampedArray(canvasWidth * canvasHeight);
        for (let i = 0; i < data.length; i += 4) {
            originalGray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }

        const lineArtGray = new Uint8ClampedArray(canvasWidth * canvasHeight).fill(255);
        const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
        const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

        for (let y = 1; y < canvasHeight - 1; y++) {
            for (let x = 1; x < canvasWidth - 1; x++) {
                const currentPixelIndex = y * canvasWidth + x;
                if (bgMask && bgMask[currentPixelIndex]) {
                    continue; 
                }
                
                let gradX = 0, gradY = 0;
                for (let j = -1; j <= 1; j++) {
                    for (let i = -1; i <= 1; i++) {
                        const gray = originalGray[(y + j) * canvasWidth + (x + i)];
                        gradX += gray * sobelX[j + 1][i + 1];
                        gradY += gray * sobelY[j + 1][i + 1];
                    }
                }
                const magnitude = Math.sqrt(gradX * gradX + gradY * gradY);
                if (magnitude > outlineConfig.threshold) {
                    lineArtGray[currentPixelIndex] = 0;
                }
            }
        }
        grayValues = lineArtGray;
    } else {
        grayValues = new Uint8ClampedArray(canvasWidth * canvasHeight);
        for (let i = 0; i < data.length; i += 4) {
            grayValues[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
    }
    
    const characterAspectRatio = 0.6; 
    const asciiHeight = Math.floor(asciiWidth * (canvasHeight / canvasWidth) * characterAspectRatio);
    
    if (asciiHeight === 0 || asciiWidth === 0) return '';
    
    const blockWidth = canvasWidth / asciiWidth;
    const blockHeight = canvasHeight / asciiHeight;

    let asciiArt = '';

    for (let y = 0; y < asciiHeight; y++) {
        for (let x = 0; x < asciiWidth; x++) {
            const startX = Math.floor(x * blockWidth);
            const startY = Math.floor(y * blockHeight);
            
            let totalGray = 0;
            let pixelCount = 0;
            let bgPixelCount = 0;
            
            for (let blockY = 0; blockY < Math.ceil(blockHeight); blockY++) {
                for (let blockX = 0; blockX < Math.ceil(blockWidth); blockX++) {
                    const pixelX = startX + blockX;
                    const pixelY = startY + blockY;
                    
                    if (pixelX < canvasWidth && pixelY < canvasHeight) {
                        const index = pixelY * canvasWidth + pixelX;
                        totalGray += grayValues[index];
                        pixelCount++;
                        if (bgMask && bgMask[index]) {
                            bgPixelCount++;
                        }
                    }
                }
            }

            if (pixelCount === 0) continue;

            if (bgMask && (bgPixelCount / pixelCount > 0.5)) {
                 asciiArt += ' ';
                 continue;
            }

            const avgGray = totalGray / pixelCount;
            const charIndex = Math.floor((avgGray / 255) * (charSet.length - 1));
            const char = charSet[charIndex] || ' ';
            asciiArt += char;
        }
        asciiArt += '\n';
    }
    return asciiArt;
};
