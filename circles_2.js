/* global requestAnimFrame */

String.prototype.ext = function() {
  return this.substr((~-this.lastIndexOf(".") >>> 0) + 2);
};

CanvasRenderingContext2D.prototype.clear = function() {
  this.save();
  this.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.restore();
};

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

function Circles(opts) {
  var options = opts || {},
      self = this;
  
  this.canvas = { output: document.createElement('canvas'),
                  buffer: document.createElement('canvas') };
                  
  this.buffer = this.canvas.buffer.getContext('2d');
  this.output = this.canvas.output.getContext('2d');
  
  this.width = this.canvas.buffer.width = this.canvas.output.width = options.width || 640;
  this.height = this.canvas.buffer.height = this.canvas.output.height = options.height || 480;
  
  if (options.output) document.getElementById(options.output).appendChild(this.canvas.output);
  
  this.controllers = {};
  
  this.elements = [];
  
  this.add = function() {
    this.elements.push.apply(this.elements, arguments);
  };
  
  this.remove = function(element) {
    var index = this.elements.indexOf(element);
    if (index >= 0) this.elements.splice(index, 1);
  };
  
  this.get = function(cls) {
     return this.elements.filter(function(el) { return el instanceof cls; });
  };
  
  this.resources = {};
  
  this.load = function(resources, cb) {
    var resLoaded = 0,
        resCount  = 0,
        loaded = false;
        
    for (var src in resources) {
      resCount++;
    }
    
    for (var src in resources) {
      var ext = resources[src].ext();
      var evt = 'onload';
      if (ext === 'png') this.resources[src] = new Image();
      else if (ext === 'wav' || ext === 'mp3') {
        this.resources[src] = new Audio();
        evt = 'oncanplaythrough';
      }
      
      
      this.resources[src][evt] = function(){
        if (++resLoaded >= resCount) {
          if (loaded === false) {
            cb(self.resources);
            loaded = true;
          }
        }
      };
      this.resources[src].src = resources[src];
    }
  };
  
  this.provide = function(resources) {
    this.elements.forEach(function(element) {
      element.provide(resources);
    });
  };
  
  this.time = { initialized: false, 
                start: 0, 
                current: 0,
                elapsed: 0,
                ticks: 0,
                lastTick: 0,
                lastTickDuration: 0 };
  
  this.update = function() {
    this.elements.forEach(function(element) {
      element.update(self.time, self);
    });
  };
  
  this.draw = function() {
    this.elements.forEach(function(element) {
      element.draw(self.buffer, self);
    });
  };
  
  this.start = this.loop = function() {
    requestAnimFrame(self.loop);
    
    if (!self.time.initialized) {
      self.time.initialized = true;
      self.time.start = performance.now();
      self.time.lastTick = self.time.current = performance.now();
      self.time.elapsed = self.time.current - self.time.start;
      self.time.ticks++;
      self.time.lastTickDuration = self.time.current - self.time.lastTick;
    } else {
      self.time.lastTick = self.time.current;
      self.time.current = performance.now();
      self.time.elapsed = self.time.current - self.time.start;
      self.time.ticks++;
      self.time.lastTickDuration = self.time.current - self.time.lastTick;  
    }
    
    
    
    self.update();
    self.draw();
    
    self.output.drawImage(self.canvas.buffer, 0, 0);
  };
}


function MouseController(game) {
  var self = this;
  
  this.x = -1000;
  this.y = -1000;
  this.wasPressed = false;
  this.pressed = false;
  this.present = false;
  
  
  game.canvas.output.addEventListener('mousemove', function(evt) {
      var rect = game.canvas.output.getBoundingClientRect();  
      self.x = Math.round(evt.clientX - rect.left);
      self.y = Math.round(evt.clientY - rect.top);
      
      self.present = true;
  });
  
  game.canvas.output.addEventListener('mousedown', function(evt) {
      self.pressed = true;
      self.present = true;
  });
  
  game.canvas.output.addEventListener('mouseup', function(evt) {
      self.pressed = false;
      self.present = true;
  });
  
  game.canvas.output.addEventListener('mouseleave', function(evt) {
      self.present = false;
  });

  game.canvas.output.addEventListener('mouseenter', function(evt) {
      self.present = true;
  });
  
  game.controllers.mouse = this;
}

function KeyboardController(game) {
  var self = this;
  
  window.addEventListener('keyup', function(evt) {
    delete self[evt.keyCode];  
  });
  
  window.addEventListener('keydown', function(evt) {
    self[evt.keyCode] = true;
  });
  
  game.controllers.keyboard = this;
}

var ZERO = 0.0001,
    STOP = Math.random() * 999999999;

function EmptyElement(opts) {
  var options = opts || {},
      self = this; 
  
  this.x = options.x || 0;
  this.y = options.y || 0;
  this.width = options.width || 0;
  this.height = options.height || 0;
  
  this.collisions = {};
  this.collisions.point = function(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  };
  
  this._update = [];
  this._draw = [];
    
  this.on = function(action, cb) {
    if (action === "update") this._update.push(cb);
    else if (action === "draw") this._draw.push(cb);
  };
  
  if (options.update) this.on('update', options.update);
  if (options.draw) this.on('draw', options.draw);
  
  this.update = function(time, game) {
    for (var index = 0; index < this._update.length; index++) {
      var callback = this._update[index];
      var result = callback.call(this, time, game);
      if (result === STOP) break;
    }
  };
  
  this.draw = function(ctx, game) {
    for (var index = 0; index < this._draw.length; index++) {
      var callback = this._draw[index];
      var result = callback.call(this, ctx, game);
      if (result === STOP) break;
    }
  };
  
  this.provide = function(resources) {
    if (this._resources) {
      this.resources = {};
      this._resources.forEach(function(resource){ 
        self.resources[resource] = resources[resource];
      });
    }
  }
}

function ColorExtension(opts) {
  var options = opts || {},
      self = this;
  
  this.hue = options.hue || 0;
  this.saturation = options.saturation || 0;
  this.brightness = options.brightness || 0;
  this.alpha = options.alpha || 1;
  
  this.getColor = function(h, s, b, a) {
    return 'hsla(' + (h || this.hue) + ', ' + (s || this.saturation) + '%, ' + (b || this.brightness) + '%, ' + (a || this.alpha) + ')';
  };
}

function ResourceExtension(opts) {
  var options = opts || {},
      self = this;
  
  this._resources = opts.resources || [];
}

function BackgroundElement(opts) {
  var options = opts || {},
      self = this;
  EmptyElement.call(this, opts);
  ColorExtension.call(this, opts);
   
  this.on('draw', function(ctx, game) {
    ctx.fillStyle = 'hsl(' + this.hue + ', ' + this.saturation + '%, ' + this.brightness + '%)';
    ctx.fillRect(0, 0, game.width, game.height);
  });
}

function TextElement(opts) {
  var options = opts || {},
      self = this;
  EmptyElement.call(this, opts);
  ColorExtension.call(this, opts);
  
  this.text = options.text || "";
  this.font = options.font || 'Courier New';
  this.fontSize = options.fontSize || 12;
  
  this.centerX = function(game) {
    this.x = game.width / 2 - this.measure(game.buffer, this.text) / 2;
  };
  
  this.centerY = function(game) {
    this.y = game.height / 2 - this.fontSize / 2;
  };
  
  this.measure = function(ctx, text) {
    ctx.font =  this.getFont();
    return ctx.measureText(text).width;
  };
  
  this.getFont = function() {
    return this.fontSize + 'px ' + this.font;
  };
  
  this.on('draw', function(ctx, game) {
    ctx.font =  this.getFont();
    ctx.fillStyle = this.getColor();
    ctx.fillText(this.text, this.x, this.y);
  });
}

function FadingOutTextElement(opts) {
  var options = opts || {},
      self = this;
  TextElement.call(this, opts);
  
  this.step = options.step || 0.01;
  
  this.refresh = function(lvl) {
    this.alpha = lvl || 1;
  };
  
  this.on('update', function(time, game) {
    if (this.alpha > 0) this.alpha -= this.step;
    else this.alpha = 0;
  });
}

FadingOutTextElement.prototype = TextElement.prototype;

function NoteElement(opts) {
  var options = opts || {},
      self = this;
  EmptyElement.call(this, opts);
  ColorExtension.call(this, opts);
  ResourceExtension.call(this, opts);
  
  this.width = this.height = opts.size || 5;
  this.resourceName = this._resources[0] || '';
  
  this.score = opts.score || 0;
  this._hits = opts.hits || 0;
  this.hits  = opts.hits || 0;
  
  this.force = false;
  this.disabled = false;
  
  this.reset = function() {
    
  };
  
  this.hit = function(force) {
    if (this.hits > 0 && this.force === false) {
      this.hits--;
      this.resources[this.resourceName].volume = force;
      this.resources[this.resourceName].currentTime = 0;
      this.resources[this.resourceName].play();
      this.force = force;
      return this.score;
    } else {
      return false;
    }
  };
  
  this.on('update', function(time, game) { 
    if (this.force) this.force -= this.force/3;
    if (this.force < 0.01) this.force = false; 
  });
    
  this.on('draw', function(ctx, game) {
    if (this.force || this.hits === 0 || this.disabled) {
      ctx.fillStyle = this.getColor(undefined, ZERO);
      ctx.fillRect(this.x - this.force*8, this.y - this.force*8, this.width + this.force*16, this.height + this.force*16);
    } else {
      ctx.fillStyle = this.getColor();
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  });
}

function WaveElement(opts) {
  var options = opts || {},
      self = this;
  EmptyElement.call(this, opts);
  ColorExtension.call(this, opts);
  
  this.force = opts.force || 50;
  this.speed = opts.speed || 10;
  this.elapsed = 0;
  this.radius = 0;
  
  this.disabled = false;
  
  this.collisions.point = function(x, y, margin) {
    var dx = self.x - x,
        dy = self.y - y;
    
    var dist = Math.sqrt(dx*dx + dy*dy);   
    var abs = Math.abs(dist - self.radius);
    
    return abs < margin;
  };

  this.collidingWith = function(game, cls, cb) {
    return game.elements.filter(function(element) {
      if (element instanceof cls) {
        var center = { x: element.x + element.width/2, y: element.y + element.height/2 };
        var margin = self.radius - ((self.elapsed - game.time.lastTickDuration) / 1000 * self.speed);
        if (self.collisions.point(center.x, center.y, margin)) {
           cb.call(self, element, margin, Math.sqrt(Math.pow(self.x - element.x, 2) + Math.pow(self.y - element.y, 2))); 
        }
      }
    });
  };
  
  this.on('update', function(time, game) {
    if (!this.disabled) {
      this.elapsed += time.lastTickDuration;
      this.radius = this.elapsed / 1000 * this.speed;
      
      var alpha = this.radius / this.force;
      
      if (alpha > 1) { this.disabled = true; this.alpha = 0; }
      else {
        this.alpha = 1 - alpha;
      }
    } else {
      game.remove(self);
    }
  });
  
  this.on('draw', function(ctx, game) {
    if (!this.disabled) {
      ctx.strokeStyle = this.getColor();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });  
}

function BlockerElement(opts) {
  var options = opts || {},
      self = this;
  EmptyElement.call(this, opts);
  ColorExtension.call(this, opts);
  
  this.radius = opts.radius || 0;
  
  this.path = new Path2D();
  this.path.moveTo(0, 0);
  this.path.lineTo(game.width, 0);
  this.path.lineTo(game.width, this.y);
  this.path.lineTo(this.x + this.radius, this.y);
  this.path.arc(this.x, this.y, this.radius, 0, Math.PI*2);
  this.path.lineTo(game.width, this.y);
  this.path.lineTo(game.width, game.height);
  this.path.lineTo(0, game.height);
  this.path.closePath();
  
  this.on('draw', function(ctx, game) {
    ctx.save();
    
    ctx.fillStyle = this.getColor();
    ctx.fill(this.path, 'evenodd');
    
    ctx.restore();
  });
}

function GameLevel(opts) {
  var options = opts || {},
      self = this;
    
  this.elements = options.elements || [];
  this.score = options.score || 1;
  this.waves = options.waves || -1;
  this.wavesPower = options.power || 50;
  this.wavesSpeed = options.speed || 20;
  this.nextLvl = options.next || '';
}

function GameController(opts) {
  var options = opts || {},
      self = this;
  EmptyElement.call(this, opts);
  
  this.current = null;
  this.levels = {};
  this.add = function(name, lvl) {
    if (lvl instanceof GameLevel) {
      this.levels[name] = lvl;    
    }
  };
  
  this.score = 0;
  this.waves = 0;
  
  this.load = function(lvl, game, res) {
     if (lvl in this.levels) {
       this.reset(game);
       this.current = this.levels[lvl];
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
          
            var pts = note.hit(this.alpha);
            if (pts !== false) self.score += pts;
          });
        });


        game.add(wave);
        this.waves--;
      
        this.wasPressed = true;
      }
    } else if (this.wasPressed && !game.controllers.mouse.pressed) {
      this.wasPressed = false;
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
