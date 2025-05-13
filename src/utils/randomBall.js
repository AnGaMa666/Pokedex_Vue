export function getRandomBallSprite() {
    const balls = [
        'poke-ball',
        'great-ball',
        'ultra-ball',
        'master-ball',
        'dive-ball',
        'dusk-ball',
        'net-ball',
        'quick-ball',
        'repeat-ball',
        'timer-ball',
        'luxury-ball',
        'heal-ball',
        'premier-ball',
        'friend-ball',
        'love-ball',
        'level-ball',
        'moon-ball',
        'heavy-ball',
        'fast-ball',
        'dream-ball',
    ];
    const random = balls[Math.floor(Math.random() * balls.length)];
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${random}.png`;
}
