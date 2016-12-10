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
    var DEBUG_KEYBOARD = false;
    
    const TILE_SIZE = 14 * 4;
    var gameObjects = [];
    var game = {
        calm: true,
    }
    
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
        if (game.calm === false && game.crib.safe === true && game.countEnemies() <= 0) return 'win';

        return 'false';
    }

    game.countEnemies = function() {
        return _.filter(gameObjects, function(item) {
            return (item instanceof Enemy);
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
        if (game.isOfTypes(collider, collidee, Player, Tile)) {
            var tile = game.getOfType(collider, collidee, Tile);
            var player = game.getOfType(collider, collidee, Player);
            //tile.test();
            //player.test();
        }

        if (game.isOfTypes(collider, collidee, Player, Enemy)) {
            var enemy = game.getOfType(collider, collidee, Enemy);
            var player = game.getOfType(collider, collidee, Player);
            //enemy.immune();
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
            if (game.countEnemies() === 0) {
                game.crib.safeTouch();
                game.safeKiddo = new SafeKiddo();
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
            console.log(e.keyCode);
            if (e.keyCode === 67) {
                scroller.active = true;
            }
        })
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
        draw3d() {

        }
    }

    class Tile extends GameObject {
        constructor(config) {
            super(config);
            this.isStatic = true;
            this.name = "Tile";
        }
    }

    class SafeKiddo {
        constructor() {
            this.x = 70;
            this.y = 250;
        }
        draw(context) {
            context.drawImage(images.safe_kiddo, this.x, this.y);
        }
    }

    class GoodNight {
        constructor() {
            this.x = 191;
            this.y = 312;
        }
        draw(context) {
            context.drawImage(images.goodnight_text, this.x, this.y);
        }
    }

    class Crib extends GameObject {
        constructor(config) {
            super(config);
            this.isStatic = true;
            this.name = "Crib";
            this.hp = 15;
            this.crib_spritesheet = SpriteSheet.new(images.crib, {
                frames: [4000, 200, 200],
                x: 0,
                y: 0,
                width: 372 / 3,
                height: 80,
                restart: true,
                autoPlay: true
            });
            this.safe = false;
        }
        safeTouch() {
            this.safe = true;
        }
        damage() {
            this.hp--;
        }
        tick() {
            this.crib_spritesheet.tick();
        }
        draw3d() {
            //var screenPos = game.convertToScreenCoordinates(this.hitbox)
            //context.drawImage(images.crib, screenPos.x - 50, screenPos.y - 50);
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x - 50, screenPos.y - 50)
            this.crib_spritesheet.draw(context);
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
            this.state = (config.attackingCrib) ? 'attackingCrib' : 'idle';
            this.chasingPlayer = false;
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
                this.state = 'jumping';
                this.movement.x = jumpX;
                this.movement.y = jumpY;
                this.jump_spritesheet.stop();
                this.jump_spritesheet.play();
            }.bind(this))
        }
        tick() {
            this.shaker.tick();
            this.walk_spritesheet.tick();
            this.jump_spritesheet.tick();
            this.attack_spritesheet.tick();
            
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
                        this.draw3dSleeping();
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
        draw3dSleeping() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.enemy_sleep.height + 20)
            context.drawImage(images.enemy_sleep, 0, 0)
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
        }
        hurt(dmg) {
            if (dmg === 0) return;
            this.hp--;
            this.isColliding = false;
            this.immunityTimer = new TimedAction(1000, function() {
                this.isColliding = true;
            }.bind(this))
        }
        reset() {
            this.action = null;
            this.isColliding = true;
            this.state = 'idle';
        }
        punch() {
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
            this.walkedThisTick = false;
            this.swing_spritesheet.tick();
            this.idle_spritesheet.tick();

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

            (game.calm) ? this.handleCalm(pad) : this.handleUserInput(pad, delta);
        }
        handleCalm(pad) {
            if (pad.buttons[2].pressed) {
                game.loadEnemies();
                game.calm = false;
                game.goodnightText = null;
                this.hasReleasedButton = false;
            }
        }
        handleUserInput(pad, delta) {
            if (pad.buttons[2].pressed === false && this.hasReleasedButton === false) {
                this.hasReleasedButton = true;
            }
            if (pad.buttons[2].pressed && this.hasReleasedButton) {
                this.hasReleasedButton = false;
                this.punch();
            } else {
                var xDelta = pad.axes[0] * delta / 3;
                var yDelta = pad.axes[1] * delta / 3;
                
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
            if (this.state === 'idle') {
                (this.walkedThisTick) ? this.draw3dWalking() : this.draw3dIdle();
            } else if (this.state === 'punch') {
                this.draw3dSwing();
            }
            context.globalAlpha = 1;

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
        _.each(level.getLevel(), function(row, rowIdx) {
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
        _.each(level.getLevel(), function(row, rowIdx) {
          _.each(row, function(column, colIdx) {
            switch(column) {
              case 3:
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
              break;
            }
          })
      })
    }

    return {
        init: function() {
            game.loadLevel();
            game.goodnightText = new GoodNight();
        },
        tick: function(delta) {

            if (game.endCondition() === 'false') {
                _.each(gameObjects, function(gameObject) {
                    gameObject.tick(delta);
                });
            }
            
            gameObjects = _.filter(gameObjects, function(gameObject) {
                return !gameObject.markedForRemoval;
            });

            gameObjects = _.sortBy(gameObjects, (obj) => {
                return obj.hitbox.y;
            })

            context.drawImage(images.background, 0, 0);

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

            if (!game.calm) {
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
                
            context.save()
            context.translate(0 - TILE_SIZE, (46 * 4) - (TILE_SIZE / 2));
                
            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d(context);
            });

            context.restore();

            game.goodnightText && game.goodnightText.draw(context);
            game.safeKiddo && game.safeKiddo.draw(context);

            if (game.endCondition() === 'gameover') {
                context.drawImage(images.gameover, 102, 228);
            }
        }
    }
});