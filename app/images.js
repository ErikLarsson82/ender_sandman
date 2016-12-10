define('app/images', ['SpriteSheet'], function(SpriteSheet) {
  var background = new Image();
  background.src = "./assets/images/background.png";

  var gameover = new Image();
  gameover.src = "./assets/images/gameover.png";

  var goodnight_text = new Image();
  goodnight_text.src = "./assets/images/goodnight_text.png";

  var text1 = new Image();
  text1.src = "./assets/images/text1.png";

  var text2 = new Image();
  text2.src = "./assets/images/text2.png";

  var safe_kiddo = new Image();
  safe_kiddo.src = "./assets/images/safe_now.png";

  var player_shadow = new Image();
  player_shadow.src = "./assets/images/player_shadow.png";

  var player_idle = new Image();
  player_idle.src = "./assets/images/player_idle.png";

  var player_walk = new Image();
  player_walk.src = "./assets/images/player_walk.png";

  var player_swing = new Image();
  player_swing.src = "./assets/images/player_swing.png";

  var weapon_swing = new Image();
  weapon_swing.src = "./assets/images/weapon_swing.png";

  var crib = new Image();
  crib.src = "./assets/images/crib.png";

  var punch = new Image();
  punch.src = "./assets/images/punch.png";

  var enemy_shadow = new Image();
  enemy_shadow.src = "./assets/images/enemy_shadow.png";

  var enemy_sleep = new Image();
  enemy_sleep.src = "./assets/images/enemy_sleep.png";

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

  return {
    background: background,
    gameover: gameover,
    goodnight_text: goodnight_text,
    text1: text1,
    text2: text2,
    safe_kiddo: safe_kiddo,
    player_shadow: player_shadow,
    player_idle: player_idle,
    player_swing: player_swing,
    player_walk: player_walk,
    weapon_swing: weapon_swing,
    crib: crib,
    punch: punch,
    enemy_sleep: enemy_sleep,
    enemy_shadow: enemy_shadow,
    enemy_walk: enemy_walk,
    enemy_hurt: enemy_hurt,
    enemy_attack: enemy_attack,
    enemy_jump: enemy_jump,
    enemy_preparing: enemy_preparing
  }
})