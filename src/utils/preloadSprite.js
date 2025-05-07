export function preloadSprites(spriteUrls) {
    const preload = (url) =>
        new Promise((resolve) => {
            if (!url) return resolve(null);
            const img = new Image();
            img.onload = () => resolve(url);
            img.onerror = () => {
                console.warn('Sprite fehlgeschlagen:', url);
                resolve(null); // blockiert nicht
            };
            img.src = url;
        });

    return Promise.all(spriteUrls.map(preload));
}

export async function preloadSpritesInBatches(spriteUrls, batchSize = 25) {
    const batches = [];
    for (let i = 0; i < spriteUrls.length; i += batchSize) {
        const batch = spriteUrls.slice(i, i + batchSize);
        batches.push(preloadSprites(batch));
    }
    for (const batch of batches) {
        await batch;
    }
}
