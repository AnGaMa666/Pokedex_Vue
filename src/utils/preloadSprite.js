function preload(url) {
    return new Promise((resolve) => {
        if (!url) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => {
            console.warn('Sprite fehlgeschlagen:', url);
            resolve(null);
        };
        img.src = url;
    });
}

export async function preloadSprites(spriteUrls) {
    return Promise.all(spriteUrls.map(preload));
}

export async function preloadSpritesInBatches(spriteUrls, batchSize = 25, delay = 100) {
    for (let i = 0; i < spriteUrls.length; i += batchSize) {
        const batch = spriteUrls.slice(i, i + batchSize);
        await preloadSprites(batch);
        await new Promise(resolve => setTimeout(resolve, delay)); // kleine Pause zwischen Batches
    }
}
