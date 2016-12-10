define('app/game', [
    'app/images',
    'underscore',
    'userInput',
    'SpriteSheet',
    'TimedAction',
    'utils'
], function (
    images,
    _,
    userInput,
    SpriteSheet,
    TimedAction,
    utils
) {    
    var DEBUG_WRITE_BUTTONS = false;
    var DEBUG_NO_2D = true;
    var DEBUG_KEYBOARD = false;
    
    let gameObjects = [];
    var game = {}
    window.game = game;

    game.detectHits = function(who, type) {
        return _.filter(gameObjects, function(item) {
            if (!item.hitbox) {
                console.error("Dimensions not found on item");
                return false;
            }
            if (item === who) return;

            const condition1 = who.hitbox.x + who.hitbox.width > item.hitbox.x;
            const condition2 = who.hitbox.x < item.hitbox.x + item.hitbox.width;
            const condition3 = who.hitbox.y + who.hitbox.height > item.hitbox.y;
            const condition4 = who.hitbox.y < item.hitbox.y + item.hitbox.height;
            const condition5 = item instanceof type;
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

    class Player extends GameObject {
        constructor(config) {
            super(config);
        }
        tick(delta) {
            var pad = userInput.getInput(this.id);
            debugWriteButtons(pad);
            
        }
        draw2d() {
            const colors = {
                Walking: "green",
                Punch: "red",
                Fall: "blue"

            }
            context.fillStyle = colors[this.state];
            context.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
        }
        draw3d() {
            //var pos = { x: Math.round(this.hitbox.x), y: Math.round(this.hitbox.y) }
            //this.sprite.draw(context, pos);
        }
    }

    const delta = 1.0/144;

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    return {
        init: function() {
            return;
            gameObjects.push(new Player({
                hitbox: {
                    x: 270,
                    y: 300,
                    width: 20,
                    height: 20
                },
                id: 0,
                game: game
            }));

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
                context.translate(200, 200)
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