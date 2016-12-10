define('app/images', ['SpriteSheet'], function(SpriteSheet) {
  var background = new Image();
  background.src = "./assets/images/background.png";

  var dad = new Image();
  dad.src = "./assets/images/dad.png";

  var punch = new Image();
  punch.src = "./assets/images/punch.png";

  var enemy_walk = new Image();
  enemy_walk.src = "./assets/images/enemy_walk.png";

  var enemy_jump = new Image();
  enemy_jump.src = "./assets/images/enemy_jump.png";

  var enemy_preparing = new Image();
  enemy_preparing.src = "./assets/images/enemy_preparing.png";

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
    punch: punch,
    dad_idle: dad_idle,
    enemy_walk: enemy_walk,
    enemy_jump: enemy_jump,
    enemy_preparing: enemy_preparing
  }
})