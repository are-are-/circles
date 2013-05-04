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
const TYPE_ANCH = 7

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

const colors = randomColors(64);

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
        levelName:        "CIRCLES v2",
        levelDesc:        "gameset by Are Wojciechowski",
        nextLevel:        1,
        goal:             1,
        wavesLeft:        1,
        emittersLeft:     0,
        cursorSize:       3,
        gameElements: {
            circle: [],
            block: [    new Block(320, 240, 7, TYPE_NOTE, {audio: NewAudio("1"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(320, 260, 0, TYPE_LABE, {text: "play this note to start", size: 16, opacity: 1}),
                        new Block(320, 360, 0, TYPE_ANCH, {level: 3})
            ]
        }
    },
    1: {
        levelNumber:      1,
        levelName:        "scale",
        levelDesc:        "my notes needs love",
        nextLevel:        2,
        goal:             32,
        wavesLeft:        1000,
        emittersLeft:     0,
        cursorSize:       2,
        gameElements: {
            circle: [],
            block: [    new Block(120, 240, 7, TYPE_NOTE, {audio: NewAudio("1"), blocked: false, isplay: false, once: false, goalable: true}),
                        new Block(200, 240, 7, TYPE_NOTE, {audio: NewAudio("2"), blocked: false, isplay: false, once: false, goalable: true}),
                        new Block(280, 240, 7, TYPE_NOTE, {audio: NewAudio("3"), blocked: false, isplay: false, once: false, goalable: true}),
                        new Block(360, 240, 7, TYPE_NOTE, {audio: NewAudio("4"), blocked: false, isplay: false, once: false, goalable: true}),
                        new Block(440, 240, 7, TYPE_NOTE, {audio: NewAudio("5"), blocked: false, isplay: false, once: false, goalable: true}),
                        new Block(520, 240, 7, TYPE_NOTE, {audio: NewAudio("6"), blocked: false, isplay: false, once: false, goalable: true})
            ]
        }
    },
    2: {
        levelNumber:      2,
        levelName:        "love",
        levelDesc:        "love needs my notes",
        nextLevel:        3,
        goal:             6,
        wavesLeft:        3,
        emittersLeft:     0,
        cursorSize:       1,
        gameElements: {
            circle: [],
            block: [    new Block(160, 200, 7, TYPE_NOTE, {audio: NewAudio("1"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(160, 280, 7, TYPE_NOTE, {audio: NewAudio("3"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(320, 200, 7, TYPE_NOTE, {audio: NewAudio("2"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(320, 280, 7, TYPE_NOTE, {audio: NewAudio("4"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(480, 200, 7, TYPE_NOTE, {audio: NewAudio("3"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(480, 280, 7, TYPE_NOTE, {audio: NewAudio("5"), blocked: false, isplay: false, once: true, goalable: true})
            ]
        }
    },
    3: {
        levelNumber:      3,
        levelName:        "chords",
        levelDesc:        "makes harmony",
        nextLevel:        3,
        goal:             6,
        wavesLeft:        2,
        emittersLeft:     0,
        cursorSize:       4,
        gameElements: {
            circle: [],
            block: [    new Block(200, 240, 7, TYPE_NOTE, {audio: NewAudio("1"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(200, 240, 7, TYPE_NOTE, {audio: NewAudio("3"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(200, 240, 7, TYPE_NOTE, {audio: NewAudio("5"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(440, 240, 7, TYPE_NOTE, {audio: NewAudio("2"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(440, 240, 7, TYPE_NOTE, {audio: NewAudio("4"), blocked: false, isplay: false, once: true, goalable: true}),
                        new Block(440, 240, 7, TYPE_NOTE, {audio: NewAudio("6"), blocked: false, isplay: false, once: true, goalable: true})
            ]
        }
    }
}

const Settings = {
    currentLevel:   0,
    nextLevel:      0, 
    levelName:      "test name",
    levelDesc:      "test desc",
    levelNumber:    0,
    goal:           0,
    wavesLeft:      0,
    emittersLeft:   0,
    overwallScore:  0,
    bufferScore:    0,
    multiplerScore: 1,
    cursorSize:     4,
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

game.Logic = function () {
    //MOUSE############################################
        game.ocanvas.onmousemove = function (e) {
            var mousevn = mouse(this, e);
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
            Settings.LoadLevel(Levels[Settings.levelNumber]);
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
                game.buffer.strokeStyle="#fff";
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
                            case TYPE_ANCH:
                                if (distance<0.5&&distance>-0.5){
                                    Settings.LoadLevel(Levels[Settings.gameElements.block[n].settings.level]);    
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
                    else game.buffer.fillStyle = colors[Settings.gameElements.block[n].x%colors.length];
                    if (Settings.gameElements.block[n].settings.isplay) {
                        game.buffer.fillRect(Settings.gameElements.block[n].x-2,Settings.gameElements.block[n].y-2,4,4);
                        Settings.gameElements.block[n].settings.isplay = false;
                    } else {
                        game.buffer.fillRect(Settings.gameElements.block[n].x-4,Settings.gameElements.block[n].y-4,8,8);
                    }
                break;
                case TYPE_LABE:
                        var distance = Math.abs(Settings.gameElements.block[n].x-cursor.x)+Math.abs(Settings.gameElements.block[n].y-cursor.y);
                        Settings.gameElements.block[n].settings.opacity = 0.7;
                        game.buffer.globalAlpha = Settings.gameElements.block[n].settings.opacity;
                        game.buffer.fillStyle = "white";
                        game.buffer.font = Settings.gameElements.block[n].settings.size+"px Minimal";
                        game.buffer.textBaseline = "top";
                        game.buffer.textAlign = "center";
                        game.buffer.fillText(Settings.gameElements.block[n].settings.text,Settings.gameElements.block[n].x,Settings.gameElements.block[n].y);
                break;
                case TYPE_ANCH:
                        game.buffer.fillStyle = "yellow";
                        game.buffer.strokeStyle = "cyan";
                        game.buffer.beginPath();
                        game.buffer.rect(Settings.gameElements.block[n].x-2,Settings.gameElements.block[n].y-2,4,4);
                        game.buffer.fill();
                        game.buffer.lineWidth = 1;
                        game.buffer.stroke();
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
        game.buffer.font="60px Minimal";

        if(Fader.fade>0) {
            Fader.fade-=0.5;
            Fader.opac = Fader.fade/100;
            game.buffer.globalAlpha = Fader.opac;
            game.buffer.fillText(Settings.levelName,320,80);
            game.buffer.font="12px Minimal";
            game.buffer.fillText(Settings.levelDesc,320,50);
        }

        game.buffer.textBaseline = "top";
        game.buffer.textAlign = "left";
        game.buffer.shadowBlur = 0;
        game.buffer.fillStyle="white";
        game.buffer.globalAlpha = 0.9;
        game.buffer.font="60px Minimal";
        game.buffer.fillText(Settings.levelNumber,20,0);

        game.buffer.textBaseline = "bottom";
        game.buffer.textAlign = "right";

        game.buffer.save();
        game.buffer.font="14px Minimal";
        if(Settings.goal<33) {
            for (var i = 0; i < Settings.goal; i++) {
                game.buffer.fillStyle = "white";
                game.buffer.fillRect(i*20,game.canvas.height-5,20,3);
            }
            game.buffer.fillText(Settings.goal,Settings.goal*20,game.canvas.height);
        } else {
            for (var i = 0; i < Settings.goal; i++) {
                game.buffer.fillStyle = "white";
                game.buffer.fillRect(game.canvas.width/Settings.goal*i,game.canvas.height-5,game.canvas.width/Settings.goal,3);
            }
            game.buffer.fillText(Settings.goal,game.canvas.width,game.canvas.height);
        }
        
        game.buffer.restore();

        game.buffer.restore();
        game.DrawScene(0, 0, true);
        game.ClearBuffer();
        //game LOGIC HERE
}

//Settings.LoadLevel(0);
game.loop = setInterval(game.Logic, 1000 / game.fps);