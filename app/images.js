define('app/images', ['SpriteSheet'], function(SpriteSheet) {
  var background = new Image();
  background.src = "./assets/images/background.png";

  var dad = new Image();
  dad.src = "./assets/images/dad.png";

  var crib = new Image();
  crib.src = "./assets/images/crib.png";

  var punch = new Image();
  punch.src = "./assets/images/punch.png";

  var enemy_walk = new Image();
  enemy_walk.src = "./assets/images/enemy_walk.png";

  var enemy_hurt = new Image();
  enemy_hurt.src = "./assets/images/enemy_hurt.png";

  var enemy_jump = new Image();
  enemy_jump.src = "./assets/images/enemy_jump.png";

  var enemy_attack = new Image();
  enemy_attack.src = "./assets/images/enemy_attack.png";

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
    crib: crib,
    punch: punch,
    dad_idle: dad_idle,
    enemy_walk: enemy_walk,
    enemy_hurt: enemy_hurt,
    enemy_attack: enemy_attack,
    enemy_jump: enemy_jump,
    enemy_preparing: enemy_preparing
  }
})