define('app/images', ['SpriteSheet'], function(SpriteSheet) {
  var background = new Image();
  background.src = "./assets/images/background.png";

  var dad = new Image();
  dad.src = "./assets/images/dad.png";

  var enemy = new Image();
  enemy.src = "./assets/images/enemy.png";

  var dad_idle = SpriteSheet.new(dad, {
    frames: [90, 90],
    x: 0,
    y: 0,
    width: 14 * 4,
    height: 21 * 4,
    restart: true,
  });

  return {
    background: background,
    dad: dad,
    dad_idle: dad_idle,
    enemy: enemy
  }
})