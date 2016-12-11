define('app/game', [
    'app/images',
    'app/level',
    'underscore',
    'userInput',
    'SpriteSheet',
    'TimedAction',
    'utils'
], function (
    images,
    level,
    _,
    userInput,
    SpriteSheet,
    TimedAction,
    utils
) {
    var DEBUG_WRITE_BUTTONS = false;
    var DEBUG_NO_2D = true;
    var DEBUG_KEYBOARD = true;

    const TILE_SIZE = 14 * 4;
    var gameObjects = [];
    var game = {}

    game.distance = function(obj1, obj2) {
        const dx = obj2.x - obj1.x
        const dy = obj2.y - obj1.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    game.getAngle = function(pos) {
      return Math.atan2(pos.y, pos.x)
    };

    game.endCondition = function() {
        if (game.crib.hp <= 0) return 'gameover';
        if (game.player.hp <= 0) return 'gameover';
        if (game.calm === false && game.crib.safe === true && game.countSpawnsAndEnemies() <= 0) return 'win';

        return 'false';
    }

    game.nextLevel = function() {
        if (game.levelIdx === 3) {
            //
        } else {
            game.destroy();
            game.init(game.levelIdx + 1, game.playSound);
        }
    }

    game.startAction = function() {
        game.player.textSwitcher.preFight();
        game.loadEnemies();
        game.calm = false;
        game.playSound('music_intro', true);
        game.playSound('music_ending', true);
        game.playSound('darkness')
        this.hasReleasedButton = false;
    }

    game.gameOver = function() {
        game.fader.fadeOut();
        game.canSkipGameOverScreen = false;
        game.playSound('darkness')
        setTimeout(function() {
            game.canSkipGameOverScreen = true;
        }.bind(this), 2500)
        //game.playSound('')
    }

    game.fadeoutAndShowText = function() {
        if (game.levelIdx === 3) {
            game.ironMaiden = new IronMaiden();
            game.superGameOver = true;
            game.banishCounter = 0;
            game.playSound('music_ending', true)
            game.playSound('fear')
        } else {
            game.betweenText = new BetweenText();
            game.fader.deltaOut = 0.6;
            game.fader.fadeOut();
        }
    }

    game.gameWon = function() {
        if (game.crib.safe) return;
        game.crib.safeTouch();
        game.calm = true;
        game.playSound('music_ending', false, true);
        game.player.textSwitcher.afterFight();
    }

    game.countSpawnsAndEnemies = function() {
        return _.filter(gameObjects, function(item) {
            return  (item instanceof Spawner && item.enemies > 0) || 
                    (item instanceof Enemy);
        }).length;
    }
    game.isInIgnoreFilter = function(mover, item) {
        var filter = [
            [Player, Punch],
            [Punch, Player],
            [Enemy, Enemy],
            [Punch, Tile],
        ]

        return !!_.find(filter, function(pair) {
            return (mover instanceof pair[0] && item instanceof pair[1])
        })
    }

    game.attemptMove = function(object, hitbox) {
        var hitboxX = {
            x: hitbox.x, //Only change this value!
            y: object.hitbox.y,
            width: hitbox.width,
            height: hitbox.height,
        }
        var resultX = game.detectHits(object, hitboxX);
        _.each(resultX, function(collidee) {
            game.resolveCollision(object, hitbox, collidee);
        })

        var hitboxY = {
            x: object.hitbox.x,
            y: hitbox.y, //Only change this value!
            width: hitbox.width,
            height: hitbox.height,
        }
        var resultY = game.detectHits(object, hitboxY);
        _.each(resultY, function(collidee) {
            game.resolveCollision(object, hitbox, collidee);
        })

        if (resultX.length === 0) {
            object.hitbox.x = hitbox.x;
        }
        if (resultY.length === 0) {
            object.hitbox.y = hitbox.y;
        }
    }

    game.isOfTypes = function(gameObject, other, type1, type2) {
        return (gameObject instanceof type1 && other instanceof type2) ||
            (gameObject instanceof type2 && other instanceof type1)
    }

    game.getOfType = function(gameObject, other, type) {
        if (gameObject instanceof type && other instanceof type) {
          console.warn(`Both ${gameObject} and ${other} were of type ${type}`)
        }
        if (gameObject instanceof type) {
          return gameObject
        } else if (other instanceof type) {
          return other
        }
        console.error(`None of type ${type}, ${gameObject} - ${other}`)
    }

    game.resolveCollision = function(collider, newHitbox, collidee) {
        if (game.isOfTypes(collider, collidee, Player, Switch)) {
            if (!game.beforeFight) return;

            var theSwitch = game.getOfType(collider, collidee, Switch);
            var player = game.getOfType(collider, collidee, Player);
            theSwitch.hit();
            game.ceilinglamp.light = false;
            game.beforeFight = false;
            game.startAction()
        }

        if (game.isOfTypes(collider, collidee, Player, Enemy)) {
            var enemy = game.getOfType(collider, collidee, Enemy);
            var player = game.getOfType(collider, collidee, Player);
            player.hurt(enemy.playerDamage);
        }

        if (game.isOfTypes(collider, collidee, Enemy, Punch)) {
            var enemy = game.getOfType(collider, collidee, Enemy);
            var punch = game.getOfType(collider, collidee, Punch);
            enemy.hurt(punch.direction);
            punch.isColliding = false;
        }

        if (game.isOfTypes(collider, collidee, Player, Crib)) {
            var player = game.getOfType(collider, collidee, Player);
            var crib = game.getOfType(collider, collidee, Crib);
            if (game.countSpawnsAndEnemies() === 0 && !game.beforeFight) {
                game.gameWon();
            }
        }
    }

    game.detectHits = function(mover, hitbox) {
        return _.filter(gameObjects, function(item) {
            if (!item.hitbox) {
                console.error("Dimensions not found on item");
                return false;
            }
            if (item === mover) return;


            const condition1 = hitbox.x + hitbox.width > item.hitbox.x;
            const condition2 = hitbox.x < item.hitbox.x + item.hitbox.width;
            const condition3 = hitbox.y + hitbox.height > item.hitbox.y;
            const condition4 = hitbox.y < item.hitbox.y + item.hitbox.height;

            // mover is always dynamic
            // subcondition 5 is true if mover is colliding and that is colliding with a dynamic
            var moverIsDynamic = !mover.isStatic;
            var itemIsDynamic = !item.isStatic;
            const subCondition5 = mover.isColliding && moverIsDynamic;
            const subCondition6 = item.isColliding && itemIsDynamic;
            const subCondition7 = item.isStatic;

            const condition6 = !game.isInIgnoreFilter(mover, item);

            const condition5 = ((subCondition5 && subCondition6) || subCondition7)
            return (condition1 && condition2 && condition3 && condition4 && condition5 && condition6);
        });
    }

    game.findGameObj = function(klass) {
        return _.find(gameObjects, function(item) {
            return item instanceof klass;
        });
    }

    game.convertToScreenCoordinates = function(pos) {
        var newPos = {
            x: Math.round(pos.x + (pos.y * 0.25)),
            y: Math.round(pos.y / 2),
        }
        return newPos;
    }


    function debugWriteButtons(pad) {
        if (!DEBUG_WRITE_BUTTONS) return;
        _.each(pad && pad.buttons, function(button, idx) {
            if (button.pressed) console.log(idx + " pressed");
        })
    }

    if (DEBUG_KEYBOARD) {
        window.addEventListener("keydown", function(e) {
            if (e.keyCode === 81) {
                _.each(gameObjects, function(item) {
                    if (item instanceof Enemy) item.destroy()
                    if (item instanceof Spawner) item.destroy()
                })
            }
        })
    }

    class IronMaiden {
        constructor() {
            var speed = 300;
            var callback3 = function() {
                this.spritesheet = SpriteSheet.new(images.iron_maiden_loop, {
                    frames: [speed, speed],
                    x: 0,
                    y: 0,
                    width: 1704 / 3,
                    height: 600,
                    restart: true,
                    autoPlay: true
                });
            }.bind(this)
            var callback2 = function() {
                this.spritesheet = SpriteSheet.new(images.iron_maiden_entry3, {
                    frames: [speed, speed, speed],
                    x: 0,
                    y: 0,
                    width: 1704 / 3,
                    height: 600,
                    restart: false,
                    autoPlay: true,
                    callback: callback3
                });
            }.bind(this)
            var callback1 = function() {
                this.spritesheet = SpriteSheet.new(images.iron_maiden_entry2, {
                    frames: [speed, speed, speed, speed],
                    x: 0,
                    y: 0,
                    width: 2272 / 4,
                    height: 600,
                    restart: false,
                    autoPlay: true,
                    callback: callback2
                });
            }.bind(this)
            this.spritesheet = SpriteSheet.new(images.iron_maiden_entry1, {
                frames: [speed, speed, speed, speed],
                x: 0,
                y: 0,
                width: 2272 / 4,
                height: 600,
                restart: false,
                autoPlay: true,
                callback: callback1
            });
        }
        tick() {
            this.spritesheet.tick();
        }
        draw() {
            context.save();
            context.translate(100, 0)
            this.spritesheet.draw(context);
            context.restore();
        }
    }

    class BetweenText {
        constructor() {
            this.counter = 0;
            this.render = false;
            this.texts = [
                images.text6,
                images.text12,
                images.text12,
            ]
        }
        tick() {
            var debugFaster = 1; //0.1;
            this.counter++;
            if (this.counter > 400 * debugFaster) {
                game.nextLevel()
            } else if (this.counter > 300 * debugFaster) {
                this.render = false;
            } else if (this.counter > 200 * debugFaster) {
                this.render = true;
            }
        }
        draw(context) {
            (this.render) ? context.drawImage(this.texts[game.levelIdx], -120, 56 * 4) : null;
        }
    }

    class Fader {
        constructor() {
            this.counter = 0;
            this.deltaIn = 0.5;
            this.deltaOut = 0.2;
            this.fadingIn = false;
            this.fadingOut = false;

            window.addEventListener("keydown", function(e) {
                if (e.keyCode === 192) { //ö
                    this.fadeIn();
                }
                if (e.keyCode === 222) { //ä
                    this.fadeOut();
                }
            }.bind(this))
        }
        tick() {
            if (this.fadingIn) {
                this.counter += this.deltaIn;
                if (this.counter > 100) this.counter = 100;
            }
            if (this.fadingOut) {
                this.counter -= this.deltaOut;
                if (this.counter < 0) this.counter = 0;
            }
        }
        getFade() {
            return 1 - (this.counter / 100);
        }
        fadeIn() {
            this.fadingIn = true;
            this.fadingOut = false;
        }
        fadeOut() {
            this.fadingIn = false;
            this.fadingOut = true;
        }
    }

    class Shaker {
        constructor() {
            var shakeAmount = 2;
            var shakeAmount2 = 5;
            this.idx = 0;
            this.shakeArray = [
                [shakeAmount,0],
                [shakeAmount,0],
                [0,0],
                [shakeAmount,shakeAmount2],
                [shakeAmount,0],
                [0,-shakeAmount2],
                [shakeAmount,0],
                [0,0],
                [shakeAmount,shakeAmount2],
                [shakeAmount,0],
                [0,-shakeAmount2],
                [0,-shakeAmount2],
                [0,-shakeAmount2],
                [-shakeAmount,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
                [0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],
              ];
        }
        shake() {
            this.idx = 0;
        }
        renderShake(context) {
            context.save();
            context.translate(this.shakeArray[this.idx][0], this.shakeArray[this.idx][1]);
        }
        restore(context) {
            context.restore();
        }
        tick() {
            this.idx++;
            if (this.idx >= this.shakeArray.length) this.idx = 0;
        }
    }

    class ScreenShaker {
        constructor() {
            this.idx = 0;
            var shakeAmount = 7;
            var shakeAmount2 = 4;
            this.shakeArray = [
                [0,0],
                [shakeAmount,0],
                [shakeAmount,shakeAmount2],
                [shakeAmount,shakeAmount2],
                [shakeAmount,shakeAmount2],
                [shakeAmount,shakeAmount2],
                [shakeAmount,0],
                [0,-shakeAmount2],
                [0,-shakeAmount2],
                [0,-shakeAmount2],
                [0,-shakeAmount2],
                [0,-shakeAmount2],
                [0,-shakeAmount2],
                [-shakeAmount,0],
                [-shakeAmount,0],
                [-shakeAmount,0],
                [-shakeAmount,0],
                [-shakeAmount,0],
                [-shakeAmount,0],
                [-shakeAmount,0],
                [-shakeAmount,0],
                [0,0],
                [0,0],
                [0,0],
                [0,0],
                [0,shakeAmount2],
                [0,shakeAmount2],
                [0,shakeAmount2],
                [shakeAmount,shakeAmount2],
                [shakeAmount,shakeAmount2],
                [shakeAmount,shakeAmount2],
                [shakeAmount,0],
                [shakeAmount,0],
                [shakeAmount,0],
                [shakeAmount,0],
                [0,0],
            ];
            window.addEventListener("keydown", function(e) {
                if (e.keyCode === 74) { //j
                    this.shake();
                }
            }.bind(this))
        }
        shake() {
            if (this.idx === 0) {
                this.idx = this.shakeArray.length-1;
            }
        }
        render() {
            if (this.idx > 0) {
                this.idx = this.idx - 1;
                context.save();
                context.translate(this.shakeArray[this.idx][0], this.shakeArray[this.idx][1]);
            }
        }
        restore() {
            if (this.idx > 0) {
                context.restore();
            }
        }
    }

    class GameObject {
        constructor(config) {
            this.game = config.game;
            this.hitbox = config.hitbox;
            this.direction = config.direction || { x: 0, y: 0 }
            this.color = config.color || "#444444";
            this.markedForRemoval = false;
            this.isColliding = true;
            this.isStatic = false;
            this.name = "Gameobject";
        }
        tick() {

        }
        destroy() {
            this.markedForRemoval = true;
        }
        draw2d(context) {
            if (!this.isColliding) context.globalAlpha = 0.5;
            context.fillStyle = this.color;
            context.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
            context.globalAlpha = 1;
        }
        drawFloor() {}
        draw3d() {}
        drawLights() {}
        drawDecor() {}
        draw3dTextoverlay() {}
        drawMask() {}
        draw3dMask() {}
    }

    class Tile extends GameObject {
        constructor(config) {
            super(config);
            this.isStatic = true;
            this.name = "Tile";
        }
    }

    class Spawner extends GameObject {
        constructor(config) {
            super(config);
            this.isStatic = false;
            this.isColliding = false;
            this.name = "Spawner";
            this.enemies = 2;
            this.spawnMax = 600;
            this.spawning = this.spawnMax - (Math.random() * 300);
            this.rift_spritesheet = SpriteSheet.new(images.rift, {
                frames: [100, 100, 100, 100, 100, 100],
                x: 0,
                y: 0,
                width: 408 / 6,
                height: 72,
                restart: true,
                autoPlay: true
            });
        }
        tick() {
            this.rift_spritesheet.tick();
            this.spawning++;
            if (this.spawning > this.spawnMax) {
                this.spawn();
                this.spawning = 0;
                this.enemies--;
            }
            if (this.enemies <= 0) {
                this.destroy();
            }
        }
        drawFloor(context) {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.rift.height + 20)
            this.rift_spritesheet.draw(context);
            context.restore();
        }
        spawn() {
            if (game.levelIdx === 0) {
                var enemy = new Enemy({
                hitbox: {
                        x: this.hitbox.x,
                        y: this.hitbox.y,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    game: game,
                });
                gameObjects.push(enemy);
            } else {
                var rand = Math.random();
                if (rand > 0.5) {
                    var enemy = new Enemy({
                    hitbox: {
                            x: this.hitbox.x,
                            y: this.hitbox.y,
                            width: TILE_SIZE,
                            height: TILE_SIZE
                        },
                        attackingCrib: true,
                        game: game,
                    });
                    gameObjects.push(enemy);
                } else if (rand > 0.25) {
                    var enemy = new Enemy({
                    hitbox: {
                            x: this.hitbox.x,
                            y: this.hitbox.y,
                            width: TILE_SIZE,
                            height: TILE_SIZE
                        },
                        chasingPlayer: true,
                        game: game,
                    });
                    gameObjects.push(enemy);
                } else {
                    var enemy = new Enemy({
                    hitbox: {
                            x: this.hitbox.x,
                            y: this.hitbox.y,
                            width: TILE_SIZE,
                            height: TILE_SIZE
                        },
                        game: game,
                    });
                    gameObjects.push(enemy);
                }
            }
        }
    }

    class Lightsource extends GameObject {
        constructor(config) {
            super(config);
            this.name = "Lightsource";
            this.imageLight = config.imageLight;
            this.imageDark = config.imageDark;
            this.isColliding = false;
            this.light = true;
        }
        drawLights(context) {
            context.globalAlpha = 0.5;
            var image = (this.light) ? this.imageLight : this.imageDark;
            context.drawImage(image, this.hitbox.x, this.hitbox.y)
            context.globalAlpha = 1;
        }
        drawMask(context) {
            if (this.light) {
                context.drawImage(images.ceilinglamp_cone, this.hitbox.x, this.hitbox.y)
            }
        }
    }

    class Decor extends GameObject {
        constructor(config) {
            super(config);
            this.name = "Decor";
            this.image = config.image;
            this.isColliding = false;
        }
        drawDecor(context) {
            context.drawImage(this.image, this.hitbox.x, this.hitbox.y)
        }
    }

    class Switch extends Tile {
        constructor(config) {
            super(config);
            this.name = "Switch";
            this.switch_spritesheet = SpriteSheet.new(images.lightswitch, {
                frames: [2000, 50, 50, 50, 50, 50, 50, 50, 50],
                x: 0,
                y: 0,
                width: 216 / 9,
                height: 24,
                restart: true,
                autoPlay: true
            });
        }
        tick() {
            this.switch_spritesheet.tick()
        }
        hit() {
            this.switch_spritesheet.stop();
        }
        draw3d(context) {
            if (game.superGameOver) return;
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x + 45, screenPos.y - 26)
            this.switch_spritesheet.draw(context);
            context.restore();
        }
    }

    class Crib extends GameObject {
        constructor(config) {
            super(config);
            this.isStatic = true;
            this.name = "Crib";
            this.hp = 15;
            if (game.levelIdx === 0) {
                this.calm_spritesheet = SpriteSheet.new(images.crib_calm, {
                    frames: [4000, 200, 200],
                    x: 0,
                    y: 0,
                    width: 372 / 3,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
                this.action_spritesheet = SpriteSheet.new(images.crib_action, {
                    frames: [1000, 200],
                    x: 0,
                    y: 0,
                    width: 248 / 2,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
            } else if (game.levelIdx === 1) {
                this.calm_spritesheet = SpriteSheet.new(images.child_calm, {
                    frames: [400, 400],
                    x: 0,
                    y: 0,
                    width: 248 / 2,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
                this.action_spritesheet = SpriteSheet.new(images.child_action, {
                    frames: [2000, 100, 100, 100, 100],
                    x: 0,
                    y: 0,
                    width: 620 / 5,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
            } else if (game.levelIdx === 2) {
                this.calm_spritesheet = SpriteSheet.new(images.youngster_calm, {
                    frames: [400, 400],
                    x: 0,
                    y: 0,
                    width: 248 / 2,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
                this.action_spritesheet = SpriteSheet.new(images.youngster_action, {
                    frames: [1000, 100, 100, 100],
                    x: 0,
                    y: 0,
                    width: 496 / 4,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
            } else {
                this.calm_spritesheet = SpriteSheet.new(images.teen_calm, {
                    frames: [100, 100, 100, 1000],
                    x: 0,
                    y: 0,
                    width: 496 / 4,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
                this.action_spritesheet = SpriteSheet.new(images.teen_action, {
                    frames: [1000, 100, 100, 100],
                    x: 0,
                    y: 0,
                    width: 496 / 4,
                    height: 80,
                    restart: true,
                    autoPlay: true
                });
            }
            this.safe = false;
        }
        safeTouch() {
            this.safe = true;
        }
        damage() {
            game.playSound('cribdmg')
            this.hp--;
            this.game.screenShaker.shake();
            if (this.hp <= 0) game.gameOver();
        }
        tick() {
            this.calm_spritesheet.tick();
            this.action_spritesheet.tick();
        }
        draw3d() {
            //var screenPos = game.convertToScreenCoordinates(this.hitbox)
            //context.drawImage(images.crib, screenPos.x - 50, screenPos.y - 50);
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x - 50, screenPos.y - 50)
            if (game.calm) {
                this.calm_spritesheet.draw(context);
                
            } else {
                this.action_spritesheet.draw(context);
            }
            context.restore();
        }
    }

    class Enemy extends GameObject {
        constructor(config) {
            super(config);
            this.name = "Enemy"
            this.action = null;
            this.hp = 5;
            this.playerDamage = 1;
            this.movement = { x: 0, y: 0 };
            this.shaker = new Shaker();
            this.spawnDone = false;
            this.spawn_spritesheet = SpriteSheet.new(images.enemy_spawning, {
                frames: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
                x: 0,
                y: 0,
                width: 884 / 13,
                height: 72,
                restart: false,
                autoPlay: true,
                callback: function() {
                    this.spawnDone = true;
                    this.chasingPlayer = config.chasingPlayer || false;
                    this.state = (config.attackingCrib) ? 'attackingCrib' : 'idle';
                }.bind(this)
            });
            this.walk_spritesheet = SpriteSheet.new(images.enemy_walk, {
                frames: [200, 200],
                x: 0,
                y: 0,
                width: 136 / 2,
                height: 72,
                restart: true,
                autoPlay: true
            });
            this.jump_spritesheet = SpriteSheet.new(images.enemy_jump, {
                frames: [40, 70, 200, 70, 40],
                x: 0,
                y: 0,
                width: 340 / 5,
                height: 72,
                restart: false,
                autoPlay: false,
                callback: this.reset.bind(this)
            });
            this.attack_spritesheet = SpriteSheet.new(images.enemy_attack, {
                frames: [1700, 300],
                x: 0,
                y: 0,
                width: 136 / 2,
                height: 72,
                restart: false,
                autoPlay: false
            });
            this.state = 'idle';
        }
        hurt(direction) {
            this.playerDamage = 0;
            this.state = 'hurt';
            this.shaker.shake();
            this.action = new TimedAction(20, function() {
                //hmm this one is not neccessary
                this.reset();
            }.bind(this))
            this.movement.x = direction.x * 8;
            this.movement.y = direction.y * 8;
            this.chasingPlayer = true;
            this.hp--;
            if (this.hp <= 0) this.destroy();
        }
        reset() {
            this.action = null;
            this.playerDamage = 1;
            this.state = 'idle';
        }
        prepareForJump() {
            this.state = 'preparing';
            var angle = game.getAngle({x: this.hitbox.x - game.player.hitbox.x, y: this.hitbox.y - game.player.hitbox.y})
            var jumpX = Math.cos(angle) * -20;
            var jumpY = Math.sin(angle) * -20;
            this.action = new TimedAction(700, function() {
                this.reset();
                var sounds = [
                    'jump1',
                    'jump2',
                    'jump3',
                ]
                var selectedSound = sounds[Math.floor(Math.random() * 3)];
                game.playSound(selectedSound)
                this.state = 'jumping';
                this.movement.x = jumpX;
                this.movement.y = jumpY;
                this.jump_spritesheet.stop();
                this.jump_spritesheet.play();
            }.bind(this))
        }
        tick() {
            this.shaker.tick();
            this.spawn_spritesheet.tick();
            this.walk_spritesheet.tick();
            this.jump_spritesheet.tick();
            this.attack_spritesheet.tick();

            if (!this.spawnDone) return;

            if (Math.abs(this.movement.x) > 0.2 || Math.abs(this.movement.y) > 0.2) {
                //Enemy is sliding across the floor
                this.movement.x = this.movement.x * 0.94;
                this.movement.y = this.movement.y * 0.94;
                var attemptedHitBox = {
                    x: this.hitbox.x + this.movement.x,
                    y: this.hitbox.y + this.movement.y,
                    width: this.hitbox.width,
                    height: this.hitbox.height,
                }
                this.game.attemptMove(this, attemptedHitBox);
                return;
            } else {
                this.movement.x = 0;
                this.movement.y = 0;
            }

            if (this.action) {
                this.action.tick();
                return;
            }

            if (this.state === 'idle' && game.distance(this.hitbox, game.player.hitbox) < 200) {
                this.chasingPlayer = true;
            }
            if (this.state === 'preparing') {
                return;
            } else if (this.state === 'attackingCrib') {
                this.resolveAttackCrib();
            } else {
                if (this.chasingPlayer) {
                    if (game.distance(this.hitbox, game.player.hitbox) < 220) {
                        this.prepareForJump();
                    } else {
                        this.resolveChasePlayer();
                    }
                }
            }
        }
        resolveAttackCrib() {
            if (game.distance(this.hitbox, game.crib.hitbox) < 80) {
                if (this.action) return;
                this.attack_spritesheet.stop();
                this.attack_spritesheet.play();

                this.action = new TimedAction(2000, function() {
                    this.reset();
                    this.state = 'attackingCrib';
                    game.crib.damage();
                }.bind(this))
            } else {
                var angle = game.getAngle({x: this.hitbox.x - game.crib.hitbox.x, y: this.hitbox.y - game.crib.hitbox.y})
                var movementX = Math.cos(angle) * -2;
                var movementY = Math.sin(angle) * -2;
                var attemptedHitBox = {
                    x: this.hitbox.x + movementX,
                    y: this.hitbox.y + movementY,
                    width: this.hitbox.width,
                    height: this.hitbox.height,
                }
                this.game.attemptMove(this, attemptedHitBox);
            }
        }
        resolveChasePlayer() {
            var angle = game.getAngle({x: this.hitbox.x - game.player.hitbox.x, y: this.hitbox.y - game.player.hitbox.y})
            var movementX = Math.cos(angle) * -2;
            var movementY = Math.sin(angle) * -2;
            var attemptedHitBox = {
                x: this.hitbox.x + movementX,
                y: this.hitbox.y + movementY,
                width: this.hitbox.width,
                height: this.hitbox.height,
            }
            this.game.attemptMove(this, attemptedHitBox);
        }
        draw3d(context) {
            if (!this.isColliding) context.globalAlpha = 0.5;

            if (this.state === 'hurt') this.shaker.renderShake(context);

            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.enemy_shadow.height + 20)
            context.drawImage(images.enemy_shadow, 0, 0);
            context.restore();

            switch (this.state) {
                case 'preparing':
                    this.draw3dPreparing(context);
                break;
                case 'jumping':
                    this.draw3dJumping(context);
                break;
                case 'idle':
                    if (this.chasingPlayer) {
                        this.draw3dRunning(context)
                    } else {
                        this.draw3dSpawning();
                    }
                break;
                case 'hurt':
                    this.draw3dHurt(context)
                break;
                case 'attackingCrib':
                    if (game.distance(this.hitbox, game.crib.hitbox) < 80) {
                        this.draw3dAttack(context)
                    } else {
                        this.draw3dRunning(context)
                    }

                break;
            }

            if (this.state === 'hurt') this.shaker.restore(context);
            context.globalAlpha = 1;
        }
        draw3dRunning() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.enemy_walk.height + 20)
            this.walk_spritesheet.draw(context);
            context.restore();
        }
        draw3dSpawning() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.enemy_sleep.height + 20)
            this.spawn_spritesheet.draw(context);
            context.restore();
        }
        draw3dJumping() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.enemy_jump.height + 20)
            this.jump_spritesheet.draw(context);
            context.restore();
        }
        draw3dAttack() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.enemy_attack.height + 20)
            this.attack_spritesheet.draw(context);
            context.restore();
        }
        draw3dPreparing() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.drawImage(images.enemy_preparing, screenPos.x, screenPos.y - images.enemy_preparing.height + 20);
        }
        draw3dHurt() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.drawImage(images.enemy_hurt, screenPos.x, screenPos.y - images.enemy_hurt.height + 20);
        }
    }

    class TextSwitcher {
        constructor() {
            this.idx = 0;
            this.texts = {
                before: [
                    [
                        images.text1,
                        images.text2,
                        images.text3
                    ],
                    [
                        images.text7,
                        images.text8,
                        images.text9
                    ],
                    [
                        images.text13,
                        images.text14,
                        images.text15
                    ],
                    [
                        images.text19,
                        images.text20,
                        images.text21
                    ]
                ],
                during: [
                    images.text4,
                    images.text10,
                    images.text16,
                    images.text22,
                ],
                after: [
                    images.text5,
                    images.text11,
                    images.text17,
                    images.text23,
                ]
            }
            this.counter = 0;
        }
        preFight() {
            this.idx = -1;
            this.counter = 0;
        }
        afterFight() {
            this.idx = 1000;
            this.counter = 0;
        }
        tick() {
            this.counter++;
            if (this.idx === -1) {
                //during
                if (this.counter > 200) {
                    this.idx = 999;
                }
            } else if (this.idx === 1000) {
                //after fight
                if (this.counter > 200) {
                    this.counter = 0;
                    this.idx = 1001;
                    game.fadeoutAndShowText();
                }
            } else {
                //before fight
                if (this.counter > 270 && this.idx < this.texts.before[game.levelIdx].length - 1) {
                    this.counter = 0;
                    this.idx++;
                }
            }
        }
        renderText(context, pos) {
            if (this.idx === 999 || this.idx === 1001) return;

            if (this.idx === -1) {
                context.drawImage(this.texts.during[game.levelIdx], pos.x, pos.y);
            } else if (this.idx === 1000) {
                context.drawImage(this.texts.after[game.levelIdx], pos.x, pos.y);
            } else {
                context.drawImage(this.texts.before[game.levelIdx][this.idx], pos.x, pos.y);
            }
        }
    }

    class Player extends GameObject {
        constructor(config) {
            super(config);
            this.color = "#cccccc"
            this.name = "Player"
            this.state = 'idle';
            this.action = null;
            this.previousDirectionX = 1;
            this.previousDirectionY = 0;
            this.hp = 10;
            this.textSwitcher = new TextSwitcher();
            this.movement = {
                x: 0,
                y: 0
            }
            this.immunityTimer = null;
            this.hasReleasedButton = false;

            this.walk_spritesheet = SpriteSheet.new(images.player_walk, {
                frames: [200, 200],
                x: 0,
                y: 0,
                width: 136 / 2,
                height: 84,
                restart: true,
                autoPlay: true
            });
            this.swing_spritesheet = SpriteSheet.new(images.player_swing, {
                frames: [200, 200],
                x: 0,
                y: 0,
                width: 136 / 2,
                height: 84,
                restart: false,
                autoPlay: false,
                callback: this.reset.bind(this)
            });
            this.idle_spritesheet = SpriteSheet.new(images.player_idle, {
                frames: [400, 400],
                x: 0,
                y: 0,
                width: 136 / 2,
                height: 84,
                restart: true,
                autoPlay: true
            });
            this.die_spritesheet = SpriteSheet.new(images.player_die, {
                frames: [400, 400, 400, 400],
                x: 0,
                y: 0,
                width: 256 / 4,
                height: 84,
                restart: false,
                autoPlay: false
            });
        }
        hurt(dmg) {
            if (dmg === 0) return;
            this.hp--;
            this.isColliding = false;
            this.immunityTimer = new TimedAction(1000, function() {
                this.isColliding = true;
            }.bind(this))
            this.game.screenShaker.shake();
            if (this.hp <= 0) {
                this.die_spritesheet.play();
                game.gameOver();
            }
        }
        reset() {
            this.action = null;
            this.isColliding = true;
            this.state = 'idle';
        }
        punch() {
            game.playSound('swing');
            this.state = 'punch';
            this.swing_spritesheet.stop();
            this.swing_spritesheet.play();
            this.movement.x = this.previousDirectionX * 30;
            this.movement.y = this.previousDirectionY * 30;
            var punchConfig = {
                hitbox: {
                    x: this.hitbox.x + (this.previousDirectionX * TILE_SIZE),
                    y: this.hitbox.y + (this.previousDirectionY * TILE_SIZE),
                    width: this.hitbox.width,
                    height: this.hitbox.height,
                },
                direction: {
                    x: this.previousDirectionX,
                    y: this.previousDirectionY
                },
                game: game
            }
            gameObjects.push(new Punch(punchConfig));
        }
        setDirection(x, y) {
            if (x === 0 && y === 0) return;
            this.previousDirectionX = x;
            this.previousDirectionY = y;
        }
        tick(delta) {
            this.textSwitcher.tick();
            this.walkedThisTick = false;
            this.swing_spritesheet.tick();
            this.idle_spritesheet.tick();
            this.die_spritesheet.tick();
            
            if (this.hp <= 0) return;

            var pad = userInput.getInput(0);
            debugWriteButtons(pad);
            this.setDirection(pad.axes[0], pad.axes[1]);

            this.immunityTimer && this.immunityTimer.tick();


            if (this.action) {
                this.action.tick();
                return;
            }
            if (Math.abs(this.movement.x) < 0.05 && Math.abs(this.movement.y) < 0.05) {
                this.movement.x = 0;
                this.movement.y = 0;
            } else {
                this.move();
                return;
            }
            this.color = "#cccccc";

            (game.calm) ? this.handleCalm(pad, delta) : this.handleUserInput(pad, delta);
        }
        handleCalm(pad, delta) {
            this.handleArrows(pad, delta, 10)
        }
        handleArrows(pad, delta, speed) {
            var xDelta = pad.axes[0] * delta / speed;
            var yDelta = pad.axes[1] * delta / speed;

            if (Math.abs(xDelta) > 0.01 || Math.abs(yDelta) > 0.01) this.walkedThisTick = true;

            this.walk_spritesheet.tick((Math.abs(xDelta) + Math.abs(yDelta)) * 10);
            var attemptedHitBox = {
                x: this.hitbox.x + xDelta,
                y: this.hitbox.y + yDelta,
                width: this.hitbox.width,
                height: this.hitbox.height,
            }
            this.game.attemptMove(this, attemptedHitBox);
        }
        handleUserInput(pad, delta) {
            if (pad.buttons[2].pressed === false && this.hasReleasedButton === false) {
                this.hasReleasedButton = true;
            }
            if (pad.buttons[2].pressed && this.hasReleasedButton) {
                this.hasReleasedButton = false;
                this.punch();
            } else {
                this.handleArrows(pad, delta, 3);
            }
        }
        move() {
            this.movement.x = this.movement.x * 0.65;
            this.movement.y = this.movement.y * 0.65;
            var attemptedHitBox = {
                x: this.hitbox.x + this.movement.x,
                y: this.hitbox.y + this.movement.y,
                width: this.hitbox.width,
                height: this.hitbox.height,
            }
            this.game.attemptMove(this, attemptedHitBox);
        }
        draw3d(context) {
            if (!this.isColliding) context.globalAlpha = 0.5;

            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.player_shadow.height + 26)
            context.drawImage(images.player_shadow, 0, 0);
            context.restore();
            if (this.hp <= 0) {
                this.draw3dDie();
            } else if (this.state === 'idle') {
                (this.walkedThisTick) ? this.draw3dWalking() : this.draw3dIdle();
            } else if (this.state === 'punch') {
                this.draw3dSwing();
            }
            context.globalAlpha = 1;
        }
        draw3dDie() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.player_idle.height + 20)
            this.die_spritesheet.draw(context);
            context.restore();
        }
        draw3dMask(context) {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x - 110, screenPos.y - 180)
            context.drawImage(images.player_light, 0, 0)
            context.restore();
        }
        draw3dTextoverlay() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            screenPos.x = screenPos.x - 540;
            screenPos.y = screenPos.y + 10;
            this.textSwitcher.renderText(context, screenPos)
        }
        draw3dIdle() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.player_idle.height + 20)
            if (this.previousDirectionX > 0) {
                context.scale(-1, 1)
                context.translate(-TILE_SIZE, 0)
            }
            this.idle_spritesheet.draw(context);
            context.restore();
        }
        draw3dSwing() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.player_swing.height + 20)
            if (this.previousDirectionX > 0) {
                context.scale(-1, 1)
                context.translate(-TILE_SIZE, 0)
            }
            this.swing_spritesheet.draw(context);
            context.restore();
        }
        draw3dWalking() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.player_walk.height + 20)
            if (this.previousDirectionX > 0) {
                context.scale(-1, 1)
                context.translate(-TILE_SIZE, 0)
            }
            this.walk_spritesheet.draw(context);
            context.restore();
        }
    }

    class Punch extends GameObject {
        constructor(config) {
            super(config);
            this.color = "#00FF00"
            this.name = "Punch"
            this.counter = new TimedAction(300, function() {
                this.destroy();
            }.bind(this));
            this.movement = {
                x: this.direction.x * 15,
                y: this.direction.y * 15,
            }
        }
        tick() {
            this.counter.tick();
            this.movement.x = this.movement.x * 0.8;
            this.movement.y = this.movement.y * 0.8;
            var attemptedHitBox = {
                    x: this.hitbox.x + this.movement.x,
                    y: this.hitbox.y + this.movement.y,
                    width: this.hitbox.width,
                    height: this.hitbox.height,
                }
            this.game.attemptMove(this, attemptedHitBox);
        }
        draw3d(context) {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.drawImage(images.weapon_swing, screenPos.x, screenPos.y - images.weapon_swing.height + 20);
        }
    }

    const delta = 1.0/144;

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    game.loadLevel = function() {
        _.each(level.getLevel(game.levelIdx), function(row, rowIdx) {
          _.each(row, function(column, colIdx) {
            switch(column) {
              case 1:
                game.player = new Player({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    game: game,
                });
                gameObjects.push(game.player);
              break;
              case 2:
                var tile = new Tile({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    game: game,
                });
                gameObjects.push(tile);
              break;
              case 5:
                game.theSwitch = new Switch({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    game: game,
                });
                gameObjects.push(game.theSwitch);
              break;
              case 6:
                game.ceilinglamp = new Lightsource({
                    hitbox: {
                        x: 40 * 4,
                        y: 21 * 4,
                        width: null,
                        height: null
                    },
                    imageLight: images.ceilinglamp_cone,
                    imageDark: images.ceilinglamp_full,
                    game: game,
                });
                gameObjects.push(game.ceilinglamp);
              break;
              case 7:
                var lamp = new Decor({
                    hitbox: {
                        x: 66 * 4,
                        y: 11 * 4,
                        width: null,
                        height: null
                    },
                    image: images.ceilinglamp,
                    game: game,
                });
                gameObjects.push(lamp);
              break;
              case 9:
                game.crib = new Crib({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    game: game,
                });
                gameObjects.push(game.crib);
              break;
            }
          })
      })
    }

    game.loadEnemies = function() {
        _.each(level.getLevel(game.levelIdx), function(row, rowIdx) {
          _.each(row, function(column, colIdx) {
            switch(column) {
              /*case 3:
                var enemy = new Enemy({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    attackingCrib: false,
                    game: game,
                });
                gameObjects.push(enemy);
              break;
              case 4:
                var enemy = new Enemy({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    attackingCrib: true,
                    game: game,
                });
                gameObjects.push(enemy);
              break;*/
              case "a":
                var spawner = new Spawner({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    game: game,
                });
                gameObjects.push(spawner);
              break;
            }
          })
      })
    }

    game.init = function(level, playSound) {
        gameObjects = [];
        game.calm = true;
        game.beforeFight = true;
        game.levelIdx = level;
        game.playSound = playSound;
        game.loadLevel();
        game.screenShaker = new ScreenShaker();
        game.fader = new Fader();
        game.fader.fadeIn();
        game.playSound('music_intro', false, true)
        game.playSound('music_ending', true)

        game.offscreenCanvas = document.createElement('canvas');
        game.offscreenCanvas.width = 800;
        game.offscreenCanvas.height = 600;
        game.offscreenContext = game.offscreenCanvas.getContext('2d');

        game.superGameOver = false;
        game.banishCounter = 0;
        game.canSkipGameOverScreen = false;
    }

    game.destroy = function() {
        game.fader = null;
        game.calm = null;
        game.betweenText = null;
        game.ceilinglamp = null;
        game.crib = null;
        game.hasReleasedButton = null;
        game.player = null;
        game.screenShaker = null;
        game.beforeFight = null;
        game.superGameOver = null;
        game.ironMaiden = null;
        game.banishCounter = null;
        game.canSkipGameOverScreen = null;
    }

    window.game = game

    return {
        init: game.init,
        tick: function(delta) {
            game.banishCounter++;

            game.fader.tick();
            game.ironMaiden && game.ironMaiden.tick();
            game.betweenText && game.betweenText.tick();

            if (game.endCondition('gameover') && game.canSkipGameOverScreen) {
                var pad = userInput.getInput(0);
                if (pad.buttons[2].pressed || Math.abs(pad.axes[0]) > 0 || Math.abs(pad.axes[1]) > 0 ) {
                    game.init(0, game.playSound);
                }
            }

            if (game.endCondition() === 'false') {
                _.each(gameObjects, function(gameObject) {
                    gameObject.tick(delta);
                });
            } else {
                game.player.tick(delta);
            }

            gameObjects = _.filter(gameObjects, function(gameObject) {
                return !gameObject.markedForRemoval;
            });

            gameObjects = _.sortBy(gameObjects, (obj) => {
                return obj.hitbox.y;
            })

            game.screenShaker.render(context);

            context.drawImage(images['background' + game.levelIdx], 0, 0);

            if (!DEBUG_NO_2D) {
                context.save();
                context.translate(0 - TILE_SIZE, (46 * 4) - (TILE_SIZE / 2));
                context.transform(1, 0, 0.25, 0.5, 0, 0);
                //context.scale(4,4)
                _.each(gameObjects, function(gameObject) {
                    gameObject.draw2d(context);
                });
                context.restore();
            }

            game.ironMaiden && game.ironMaiden.draw()

            context.save()
            context.translate(0 - TILE_SIZE, (46 * 4) - (TILE_SIZE / 2));

            _.each(gameObjects, function(gameObject) {
                gameObject.drawFloor(context);
            });

            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d(context);
            });

            context.restore();

            _.each(gameObjects, function(gameObject) {
                gameObject.drawDecor(context);
            });

            game.offscreenContext.fillStyle = "black";
            game.offscreenContext.fillRect(0, 0, 800, 600);

            game.offscreenContext.save()
            game.offscreenContext.translate(0 - TILE_SIZE, (46 * 4) - (TILE_SIZE / 2));
            _.each(gameObjects, function(gameObject) {
                gameObject.draw3dMask(game.offscreenContext);
            });
            game.offscreenContext.restore();
            _.each(gameObjects, function(gameObject) {
                gameObject.drawMask(game.offscreenContext);
            });

            context.globalCompositeOperation = 'darken';
            context.globalAlpha = (game.calm) ? 0.5 : 0.9;
            if (!game.ironMaiden)
                context.drawImage(game.offscreenCanvas, 0, 0)
            context.globalAlpha = 1;

            context.globalCompositeOperation = 'source-over';

            game.offscreenContext.save()
            game.offscreenContext.translate(0 - TILE_SIZE, (46 * 4) - (TILE_SIZE / 2));
            _.each(gameObjects, function(gameObject) {
                gameObject.draw3dTextoverlay(game.offscreenContext);
            });
            game.offscreenContext.restore();

            game.screenShaker.restore(context);

            if (!game.calm) {
                context.fillStyle = "black"
                context.fillRect(0, 0, 800, 60)

                context.fillStyle = "white"
                context.fillRect(20, 20, 300, 30)
                context.fillStyle = "black"
                context.fillRect(22, 22, 296, 26)
                context.fillStyle = "blue"
                context.fillRect(24, 24, (game.crib.hp / 15) * 292, 22)

                context.fillStyle = "white"
                context.fillRect(320 + 20, 20, 300, 30)
                context.fillStyle = "black"
                context.fillRect(320 + 22, 22, 296, 26)
                context.fillStyle = "red"
                context.fillRect(320 + 24, 24, (game.player.hp / 10) * 292, 22)
            }

            var fade = game.fader.getFade();
            if (fade !== 0) {
                context.globalAlpha = fade;
                context.fillStyle = "black";
                context.fillRect(0,0,canvas.width, canvas.height)
                context.globalAlpha = 1;
            }
            if (game.endCondition() === 'gameover') {
                context.drawImage(images.gameover, 102, 228);
            }

            game.betweenText && game.betweenText.draw(context);

            if (game.superGameOver && game.banishCounter > 360) {
                context.drawImage(images.banish, 30, 10)
            }
        }
    }
});