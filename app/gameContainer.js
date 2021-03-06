requirejs.config({
    waitSeconds: '60',
    baseUrl: 'lib',
    paths: {
      'app': '../app',
      'GameLoop': '../node_modules/gameloop-schwein/GameLoop',
      'SpriteSheet': '../node_modules/spritesheet-canvas/SpriteSheet'
    }
});

requirejs([
  'app/game',
  'GameLoop'
], function (game, GameLoop) {

    let running = true;

    window.addEventListener('keydown', function (e) {
        if (e.keyCode === 80) {
            running = !running;
        }
    });

    var muted = false;

    window.addEventListener("keydown", function(e) {
      if (e.keyCode === 77) { // M - mute
        muted = !muted
        if (muted) {
          music_intro.pause()
          music_ending.pause()
        } else {
          music_intro.play()
        }
      }
    })

    const music_intro = new Audio('assets/sounds/music_intro.ogg')
    music_intro.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);

    const music_ending = new Audio('assets/sounds/music_ending.ogg')
    music_ending.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
    
    const fightmusic = new Audio('assets/sounds/fightmusic.ogg')
    fightmusic.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);

    const fear = new Audio('assets/sounds/iron_maiden.ogg')
    
    const cribdmg = new Audio('assets/sounds/cribdmg.ogg')
    const darkness = new Audio('assets/sounds/darkness.ogg')
    const jump1 = new Audio('assets/sounds/jump1.ogg')
    const jump2 = new Audio('assets/sounds/jump2.ogg')
    const jump3 = new Audio('assets/sounds/jump3.ogg')
    const swing = new Audio('assets/sounds/swing.ogg')
    const enemydie = new Audio('assets/sounds/enemydie.ogg')
    const hurt = new Audio('assets/sounds/hurt.ogg')
    const childdmg = new Audio('assets/sounds/childdmg.ogg')
    
    const sfxs = {
        fear: fear,
        music_intro: music_intro,
        fightmusic: fightmusic,
        music_ending: music_ending,
        cribdmg: cribdmg, 
        childdmg: childdmg, 
        hurt: hurt,
        enemydie: enemydie,
        darkness: darkness,
        jump1: jump1,
        jump2: jump2,
        jump3: jump3,
        swing: swing,
    }

    function playSound(soundString, shouldPause, reset) {
      if (reset) {
        sfxs[soundString].currentTime = 0;
      }
      if (!muted) {
        if (shouldPause) {
          sfxs[soundString].pause()
        } else {
          sfxs[soundString].play()
        }
      }
    }

    game.init(0, playSound);

    var tick = function(delta) {
        if (!running) return;
        game.tick(delta);
    }
    var config = {
        callback: tick,
        fpsMode: 'fixed',
        fps: '60',
        autoStart: true,
        createDebugKeyBoardShortcuts: true
    }
    var gameLoop = new GameLoop(config);
})