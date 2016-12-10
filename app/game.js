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
    let gameObjects = [];
    var game = {}
    window.game = game;

    game.isInIgnoreFilter = function(mover, item) {
        var filter = [
            [Player, Punch],
            [Enemy, Enemy],
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
            x: pos.x + (pos.y * 0.25),
            y: pos.y / 2,
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

    class Enemy extends GameObject {
        constructor(config) {
            super(config);
            this.name = "Enemy"
            this.recover = null;
            this.movement = { x: 0, y: 0 };
        }
        immune() {
            this.isColliding = false;
            this.recover = new TimedAction(2000, function() {
                this.recover = null;
                this.isColliding = true;
            }.bind(this))
        }
        hurt(direction) {
            this.movement.x = direction.x * 20;
            this.movement.y = direction.y * 20;
            //this.destroy();
        }
        tick() {
            this.recover && this.recover.tick();
            
            if (Math.abs(this.movement.x) > 0.1 || Math.abs(this.movement.y) > 0.1) {
                //Enemy is sliding across the floor
                this.movement.x = this.movement.x * 0.9;
                this.movement.y = this.movement.y * 0.9;
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
            var attemptedHitBox = {
                x: this.hitbox.x,
                y: this.hitbox.y,
                width: this.hitbox.width,
                height: this.hitbox.height,
            }
            this.game.attemptMove(this, attemptedHitBox);
        }
        draw3d(context) {
            if (!this.isColliding) context.globalAlpha = 0.5;
            var screenPos = game.convertToScreenCoordinates(this.hitbox)
            context.drawImage(images.enemy, screenPos.x, screenPos.y - images.enemy.height + 20);
            context.globalAlpha = 1;
        }
    }

    class Player extends GameObject {
        constructor(config) {
            super(config);
            this.color = "#cccccc"
            this.name = "Player"
            this.recover = null;
            this.isBusy = false;
            this.previousDirectionX = 1;
            this.previousDirectionY = 0;
        }
        hurt() {
            this.isColliding = false;
            this.recover = new TimedAction(1000, function() {
                this.reset();
            }.bind(this))
        }
        reset() {
            this.recover = null;
            this.isColliding = true;
            this.isBusy = false;
        }
        punch() {
            this.isBusy = true;
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
            this.recover = new TimedAction(800, function() {
                this.reset();
            }.bind(this))
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
            
            this.recover && this.recover.tick();

            this.color = "#cccccc"

            if (pad.buttons[2].pressed) {
                if (this.isBusy) return;
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
        draw3d(context) {
            //var pos = { x: Math.round(this.hitbox.x), y: Math.round(this.hitbox.y) }
            //this.sprite.draw(context, pos);
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
            this.counter = new TimedAction(500, function() {
                this.destroy();
            }.bind(this));
        }
        tick() {
            this.counter.tick();
            var attemptedHitBox = {
                    x: this.hitbox.x,
                    y: this.hitbox.y,
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
                player = new Player({
                    hitbox: {
                        x: colIdx * TILE_SIZE,
                        y: rowIdx * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    },
                    game: game,
                });
                gameObjects.push(player);
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


            context.save()
            context.translate(0 - TILE_SIZE, (46 * 4) - (TILE_SIZE / 2));
                
            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d(context);
            });

            context.restore();
        }
    }
});