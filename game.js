function GameController(game, opts) {
  var options = opts || {},
      self = this;
  EmptyElement.call(this, opts);
  
  this.current = null;
  this.currentName = "";
  this.levels = {};
  this.add = function(name, lvl) {
    if (lvl instanceof GameLevel) {
      this.levels[name] = lvl;    
    }
  };
  
  this.score = 0;
  this.waves = 0;
  
  game.controllers.game = this;
  
  this.load = function(lvl, game, res) {
     if (lvl in this.levels) {
       this.reset(game);
       this.current = this.levels[lvl];
       this.currentName = lvl;
       this.waves = this.current.waves;
       
       for (var index = 0; index < this.current.elements.length; index += 2) {
         var cls = this.current.elements[index],
             args = this.current.elements[index + 1];
             
         game.add(new cls(args));         
       }
       
       game.provide(res);
     }
  };
  
  this.reset = function(game) {
    this.score = 0;
    this.waves = 0;
    game.elements.filter(function(element) {
      return [ WaveElement, NoteElement, TextElement, BlockerElement ].some(function(cls) {
        return element instanceof cls;
      });
    }).forEach(function(element) {
      game.remove(element);
    });
  };
  
  this.wasPressed = false;
  
  this.on('update', function(time, game) {
    var mouse = game.controllers.mouse;
    if (!this.wasPressed && mouse.pressed && this.waves > 0) {
      var isfree = game.get(BlockerElement).some(function(el) {
        return game.buffer.isPointInPath(el.path, mouse.x, mouse.y, 'evenodd');
      });
      
      if (!isfree) {
        var wave = new WaveElement({ brightness: 100, x: mouse.x, y: mouse.y, force: self.current.wavesPower, speed: self.current.wavesSpeed });
        wave.on('update', function(time, game) {
        
          if (this.alpha > 0) this.collidingWith(game, NoteElement, function(note) {
          
            note.hit(this.alpha, this, game, function(score) {
               self.score += score;
            });
          });
        });


        game.add(wave);
        this.waves--;
      
        this.wasPressed = true;
      }
    } else if (this.wasPressed && !game.controllers.mouse.pressed) {
      this.wasPressed = false;
    }
    
    if (32 in game.controllers.keyboard) {
      self.load.call(self, self.currentName, game, game.resources)
    }
    
    
    if (this.current !== null) {
      if (this.score >= this.current.score)
        self.load.call(self, self.current.nextLvl, game, game.resources);
      
    }
  });
  
  this.on('draw', function(ctx, game) {
    var mouse = game.controllers.mouse;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    var wavesLeft = (Math.PI * 2);
    if (self.current) wavesLeft *= (self.waves / self.current.waves);
    
    ctx.lineWidth = 2;
    ctx.arc(mouse.x, mouse.y, 5, 0, wavesLeft);
    ctx.moveTo(mouse.x, mouse.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.arc(mouse.x, mouse.y, 1, 0, Math.PI*2);
    ctx.stroke();
  });
}


var game = new Circles({ output: 'game-cont' }),
    gameController = new GameController(game, {}),
    background = new BackgroundElement({ hue: 5, saturation: 100, brightness: ZERO }),
    title = new TextElement({ brightness: 100, text: "circles", x: 100, y: 100 });

    new MouseController(game);
    new KeyboardController(game);

var lvl_start = new GameLevel({ score: 1, waves: 100, power: 25, next: '1', elements: [
                  FadingOutTextElement, { x: 50, y: 50, text: 'Circles', font: 'Minimal', fontSize: 50, step: 0.001, brightness: 100, update: function(time, game) { this.centerX(game); } },
                  TextElement, { x: 330, y: 270, text: 'This is a note.', font: 'Minimal', fontSize: 16, brightness: 100 }, 
                  NoteElement, { x: 320, y: 240, hits: 1, score: 1, resources: [ 'note1' ], brightness: 50, hue: 2, saturation: 100 }
                ] });
                
var lvl_1     = new GameLevel({ score: 5, waves: 5, power: 50, next: '2', elements: [
                  TextElement, { x: 200, y: 270, text: 'This is a pentatonic scale.', font: 'Minimal', fontSize: 16, brightness: 100 },
                  NoteElement, { x: 160, y: 240, hits: 1, score: 1, resources: [ 'note1' ], brightness: 50, hue: 0, saturation: 100 },
                  NoteElement, { x: 240, y: 240, hits: 1, score: 1, resources: [ 'note2' ], brightness: 50, hue: 15, saturation: 100 },
                  NoteElement, { x: 320, y: 240, hits: 1, score: 1, resources: [ 'note3' ], brightness: 50, hue: 30, saturation: 100 },
                  NoteElement, { x: 400, y: 240, hits: 1, score: 1, resources: [ 'note4' ], brightness: 50, hue: 45, saturation: 100 },
                  NoteElement, { x: 480, y: 240, hits: 1, score: 1, resources: [ 'note5' ], brightness: 50, hue: 60, saturation: 100 }
                ] });

var lvl_2     = new GameLevel({ score: 8, waves: 8, power: 50, speed: 100, next: '3', elements: [
                  BlockerElement, { x: 120, y: 200, width: 360, height: 80, alpha: 0.7, brightness: 10, hue: 0, saturation: 50, path: function(path, mode) {
                    mode.rectOut(path);
                  } },
                  TextElement, { x: 120, y: 300, text: 'No new waves allowed on the red field!', font: 'Minimal', fontSize: 16, brightness: 100 },
                  NoteElement, { x: 160, y: 240, hits: 1, score: 1, resources: [ 'note1' ], brightness: 50, hue: 0, saturation: 100 },
                  NoteElement, { x: 200, y: 240, hits: 1, score: 1, resources: [ 'note5' ], brightness: 50, hue: 60, saturation: 100 },
                  NoteElement, { x: 240, y: 240, hits: 1, score: 1, resources: [ 'note4' ], brightness: 50, hue: 45, saturation: 100 },
                  NoteElement, { x: 280, y: 240, hits: 1, score: 1, resources: [ 'note3' ], brightness: 50, hue: 30, saturation: 100 },
                  NoteElement, { x: 320, y: 240, hits: 1, score: 1, resources: [ 'note5' ], brightness: 50, hue: 60, saturation: 100 },
                  NoteElement, { x: 360, y: 240, hits: 1, score: 1, resources: [ 'note4' ], brightness: 50, hue: 45, saturation: 100 },
                  NoteElement, { x: 400, y: 240, hits: 1, score: 1, resources: [ 'note1' ], brightness: 50, hue: 0, saturation: 100 },
                  NoteElement, { x: 440, y: 240, hits: 1, score: 1, resources: [ 'note2' ], brightness: 50, hue: 15, saturation: 100 },
                  
                ] });
                
var lvl_3     = new GameLevel({ score: 4, waves: 4, power: 50, speed: 100, next: 'start', elements: [
                  BlockerElement, { x: 300, y: 220, radius: 20, fill: 'nonzero', alpha: 0.7, brightness: 10, hue: 0, saturation: 50, path: function(path, mode) {
                    mode.circleOut(path);
                  }, update: function(time, game) {
                    
                    var dx = game.controllers.mouse.x - this.x,
                        dy = game.controllers.mouse.y - this.y,
                        dist = Math.sqrt(dx*dx + dy*dy);
                        
                    if (dist > this.radius) {
                      dx /= Math.log10(dist);
                      dy /= Math.log10(dist);
                    
                      dx /= 3;
                      dy /= 3;
                    
                      this.x += dx;
                      this.y += dy;
                    } else {
                      this.x = game.controllers.mouse.x;
                      this.y = game.controllers.mouse.y;
                    }
                    
                    this.path = new Path2D();
                    this.paths.circleOut(this.path);
                  } },
                  NoteElement, { x: 40, y: 40, hits: 1, score: 1, resources: [ 'note1' ], brightness: 50, hue: 0, saturation: 100 },
                  NoteElement, { x: 600, y: 40, hits: 1, score: 1, resources: [ 'note5' ], brightness: 50, hue: 60, saturation: 100 },
                  NoteElement, { x: 40, y: 440, hits: 1, score: 1, resources: [ 'note4' ], brightness: 50, hue: 45, saturation: 100 },
                  NoteElement, { x: 600, y: 440, hits: 1, score: 1, resources: [ 'note3' ], brightness: 50, hue: 30, saturation: 100 }                  
                ] });                
                          

game.add(background, title);
game.add(gameController);

gameController.add('start', lvl_start);
gameController.add('1', lvl_1);
gameController.add('2', lvl_2);
gameController.add('3', lvl_3);

game.load({ note1: './wav/5.wav', note2: './wav/4.wav', note3: './wav/3.wav', note4: './wav/2.wav', note5: './wav/1.wav' }, function(res) {  
  
  
  game.start();
  
  gameController.load('2', game, res);
});

