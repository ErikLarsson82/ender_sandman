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
    
    const TILE_SIZE = 14;
    let gameObjects = [];
    var game = {}
    window.game = game;

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
            tile.test();
            player.test();
        }

        if (game.isOfTypes(collider, collidee, Player, Enemy)) {
            var enemy = game.getOfType(collider, collidee, Enemy);
            var player = game.getOfType(collider, collidee, Player);
            enemy.immune();
            player.hurt();
        }
    }

    game.detectHits = function(who, hitbox) {
        return _.filter(gameObjects, function(item) {
            if (!item.hitbox) {
                console.error("Dimensions not found on item");
                return false;
            }
            if (item === who) return;

            var itemIsDynamic = !item.isStatic;

            const condition1 = hitbox.x + hitbox.width > item.hitbox.x;
            const condition2 = hitbox.x < item.hitbox.x + item.hitbox.width;
            const condition3 = hitbox.y + hitbox.height > item.hitbox.y;
            const condition4 = hitbox.y < item.hitbox.y + item.hitbox.height;

            // Who is always dynamic
            // Condiftion 5 is true if who is colliding and that is colliding with a dynamic
            const subCondition5 = who.isColliding && itemIsDynamic;
            const subCondition6 = item.isStatic;

            const condition5 = (subCondition5 || subCondition6)
            //console.log(who.name, item.name, condition5);
            return (condition1 && condition2 && condition3 && condition4 && condition5);
        });
    }

    game.findGameObj = function(klass) {
        return _.find(gameObjects, function(item) {
            return item instanceof klass;
        });
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
            this.color = config.color || "#444444";
            this.markedForRemoval = false;
            this.isColliding = true;
            this.isStatic = false;
            this.name = "Gameobject";
        }
        tick() {

        }
        draw2d() {
            context.fillStyle = this.color;
            context.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
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
        test() {
            //console.log('tile collide');
        }
    }

    class Enemy extends GameObject {
        constructor(config) {
            super(config);
            this.name = "Enemy"
        }
        immune() {
            this.isColliding = false;
        }
        tick() {
            var attemptedHitBox = {
                x: this.hitbox.x + 1,
                y: this.hitbox.y + 1,
                width: this.hitbox.width,
                height: this.hitbox.height,
            }
            this.game.attemptMove(this, attemptedHitBox);
        }
    }

    class Player extends GameObject {
        constructor(config) {
            super(config);
            this.color = "#cccccc"
            this.name = "Player"
        }
        test() {
            this.color = "#ff0000"
        }
        hurt() {
            console.log('i got hurt!!');
        }
        tick(delta) {
            return;
            this.color = "#cccccc"
            var pad = userInput.getInput(0);
            debugWriteButtons(pad);
            
            var attemptedHitBox = {
                x: this.hitbox.x + pad.axes[0] * delta / 10,
                y: this.hitbox.y + pad.axes[1] * delta / 10,
                width: this.hitbox.width,
                height: this.hitbox.height,
            }
            this.game.attemptMove(this, attemptedHitBox);
        }
        draw3d() {
            //var pos = { x: Math.round(this.hitbox.x), y: Math.round(this.hitbox.y) }
            //this.sprite.draw(context, pos);
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
                //context.transform(1, 0, 0.25, 0.5, 0, 0);
                _.each(gameObjects, function(gameObject) {
                    gameObject.draw2d();
                });
                context.restore();
            }

            _.each(gameObjects, function(gameObject) {
                gameObject.draw3d();
            });

            context.restore();
        }
    }
});