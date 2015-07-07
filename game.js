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

var lvl_2     = new GameLevel({ score: 8, waves: 1, power: 50, speed: 100, next: 'start', elements: [
                  BlockerElement, { x: 320, y: 240, radius: 60, alpha: 0.7, brightness: 10, hue: 0, saturation: 50, path: function(path) {
                    path.moveTo(120, 200);
                    path.lineTo(480, 200);
                    path.lineTo(480, 280);
                    path.lineTo(120, 280);
                    path.closePath();
                    
                  } },
                  NoteEmitElement, { x: 160, y: 240, hits: 1, score: 1, resources: [ 'note1' ], brightness: 50, hue: 0, saturation: 100 },
                  NoteEmitElement, { x: 200, y: 240, hits: 1, score: 1, resources: [ 'note5' ], brightness: 50, hue: 60, saturation: 100 },
                  NoteEmitElement, { x: 240, y: 240, hits: 1, score: 1, resources: [ 'note4' ], brightness: 50, hue: 45, saturation: 100 },
                  NoteEmitElement, { x: 280, y: 240, hits: 1, score: 1, resources: [ 'note3' ], brightness: 50, hue: 30, saturation: 100 },
                  NoteEmitElement, { x: 320, y: 240, hits: 1, score: 1, resources: [ 'note5' ], brightness: 50, hue: 60, saturation: 100 },
                  NoteEmitElement, { x: 360, y: 240, hits: 1, score: 1, resources: [ 'note4' ], brightness: 50, hue: 45, saturation: 100 },
                  NoteEmitElement, { x: 400, y: 240, hits: 1, score: 1, resources: [ 'note1' ], brightness: 50, hue: 0, saturation: 100 },
                  NoteEmitElement, { x: 440, y: 240, hits: 1, score: 1, resources: [ 'note2' ], brightness: 50, hue: 15, saturation: 100 },
                  
                ] });                

game.add(background, title);
game.add(gameController);

gameController.add('start', lvl_start);
gameController.add('1', lvl_1);
gameController.add('2', lvl_2);

game.load({ note1: './wav/5.wav', note2: './wav/4.wav', note3: './wav/3.wav', note4: './wav/2.wav', note5: './wav/1.wav' }, function(res) {  
  
  
  game.start();
  
  gameController.load('2', game, res);
});

