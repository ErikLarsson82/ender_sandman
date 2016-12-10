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
    var DEBUG_NO_2D = false;
    var DEBUG_KEYBOARD = false;
    
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
            player.hurt();
        }

        if (game.isOfTypes(collider, collidee, Enemy, Punch)) {
            var enemy = game.getOfType(collider, collidee, Enemy);
            var punch = game.getOfType(collider, collidee, Punch);
            enemy.hurt(punch.direction);
            punch.isColliding = false;
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

    class Crib extends GameObject {
        constructor(config) {
            super(config);
            this.isStatic = true;
            this.name = "Crib";
            this.hp = 15;
        }
        damage() {
            this.hp--;
        }
        draw() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.drawImage(images.crib, screenPos.x, screenPos.y - images.crib.height + 20);
        }
    }

    class Enemy extends GameObject {
        constructor(config) {
            super(config);
            this.name = "Enemy"
            this.recover = null;
            this.hp = 5;
            this.movement = { x: 0, y: 0 };
            this.walk_spritesheet = SpriteSheet.new(images.enemy_walk, {
                frames: [200, 200],
                x: 0,
                y: 0,
                width: 136 / 2,
                height: 36,
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
        immune() {
            
        }
        hurt(direction) {
            this.isColliding = false;
            this.recover = new TimedAction(1000, function() {
                this.reset();
            }.bind(this))
            this.movement.x = direction.x * 14;
            this.movement.y = direction.y * 14;
            this.chasingPlayer = true;
            this.hp--;
            if (this.hp <= 0) this.destroy();
        }
        reset() {
            this.recover = null;
            this.isColliding = true;
            this.state = 'idle';
        }
        prepareForJump() {
            this.state = 'preparing';
            var angle = game.getAngle({x: this.hitbox.x - game.player.hitbox.x, y: this.hitbox.y - game.player.hitbox.y})
            var jumpX = Math.cos(angle) * -20;
            var jumpY = Math.sin(angle) * -20;
            this.recover = new TimedAction(2000, function() {
                this.reset();
                this.state = 'jumping';
                this.movement.x = jumpX;
                this.movement.y = jumpY;
                this.jump_spritesheet.stop();
                this.jump_spritesheet.play();
            }.bind(this))
        }
        tick() {
            this.walk_spritesheet.tick();
            this.jump_spritesheet.tick();
            this.attack_spritesheet.tick();
            this.recover && this.recover.tick();
            
            if (Math.abs(this.movement.x) > 0.1 || Math.abs(this.movement.y) > 0.1) {
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
                if (this.recover) return;
                this.attack_spritesheet.stop();
                this.attack_spritesheet.play();
                
                this.recover = new TimedAction(2000, function() {
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
                    }
                break;
                case 'attackingCrib':
                    this.draw3dAttack(context)
                break;
            }

            context.globalAlpha = 1;
        }
        draw3dRunning() {
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.save();
            context.translate(screenPos.x, screenPos.y - images.enemy_walk.height + 20)
            this.walk_spritesheet.draw(context);
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
    }

    class Player extends GameObject {
        constructor(config) {
            super(config);
            this.color = "#cccccc"
            this.name = "Player"
            this.action = null;
            this.previousDirectionX = 1;
            this.previousDirectionY = 0;
            this.hp = 10;
            this.movement = {
                x: 0,
                y: 0
            }
        }
        hurt() {
            this.hp--;
            this.movement.x = 0;
            this.movement.y = 0;
            this.isColliding = false;
            this.action = new TimedAction(1000, function() {
                this.reset();
            }.bind(this))
        }
        reset() {
            this.action = null;
            this.isColliding = true;
        }
        punch() {
            this.movement.x = this.previousDirectionX * 50;
            this.movement.y = this.previousDirectionY * 50;
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
            var pad = userInput.getInput(0);
            debugWriteButtons(pad);
            this.setDirection(pad.axes[0], pad.axes[1]);

            if (this.action) {
                this.action.tick();
                return;
            }
            if (Math.abs(this.movement.x) < 0.1 && Math.abs(this.movement.y) < 0.1) {
                this.movement.x = 0;
                this.movement.y = 0;
            } else {
                this.move();
                return;
            }
            this.color = "#cccccc"

            if (pad.buttons[2].pressed) {
                this.punch();
            } else {
                var attemptedHitBox = {
                    x: this.hitbox.x + pad.axes[0] * delta / 3,
                    y: this.hitbox.y + pad.axes[1] * delta / 3,
                    width: this.hitbox.width,
                    height: this.hitbox.height,
                }
                this.game.attemptMove(this, attemptedHitBox);
            }
            
        }
        move() {
            this.movement.x = this.movement.x * 0.5;
            this.movement.y = this.movement.y * 0.5;
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
            context.drawImage(images.dad, screenPos.x + 4, screenPos.y - images.dad.height + 20);
            context.globalAlpha = 1;
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
            context.drawImage(images.punch, screenPos.x, screenPos.y - images.punch.height + 20);
        }
    }

    const delta = 1.0/144;

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    function loadLevel() {
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

    return {
        init: function() {
            loadLevel();
        },
        tick: function(delta) {

            _.each(gameObjects, function(gameObject) {
                gameObject.tick(delta);
            });
            
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

            context.save()
            context.translate(0 - TILE_SIZE, (46 * 4) - (TILE_SIZE / 2));
                
            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d(context);
            });

            context.restore();
        }
    }
});