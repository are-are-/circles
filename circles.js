function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
owl = (function() {

    // the re-usable constructor function used by clone().
    function Clone() {}

    // clone objects, skip other types.
    function clone(target) {
        if ( typeof target == 'object' ) {
            Clone.prototype = target;
            return new Clone();
        } else {
            return target;
        }
    }


    // Shallow Copy 
    function copy(target) {
        if (typeof target !== 'object' ) {
            return target;  // non-object have value sematics, so target is already a copy.
        } else {
            var value = target.valueOf();
            if (target != value) { 
                // the object is a standard object wrapper for a native type, say String.
                // we can make a copy by instantiating a new object around the value.
                return new target.constructor(value);
            } else {
                // ok, we have a normal object. If possible, we'll clone the original's prototype 
                // (not the original) to get an empty object with the same prototype chain as
                // the original.  If just copy the instance properties.  Otherwise, we have to 
                // copy the whole thing, property-by-property.
                if ( target instanceof target.constructor && target.constructor !== Object ) { 
                    var c = clone(target.constructor.prototype);
                
                    // give the copy all the instance properties of target.  It has the same
                    // prototype as target, so inherited properties are already there.
                    for ( var property in target) { 
                        if (target.hasOwnProperty(property)) {
                            c[property] = target[property];
                        } 
                    }
                } else {
                    var c = {};
                    for ( var property in target ) c[property] = target[property];
                }
                
                return c;
            }
        }
    }

    // Deep Copy
    var deepCopiers = [];

    function DeepCopier(config) {
        for ( var key in config ) this[key] = config[key];
    }
    DeepCopier.prototype = {
        constructor: DeepCopier,

        // determines if this DeepCopier can handle the given object.
        canCopy: function(source) { return false; },

        // starts the deep copying process by creating the copy object.  You
        // can initialize any properties you want, but you can't call recursively
        // into the DeeopCopyAlgorithm.
        create: function(source) { },

        // Completes the deep copy of the source object by populating any properties
        // that need to be recursively deep copied.  You can do this by using the
        // provided deepCopyAlgorithm instance's deepCopy() method.  This will handle
        // cyclic references for objects already deepCopied, including the source object
        // itself.  The "result" passed in is the object returned from create().
        populate: function(deepCopyAlgorithm, source, result) {}
    };

    function DeepCopyAlgorithm() {
        // copiedObjects keeps track of objects already copied by this
        // deepCopy operation, so we can correctly handle cyclic references.
        this.copiedObjects = [];
        thisPass = this;
        this.recursiveDeepCopy = function(source) {
            return thisPass.deepCopy(source);
        }
        this.depth = 0;
    }
    DeepCopyAlgorithm.prototype = {
        constructor: DeepCopyAlgorithm,

        maxDepth: 256,
            
        // add an object to the cache.  No attempt is made to filter duplicates;
        // we always check getCachedResult() before calling it.
        cacheResult: function(source, result) {
            this.copiedObjects.push([source, result]);
        },

        // Returns the cached copy of a given object, or undefined if it's an
        // object we haven't seen before.
        getCachedResult: function(source) {
            var copiedObjects = this.copiedObjects;
            var length = copiedObjects.length;
            for ( var i=0; i<length; i++ ) {
                if ( copiedObjects[i][0] === source ) {
                    return copiedObjects[i][1];
                }
            }
            return undefined;
        },
        
        // deepCopy handles the simple cases itself: non-objects and object's we've seen before.
        // For complex cases, it first identifies an appropriate DeepCopier, then calls
        // applyDeepCopier() to delegate the details of copying the object to that DeepCopier.
        deepCopy: function(source) {
            // null is a special case: it's the only value of type 'object' without properties.
            if ( source === null ) return null;

            // All non-objects use value semantics and don't need explict copying.
            if ( typeof source !== 'object' ) return source;

            var cachedResult = this.getCachedResult(source);

            // we've already seen this object during this deep copy operation
            // so can immediately return the result.  This preserves the cyclic
            // reference structure and protects us from infinite recursion.
            if ( cachedResult ) return cachedResult;

            // objects may need special handling depending on their class.  There is
            // a class of handlers call "DeepCopiers"  that know how to copy certain
            // objects.  There is also a final, generic deep copier that can handle any object.
            for ( var i=0; i<deepCopiers.length; i++ ) {
                var deepCopier = deepCopiers[i];
                if ( deepCopier.canCopy(source) ) {
                    return this.applyDeepCopier(deepCopier, source);
                }
            }
            // the generic copier can handle anything, so we should never reach this line.
            throw new Error("no DeepCopier is able to copy " + source);
        },

        // once we've identified which DeepCopier to use, we need to call it in a very
        // particular order: create, cache, populate.  This is the key to detecting cycles.
        // We also keep track of recursion depth when calling the potentially recursive
        // populate(): this is a fail-fast to prevent an infinite loop from consuming all
        // available memory and crashing or slowing down the browser.
        applyDeepCopier: function(deepCopier, source) {
            // Start by creating a stub object that represents the copy.
            var result = deepCopier.create(source);

            // we now know the deep copy of source should always be result, so if we encounter
            // source again during this deep copy we can immediately use result instead of
            // descending into it recursively.  
            this.cacheResult(source, result);

            // only DeepCopier::populate() can recursively deep copy.  So, to keep track
            // of recursion depth, we increment this shared counter before calling it,
            // and decrement it afterwards.
            this.depth++;
            if ( this.depth > this.maxDepth ) {
                throw new Error("Exceeded max recursion depth in deep copy.");
            }

            // It's now safe to let the deepCopier recursively deep copy its properties.
            deepCopier.populate(this.recursiveDeepCopy, source, result);

            this.depth--;

            return result;
        }
    };

    // entry point for deep copy.
    //   source is the object to be deep copied.
    //   maxDepth is an optional recursion limit. Defaults to 256.
    function deepCopy(source, maxDepth) {
        var deepCopyAlgorithm = new DeepCopyAlgorithm();
        if ( maxDepth ) deepCopyAlgorithm.maxDepth = maxDepth;
        return deepCopyAlgorithm.deepCopy(source);
    }

    // publicly expose the DeepCopier class.
    deepCopy.DeepCopier = DeepCopier;

    // publicly expose the list of deepCopiers.
    deepCopy.deepCopiers = deepCopiers;

    // make deepCopy() extensible by allowing others to 
    // register their own custom DeepCopiers.
    deepCopy.register = function(deepCopier) {
        if ( !(deepCopier instanceof DeepCopier) ) {
            deepCopier = new DeepCopier(deepCopier);
        }
        deepCopiers.unshift(deepCopier);
    }

    // Generic Object copier
    // the ultimate fallback DeepCopier, which tries to handle the generic case.  This
    // should work for base Objects and many user-defined classes.
    deepCopy.register({
        canCopy: function(source) { return true; },

        create: function(source) {
            if ( source instanceof source.constructor ) {
                return clone(source.constructor.prototype);
            } else {
                return {};
            }
        },

        populate: function(deepCopy, source, result) {
            for ( var key in source ) {
                if ( source.hasOwnProperty(key) ) {
                    result[key] = deepCopy(source[key]);
                }
            }
            return result;
        }
    });

    // Array copier
    deepCopy.register({
        canCopy: function(source) {
            return ( source instanceof Array );
        },

        create: function(source) {
            return new source.constructor();
        },

        populate: function(deepCopy, source, result) {
            for ( var i=0; i<source.length; i++) {
                result.push( deepCopy(source[i]) );
            }
            return result;
        }
    });

    // Date copier
    deepCopy.register({
        canCopy: function(source) {
            return ( source instanceof Date );
        },

        create: function(source) {
            return new Date(source);
        }
    });

    // HTML DOM Node

    // utility function to detect Nodes.  In particular, we're looking
    // for the cloneNode method.  The global document is also defined to
    // be a Node, but is a special case in many ways.
    function isNode(source) {
        if ( window.Node ) {
            return source instanceof Node;
        } else {
            // the document is a special Node and doesn't have many of
            // the common properties so we use an identity check instead.
            if ( source === document ) return true;
            return (
                typeof source.nodeType === 'number' &&
                source.attributes &&
                source.childNodes &&
                source.cloneNode
            );
        }
    }

    // Node copier
    deepCopy.register({
        canCopy: function(source) { return isNode(source); },

        create: function(source) {
            // there can only be one (document).
            if ( source === document ) return document;

            // start with a shallow copy.  We'll handle the deep copy of
            // its children ourselves.
            return source.cloneNode(false);
        },

        populate: function(deepCopy, source, result) {
            // we're not copying the global document, so don't have to populate it either.
            if ( source === document ) return document;

            // if this Node has children, deep copy them one-by-one.
            if ( source.childNodes && source.childNodes.length ) {
                for ( var i=0; i<source.childNodes.length; i++ ) {
                    var childCopy = deepCopy(source.childNodes[i]);
                    result.appendChild(childCopy);
                }
            }
        }
    });

    return {
        DeepCopyAlgorithm: DeepCopyAlgorithm,
        copy: copy,
        clone: clone,
        deepCopy: deepCopy
    };
})();
function fisherYates ( myArray ) {
  var i = myArray.length, j, tempi, tempj;
  if ( i === 0 ) return false;
  while ( --i ) {
     j = Math.floor( Math.random() * ( i + 1 ) );
     tempi = myArray[i];
     tempj = myArray[j];
     myArray[i] = tempj;
     myArray[j] = tempi;
   }
}
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;
    
    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));
    
    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;
    
    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    
    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
            
        case 1:
            r = q;
            g = v;
            b = p;
            break;
            
        case 2:
            r = p;
            g = v;
            b = t;
            break;
            
        case 3:
            r = p;
            g = q;
            b = v;
            break;
            
        case 4:
            r = t;
            g = p;
            b = v;
            break;
            
        default: // case 5:
            r = v;
            g = p;
            b = q;
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

function CirclesGame (width, height) {
	this.width = width;
	this.height = height;
	this.canvas = document.createElement("canvas");
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.buffer = this.canvas.getContext("2d");
	this.ocanvas = null;
	this.output = null;

	this.fps = 60;
	this.looptime = 0;
	this.settings = {};

	this.SetScene = function (canvasId) {
		this.ocanvas = document.getElementById(canvasId);
		this.ocanvas.width = this.width;
		this.ocanvas.height = this.height;
		this.output = this.ocanvas.getContext("2d");
		return this.ocanvas;
	}

	this.DrawScene = function (shift_x, shift_y) {
		this.output.drawImage(this.canvas,shift_x,shift_y);
	}

	this.ClearBuffer = function () {
		this.buffer.save();
		var old = this.buffer.fillStyle= "#000000";
		this.buffer.fillRect(0,0,this.canvas.width,this.canvas.height);
		this.buffer.restore();
	}

	this.Logic = function () {

	}

}

//USER INPUT *************
	function mouse(obj, evt) {
	    var rect = obj.getBoundingClientRect();
	    return {
        	x: evt.clientX - rect.left,
        	y: evt.clientY - rect.top
    	};
	}

	var keyboard = {};
	addEventListener("keydown", function (e) {
		keyboard[e.keyCode] = true;
	}, false);
	addEventListener("keyup", function (e) {
		delete keyboard[e.keyCode];
	}, false);
//************************

var game = new CirclesGame(640,480);
game.SetScene("circles");


//*****************GLOBAL SETTINGS**************
game.buffer.shadowBlur = 20; 
game.buffer.shadowColor = "rgba(255,255,255,0.4)";
game.buffer.webkitImageSmoothingEnabled = true;
game.fps = 30;

const TYPE_NOTE = 1;
const TYPE_EMIT = 2;
const TYPE_ABSR = 3;
const TYPE_TIME = 4;
const TYPE_RESE = 5;
const TYPE_LABE = 6;

const CURR_WAVE = 0;
const CURR_EMIT = 1;
//-----------------GLOBAL SETTINGS-------------

//****************GAME OBJECTS*******************
var cursor = { 
	x: 0,
	y: 0,
	pressed: false,
    current: 0
}

function randomColors(total)
{
    var i = 360 / (total - 1); // distribute the colors evenly on the hue range
    var r = []; // hold the generated colors
    for (var x=0; x<total; x++)
    {   
        var rgb = hsvToRgb(i * x, 100, 100);
        r.push(rgbToHex(rgb[0],rgb[1],rgb[2])); // you can also alternate the saturation and value for even more contrast between the colors
    }
    return r;
}




const Block = function (x, y, r, type, settings) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.type = type;
    this.settings = settings;
}

const Circle = function (x, y, step, speed) {
	this.x = x;
	this.y = y;
	this.opacity = 1;
	this.r = 1;
	this.cycle = 100;
	this.step = step;
	this.speed = speed;
} 

var Emitter = function (x,y, once, timed, speed, wave, send) {
    this.x = x;
    this.y = y;
    this.once = once;
    this.blocked = false;
    this.timed = timed;
    this.speed = speed/100;
    this.cycle = 1;
    this.wave = wave;
    this.send = send;
}

var absorber = function (x,y,reset,add) {
    this.x = x;
    this.y = y;
    this.reset = reset;
    this.add=add;
}
var label = function (size, x,y,text) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.size = size;
}

function NewAudio (src) {
    var audio = new Audio();
    audio.src = "wav/"+src+".wav";
    return audio;
}

const Fader = {
    fade: 300,
    opac: 1,
    Reset: function () {
        this.fade = 100;
        this.opac = 1;
    }
}

const Levels = {
	0: {
		levelNumber:      0,
		levelName:        "CIRCLES v2 basic",
		levelDesc:        "gameset by Are Wojciechowski",
        nextLevel:        1,
		goal:             1,
		wavesLeft:        10,
		emittersLeft:     0,
		cursorSize:       2,
		gameElements: {
            circle: [],
            block: [    new Block(320, 240, 7, TYPE_NOTE, {audio: NewAudio("1"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(320, 260, 0, TYPE_LABE, {text: "play this note to start", size: 16, opacity: 1}),
                        new Block(320, 360, 0, TYPE_LABE, {text: "Mikocia to frajerka :* KC :***", size: 20, opacity: 1})
            ]
        }
	},
    1: {
        levelNumber:      1,
        levelName:        "beggining",
        levelDesc:        "try to start!",
        nextLevel:        0,
        goal:             10,
        wavesLeft:        10,
        emittersLeft:     0,
        cursorSize:       2,
        gameElements: {
            circle: [],
            block: [    new Block(320, 260, 7, TYPE_NOTE, {audio: NewAudio("3"), blocked: false, isplay: false, once: false, goalable: true})
            ]
        }
    }
}

const Settings = {
	currentLevel: 	0,
    nextLevel:      0, 
	levelName: 		"test name",
	levelDesc: 		"test desc",
    levelNumber:    0,
	goal: 			0,
	wavesLeft: 		0,
	emittersLeft:   0,
	overwallScore: 	0,
	bufferScore: 	0,
	multiplerScore: 1,
	cursorSize: 	4,
	gameElements: {
        block: [],
		circle: []
	},
	LoadLevel: function (level) {
		this.levelNumber = level.levelNumber;
		this.levelName = level.levelName;
		this.levelDesc = level.levelDesc;
        this.nextLevel = level.nextLevel;
		this.goal = level.goal;
		this.wavesLeft = level.wavesLeft;
		this.emittersLeft = level.emittersLeft;
		this.cursorSize = level.cursorSize;
		this.gameElements = owl.deepCopy(level.gameElements);
        Fader.Reset();
	},
    Check: function () {
        if (this.goal <=0) {
            this.LoadLevel(Levels[this.nextLevel])
        }
    }
}

Settings.LoadLevel(Levels[0]);






var colors = randomColors(Settings.goal+1);


game.Logic = function () {
	//MOUSE############################################
        game.ocanvas.onmousemove = function (e) {
        	var mousevn = mouse(this,e);
        	cursor.x = mousevn.x;
        	cursor.y = mousevn.y;
        }
        game.ocanvas.onmousedown = function (e) {
        	var mousevn = mouse(this,e);
        	cursor.pressed=true;
        	if(e.which==1){
                switch (cursor.current) {
                    case CURR_WAVE:
                        if(Settings.wavesLeft>0) {
                            Settings.wavesLeft--;
                            Settings.gameElements.circle.push(new Circle(mousevn.x, mousevn.y, Settings.cursorSize, 1));
                        }
                        break;
                    case CURR_EMIT:
                        if(Settings.emittersLeft>0) {
                            Settings.emittersLeft--;
                            
                        }
                        break;
                }
        	}
        }
        game.ocanvas.ontouchstart = function (e) {
        	var mousevn = mouse(this,e);
        	if(Settings.wavesLeft>0) {
                Settings.wavesLeft--;
                Settings.gameElements.circle.push(new Circle(mousevn.x, mousevn.y, Settings.cursorSize, 1));
            }
        	cursor.pressed = true;
        }
        game.ocanvas.onmouseup = function (e) {
        	cursor.pressed = false;
        }
        game.ocanvas.ontouchend = function (e) {
        	cursor.pressed = false;
        }
        game.ocanvas.oncontextmenu = function (e) {
        	return false;
        }
        //KEYBOARD#####################################
        if(32 in keyboard) {
            Settings.LoadLevel(Levels[0]);
            Settings.multiplerScore = 1;
            Settings.bufferScore = 0;
        }

        if(49 in keyboard) cursor.current = CURR_WAVE;
        else if (50 in keyboard) cursor.current = CURR_EMIT;
        //REST%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
     	



        for (i in Settings.gameElements.circle) {
            if (Settings.gameElements.circle[i]!=null) {
                game.buffer.save();
                game.buffer.beginPath();
                game.buffer.strokeStyle="#dddddd";
                game.buffer.globalAlpha= Settings.gameElements.circle[i].opacity;
                game.buffer.arc(Settings.gameElements.circle[i].x,Settings.gameElements.circle[i].y,Settings.gameElements.circle[i].r,0,2*Math.PI);
                game.buffer.stroke();
                game.buffer.restore();

                for (n in Settings.gameElements.block) {
                    var distance = Math.sqrt(Math.pow(Settings.gameElements.block[n].x - Settings.gameElements.circle[i].x,2) + Math.pow(Settings.gameElements.block[n].y- Settings.gameElements.circle[i].y,2))-Settings.gameElements.circle[i].r-Settings.gameElements.block[n].r;
                    switch (Settings.gameElements.block[n].type) {
                            case TYPE_NOTE:
                                if (distance<0.5&&distance>-0.5&&!Settings.gameElements.block[n].settings.blocked&&Settings.goal>0) {
                                    Settings.gameElements.block[n].settings.audio.volume = ((Settings.gameElements.circle[i].opacity>=0.2) ? Settings.gameElements.circle[i].opacity : 0.2);
                                    Settings.gameElements.block[n].settings.audio.currentTime = 0;
                                    Settings.gameElements.block[n].settings.audio.play();
                                    Settings.gameElements.block[n].settings.isplay = true;
                                    if(Settings.gameElements.block[n].settings.once) Settings.gameElements.block[n].settings.blocked = true;
                                    if(Settings.gameElements.block[n].settings.goalable) Settings.goal--;
                                }
                            break;
                            case TYPE_EMIT:
                                if (distance<0.5&&distance>-0.5&&!Settings.gameElements.block[n].settings.blocked&&Settings.gameElements.block[n].settings.cycle>=1){
                                    console.log("H");
                                    Settings.gameElements.circle.push(new Circle(Settings.gameElements.block[n].x,Settings.gameElements.block[n].y,Settings.gameElements.block[n].settings.wave,1));
                                    if(Settings.gameElements.block[n].settings.once) Settings.gameElements.block[n].settings.blocked = true;
                                    else Settings.gameElements.block[n].settings.cycle = 0;
                                }
                            break;
                    }
                }








                if (Settings.gameElements.circle[i].cycle > 0) {
                    Settings.gameElements.circle[i].cycle-=Settings.gameElements.circle[i].step;
                    Settings.gameElements.circle[i].r++;
                    Settings.gameElements.circle[i].opacity -=Settings.gameElements.circle[i].step/100;
                    if (Settings.gameElements.circle[i].opacity <= 0) Settings.gameElements.circle[i].opacity = 0;
                } else if (Settings.gameElements.circle[i].cycle <= 0) {
                    Settings.gameElements.circle[i] = null;
                }
            }
        };

        for (n in Settings.gameElements.block) {
            game.buffer.save();
            switch (Settings.gameElements.block[n].type) {
                case TYPE_NOTE:
                    if(Settings.gameElements.block[n].settings.blocked) game.buffer.fillStyle = "#999999";
                    else game.buffer.fillStyle = colors[(Settings.gameElements.block[n].y*Settings.gameElements.block[n].x)%colors.length];
                    if (Settings.gameElements.block[n].settings.isplay) {
                        game.buffer.beginPath();
                        game.buffer.strokeStyle=game.buffer.fillStyle;
                        game.buffer.arc(Settings.gameElements.block[n].x,Settings.gameElements.block[n].y,Settings.gameElements.block[n].r/2,0,2*Math.PI);
                        game.buffer.fill();
                        game.buffer.stroke();
                        Settings.gameElements.block[n].settings.isplay = false;
                    } else {
                        game.buffer.beginPath();
                        game.buffer.strokeStyle=game.buffer.fillStyle;
                        game.buffer.arc(Settings.gameElements.block[n].x,Settings.gameElements.block[n].y,Settings.gameElements.block[n].r,0,2*Math.PI);
                        game.buffer.fill();
                        game.buffer.stroke();
                    }
                break;
                case TYPE_LABE:
                        var distance = Math.abs(Settings.gameElements.block[n].x-cursor.x)+Math.abs(Settings.gameElements.block[n].y-cursor.y);
                        if(Math.abs(distance)<30) {
                            Settings.gameElements.block[n].settings.opacity = 1;
                        } else if (Math.abs(distance)>=30&&Math.abs(distance)<=200) {
                            Settings.gameElements.block[n].settings.opacity = 30/distance;
                        } else {
                            Settings.gameElements.block[n].settings.opacity = 30/200;
                        }
                        game.buffer.globalAlpha = Settings.gameElements.block[n].settings.opacity;
                        game.buffer.fillStyle = "white";
                        game.buffer.font = Settings.gameElements.block[n].settings.size+"px Minimal";
                        game.buffer.textBaseline = "top";
                        game.buffer.textAlign = "center";
                        game.buffer.fillText(Settings.gameElements.block[n].settings.text,Settings.gameElements.block[n].x,Settings.gameElements.block[n].y);
                break;
                case TYPE_EMIT:
                    if(!Settings.gameElements.block[n].settings.once) {
                        game.buffer.beginPath();
                        if(Settings.gameElements.block[n].settings.cycle<1) Settings.gameElements.block[n].settings.cycle += Settings.gameElements.block[n].settings.speed/100;
                        else Settings.gameElements.block[n].settings.cycle = 1;
                        game.buffer.fillStyle="white";
                        game.buffer.strokeStyle = 'white';
                        game.buffer.lineWidth = 2;
                        game.buffer.arc(Settings.gameElements.block[n].x, Settings.gameElements.block[n].y, 5, 0, 2 * Math.PI*Settings.gameElements.block[n].settings.cycle, false);
                        game.buffer.stroke();
                    } else {
                        if(Settings.gameElements.block[n].settings.blocked) {
                            game.buffer.beginPath();
                            game.buffer.fillStyle="#888888";
                            game.buffer.strokeStyle = '#888888';
                            game.buffer.lineWidth = 1;
                            game.buffer.arc(Settings.gameElements.block[n].x, Settings.gameElements.block[n].y, 4, 0, 2 * Math.PI, false);
                            game.buffer.stroke();
                            game.buffer.fill();
                        } else {
                            game.buffer.beginPath();
                            game.buffer.fillStyle="white";
                            game.buffer.strokeStyle = 'white';
                            game.buffer.lineWidth = 1;
                            game.buffer.arc(Settings.gameElements.block[n].x, Settings.gameElements.block[n].y, 5, 0, 2 * Math.PI, false);
                            game.buffer.stroke();
                            game.buffer.fill();
                        }
                    }
                break;
            }
            

            game.buffer.restore();
        }



		




        Settings.Check();   


        game.buffer.save();
        var csize = 5;
        if (90 in keyboard) {
                game.buffer.save();
                game.buffer.beginPath();
                game.buffer.strokeStyle="red";
                game.buffer.globalAlpha= 0.2;
                game.buffer.arc(cursor.x,cursor.y,100/Settings.cursorSize,0,2*Math.PI);
                game.buffer.stroke();
                game.buffer.restore();
        }

        var quan = 1;

        if(cursor.current==CURR_WAVE) quan = Settings.wavesLeft/Levels[Settings.levelNumber].wavesLeft;
        else if (cursor.current==CURR_EMIT) quan = Settings.emittersLeft;
        console.log(quan);
        if(cursor.pressed) {
            game.buffer.lineWidth = 1;
        } else {
            game.buffer.lineWidth = 2;
        }

            game.buffer.fillStyle = "white";
            game.buffer.beginPath();
            game.buffer.strokeStyle=game.buffer.fillStyle;
            game.buffer.arc(cursor.x,cursor.y,csize,0,2*Math.PI*quan);
            game.buffer.stroke();
            game.buffer.beginPath();
            game.buffer.strokeStyle=game.buffer.fillStyle;
            game.buffer.lineWidth = 1;
            game.buffer.arc(cursor.x,cursor.y,1,0,2*Math.PI);
            game.buffer.fill();
            game.buffer.stroke();


        game.buffer.textBaseline = "top";
        game.buffer.textAlign = "center";
        game.buffer.shadowBlur = 0;
        game.buffer.fillStyle="white";
        game.buffer.font="30px Minimal";

        if(Fader.fade>0) {
            Fader.fade--;
            Fader.opac = Fader.fade/100;
            game.buffer.globalAlpha = Fader.opac;
            game.buffer.fillText(Settings.levelName,320,10);
            game.buffer.font="12px Minimal";
            game.buffer.fillText(Settings.levelDesc,320,50);
        }

        game.buffer.textBaseline = "top";
        game.buffer.textAlign = "left";
        game.buffer.shadowBlur = 0;
        game.buffer.fillStyle="white";
        game.buffer.globalAlpha = 0.9;
        game.buffer.font="60px Minimal";
        game.buffer.fillText(Settings.levelNumber,20,20);
        var measured = game.buffer.measureText(Settings.levelNumber).width;
        game.buffer.font="16px Minimal";
        game.buffer.fillText("level", measured+20-game.buffer.measureText("level").width, 10);

        game.buffer.textBaseline = "bottom";
        game.buffer.textAlign = "right";

        game.buffer.save();
        game.buffer.font="20px Minimal";
        game.buffer.fillStyle = "white";
        game.buffer.fillRect(0,game.canvas.height-5,game.canvas.width/Levels[Settings.levelNumber].goal*Settings.goal,3);
        game.buffer.fillText(Settings.goal,game.canvas.width/Levels[Settings.levelNumber].goal*Settings.goal,game.canvas.height);
        
        game.buffer.restore();
        game.buffer.save();
        game.buffer.font="10px Minimal";
        game.buffer.globalAlpha = 0.5;
        game.buffer.textBaseline = "top";
        game.buffer.textAlign = "left";


        
        game.buffer.restore();
        game.buffer.font="30px Minimal";
        game.buffer.textAlign = "right";
        game.buffer.textBaseline = "top";
        game.buffer.fillStyle = "white";
        game.buffer.fillText(Settings.overwallScore,game.canvas.width-5,0);
        var mesau = game.buffer.measureText(Settings.overwallScore).width;
        //game.buffer.font="12px Minimal";
        //game.buffer.fillStyle = colors[Settings.bufferScore%colors.length];
        //game.buffer.fillText(Settings.bufferScore + " +",game.canvas.width-mesau-20,6);
        //game.buffer.fillText(Settings.multiplerScore + " x",game.canvas.width-mesau-20,16);
        game.buffer.restore();
        game.DrawScene(0, 0, true);
        game.ClearBuffer();
        //game LOGIC HERE
}

//Settings.LoadLevel(0);
game.loop = setInterval(game.Logic, 1000 / game.fps);