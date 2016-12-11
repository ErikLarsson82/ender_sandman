define('app/images', ['SpriteSheet'], function(SpriteSheet) {
  var background = new Image();
  background.src = "./assets/images/background.png";

  var gameover = new Image();
  gameover.src = "./assets/images/gameover.png";

  var lightswitch = new Image();
  lightswitch.src = "./assets/images/lightswitch.png";

  var darkness_background = new Image();
  darkness_background.src = "./assets/images/darkness_background.png";

  var rift = new Image();
  rift.src = "./assets/images/rift.png";

  var ceilinglamp_cone = new Image();
  ceilinglamp_cone.src = "./assets/images/ceilinglamp_cone.png";

  var ceilinglamp_full = new Image();
  ceilinglamp_full.src = "./assets/images/ceilinglamp_full.png";

  var ceilinglamp = new Image();
  ceilinglamp.src = "./assets/images/ceiling_lamp.png";

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

  var player_light = new Image();
  player_light.src = "./assets/images/player_light.png";

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

  var enemy_spawning = new Image();
  enemy_spawning.src = "./assets/images/enemy_spawning.png";

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
    rift: rift,
    darkness_background: darkness_background,
    lightswitch: lightswitch,
    ceilinglamp_cone: ceilinglamp_cone,
    ceilinglamp_full: ceilinglamp_full,
    ceilinglamp: ceilinglamp,
    goodnight_text: goodnight_text,
    text1: text1,
    text2: text2,
    safe_kiddo: safe_kiddo,
    player_light: player_light,
    player_shadow: player_shadow,
    player_idle: player_idle,
    player_swing: player_swing,
    player_walk: player_walk,
    weapon_swing: weapon_swing,
    crib: crib,
    punch: punch,
    enemy_spawning: enemy_spawning,
    enemy_sleep: enemy_sleep,
    enemy_shadow: enemy_shadow,
    enemy_walk: enemy_walk,
    enemy_hurt: enemy_hurt,
    enemy_attack: enemy_attack,
    enemy_jump: enemy_jump,
    enemy_preparing: enemy_preparing
  }
})