"use strict";

class Tools {
  static randomInt(start, finish) {
    // return Math.floor(Math.random() * finish) + start;
    return Math.floor(Math.random() * (finish - start)) + start;
  }

  static avergeLength(values) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    return parseInt(sum / values.length);
  }

  static objectCopy(object) {
    Object.assign({}, object)
  }
}

class Map {
  constructor(width, height, gridStep, types, hide = false) {
    let canvas = document.getElementById('canvasMap');
    canvas.width  = width;
    canvas.height = height;
    this.hidden = hide;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.gridStep = gridStep;
    this.types = types;
    this.items = [];
    this.fillGrid();
    this.fillItemsArray();
    this.currentStep = 0;
  }

  writeText(x,y,content) {
    this.ctx.font = "10px arial";
    this.ctx.fillStyle = "black";
    this.ctx.textBaseline="middle";
    this.ctx.fillText(content,(x * this.gridStep) + 1, (y * this.gridStep) + (this.gridStep / 2));
  }

  fillGrid() {
    if (!this.hidden) {
      for (let i = this.width; i >= 0; i -= this.gridStep) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#808080';
        this.ctx.moveTo(i, 0);
        this.ctx.lineTo(i, this.height);
        this.ctx.stroke();
        this.ctx.closePath();
      }

      for (let i = this.height; i >= 0; i -= this.gridStep) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#808080';
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(this.width, i);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
  }

  fillItemsArray() {
    for (let i = this.width; i >= 0; i -= this.gridStep) {
      this.items[i / this.gridStep] = [];
      this.items[-1] = [];
      this.items[this.width / this.gridStep] = [];
      for (let j = this.height; j >= 0; j -= this.gridStep) {
        this.items[i / this.gridStep][j / this.gridStep] = null;

        //build wall
        this.items[i / this.gridStep][-1] = 'wall';
        this.items[i / this.gridStep][this.height / this.gridStep] = 'wall';
        this.items[-1][-1] = 'wall';
        this.items[-1][this.height / this.gridStep] = 'wall';
        this.items[-1][j / this.gridStep] = 'wall';
        this.items[this.width / this.gridStep][this.height / this.gridStep] = 'wall';
        this.items[this.width / this.gridStep][-1] = 'wall';
        this.items[this.width / this.gridStep][j / this.gridStep] = 'wall';
      }
    }
  }

  fillCoordinate(x, y, type) {
    let busy = this.items[x][y];
    this.items[x][y] = type;
    this.renderMap();
    return busy;

  }

  renderMap() {
    for (let x = 0; x < this.items.length; x++) {
      for (let y = 0; y < this.items[x].length; y++) {
        if (this.items[x][y] && !this.hidden) {
          this.ctx.beginPath();
          this.ctx.fillStyle = this.types[this.items[x][y]];
          this.ctx.fillRect(x * this.gridStep, y * this.gridStep, this.gridStep, this.gridStep);
          this.ctx.stroke();
        }
      }
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  moveItem(oldX, oldY, newX, newY) {
    let type = this.items[oldX][oldY];
    if (
      type &&
      newX >= 0 &&
      newX < this.width / this.gridStep &&
      newY >= 0 &&
      newY < this.width / this.gridStep &&
      this.items[newX][newY] !== 'bot'
    ) {
      this.clearCanvas();
      this.fillGrid();
      this.items[oldX][oldY] = null;
      let busy = this.items[newX][newY];
      this.items[newX][newY] = type;
      this.renderMap();
      return (busy ? busy : true);
    } else {
      return false;
    }
  }

  showAround(x,y, visionRange) {
    let allItems = this.getItems();
    let typesArray = Object.getOwnPropertyNames(this.types);
    let aroundItems = {};
    for (let i = 0; i < typesArray.length; i++) {
      aroundItems[typesArray[i]] = [];
      for (let elem = 0; elem < allItems[typesArray[i]].length; elem++) {
        if (
          allItems[typesArray[i]][elem].x >= x - visionRange &&
          allItems[typesArray[i]][elem].x <= x + visionRange &&
          allItems[typesArray[i]][elem].y >= y - visionRange &&
          allItems[typesArray[i]][elem].y <= y + visionRange &&
          !(
            allItems[typesArray[i]][elem].y === y &&
            allItems[typesArray[i]][elem].x === x
          )
        ) {
          aroundItems[typesArray[i]].push(allItems[typesArray[i]][elem]);
        }
      }
    }
    return aroundItems;
  }

  getItems() {
    let typesArray = Object.getOwnPropertyNames(this.types);
    let items = {};
    for (let i = 0; i < typesArray.length; i++) {
      items[typesArray[i]] = [];
    }
    items.wall = [];
    for (let x = -1; x < this.items.length; x++) {
      for (let y = -1; y < this.items[x].length; y++) {
        if (this.items[x][y]) {
          items[this.items[x][y]].push({x: x, y: y})
        }
      }
    }
    return items;
  }

  getTime() {
    return this.currentStep;
  }

  nextStep() {
    return this.currentStep++;
  }

  dropTime() {
    this.currentStep = 0;
  }
}

class Player {
  constructor (parameters) {
    this.genome = parameters;
    this.map = parameters.map;
    this.map.fillCoordinate(parameters.coordinates.x, parameters.coordinates.y, 'bot');
    this.x = parameters.coordinates.x;
    this.y = parameters.coordinates.y;
    this.visionRange = parameters.visionRange;
    this.heals = parameters.heals;

    this.comeFrom = {x: this.x, y: this.y - 1};

    this.MoveActionsVariants = [];
    this.MoveActionsVariants[0] = this.go(-1, -1);
    this.MoveActionsVariants[1] = this.go(0, -1);
    this.MoveActionsVariants[2] = this.go(1, -1);
    this.MoveActionsVariants[3] = this.go(1, 0);
    this.MoveActionsVariants[4] = this.go(1, 1);
    this.MoveActionsVariants[5] = this.go(0, 1);
    this.MoveActionsVariants[6] = this.go(-1, 1);
    this.MoveActionsVariants[7] = this.go(-1, 0);

    this.actionsVariants = [];
    this.actionsVariants[0] = this.checkAround;
    this.actionsVariants[1] = this.moveToTarget;
    this.actionsVariants[2] = this.runAwayTarget;
    this.actionsVariants[3] = this.buildStepsGrid;

    this.typesAction = {
      eat: (() => {
        this.heals += 10;
        console.log('eat');
      }),
      poison: (() => {
        this.heals = 0;
        console.log('poison')
      }),
      wall: (() => {
        this.heals -= 10;
      })
    };

    this.typesModelAction = parameters.actions;
    this.memory = [];
    this.memorySize = parameters.memorySize;
  }

  tick(num = null) {
    this.heals--;
    if (this.heals < 0) {
      delete this;
    }
    this.action(num ? num : Tools.randomInt(0,8));
    console.log(this.heals);
  }

  action(num) {
    let actionResult = this.MoveActionsVariants[num]();
    if (num < 8 && actionResult) {
      if (typeof(actionResult) !== 'boolean') {
        this.typesAction[actionResult]();
      }
    } else {
      console.log(actionResult);
      console.log('bot can not do this action, or wrong action num');
    }
  }

  go(xD = 0, yD = 0) {
    return (()=>{
      let result = this.map.moveItem(this.x, this.y, this.x + xD, this.y + yD);
      if (result) {
        this.x += xD;
        this.y += yD;
      }
      return result;
    })
  }
  
  checkAround() {
    let aroundItems = this.map.showAround(this.x, this.y, this.visionRange);
    let typesArray = Object.getOwnPropertyNames(aroundItems);
    let target = false;
    this.allItemsAround = [];
    for (let i = 0; i < typesArray.length; i++) {
      for (let j = 0; j < aroundItems[typesArray[i]].length; j++) {
        let item = aroundItems[typesArray[i]][j];
        item.delta = Math.max(Math.abs(item.x - this.x), Math.abs(item.y - this.y));
        item.type = typesArray[i];
        item.priority = this.typesModelAction[typesArray[i]].priority[item.delta - 1];
        if (target === false || item.priority > target.priority) {
          target = item;
        }
        this.allItemsAround.push(item);
      }
    }
    this.target = target;
  }

  buildStepsGrid() {
    ////
    this.checkAround();
    ////

    let priorities = [];
    let currentStep = this.map.getTime();
    for (let x = (this.x - this.visionRange); x <= (this.x + this.visionRange); x++) {
      priorities[x] = [];
      if (!this.memory[x]) {
        this.memory[x] = [];
      }
      for (let y = (this.y - this.visionRange); y <= (this.y + this.visionRange); y++) {
        // if (x >= 0 && y >= 0) {
          this.memory[x][y] = {type: 'empty', time: currentStep};
        // }
        if (!(y === this.y && x === this.x)) {
          priorities[x][y] = this.typesModelAction.empty.priority[Math.max(Math.abs(this.x - x), Math.abs(this.y - y)) -1];
        }
      }
    }

    //fill memory
    for (let i = 0; i < this.allItemsAround.length; i++) {
      // console.log(this.allItemsAround[i]);
      if (!this.memory[this.allItemsAround[i].x][this.allItemsAround[i].y]) {

      }
      this.memory[this.allItemsAround[i].x][this.allItemsAround[i].y].type = this.allItemsAround[i].type;
      for (let x = (this.allItemsAround[i].x - this.visionRange); x <= (this.allItemsAround[i].x + this.visionRange); x++) {
        for (let y = (this.allItemsAround[i].y - this.visionRange); y <= (this.allItemsAround[i].y + this.visionRange); y++) {
          if (priorities[x] !== undefined && priorities[x][y] !== undefined) {
            let priorityWeight = Math.max(Math.abs(x - this.allItemsAround[i].x), Math.abs(y - this.allItemsAround[i].y));
            priorities[x][y] += (this.typesModelAction[this.allItemsAround[i].type].priority[priorityWeight] ? this.typesModelAction[this.allItemsAround[i].type].priority[priorityWeight] : 0);
          }
        }
      }
    }

    //memory injection
    for (let x = (this.x - this.visionRange); x <= (this.x + this.visionRange); x++) {
      for (let y = (this.y - this.visionRange); y <= (this.y + this.visionRange); y++) {
        if (!(y === this.y && x === this.x)) {

          let additionalWeight = 0;
          for (let xM = 0; xM < this.memory.length; xM++) {
            if (this.memory[xM]) {
              for (let yM = 0; yM < this.memory[xM].length; yM++) {
                if (this.memory[xM][yM] && this.memory[xM][yM].time !== currentStep) {
                  let distance = Math.max(Math.abs(x - xM), Math.abs(y - yM));
                  let distancePriority = this.typesModelAction[this.memory[xM][yM].type].priority[distance] ?
                    this.typesModelAction[this.memory[xM][yM].type].priority[distance] :
                    (
                      this.typesModelAction[this.memory[xM][yM].type].priority[this.typesModelAction[this.memory[xM][yM].type].priority.length - 1] +
                      (this.typesModelAction[this.memory[xM][yM].type].distanceDelta * (distance - this.typesModelAction[this.memory[xM][yM].type].priority.length))
                    );
                  additionalWeight += distancePriority + ((currentStep - this.memory[xM][yM].time) * this.typesModelAction[this.memory[xM][yM].type].memoryDelta);
                }
              }
            }
          }
          // console.log(additionalWeight);
          priorities[x][y] += additionalWeight;
        }
      }
    }
    //end memory injection


    // console.log(this.memory);
    this.prioritesPath = priorities;
    // this.showPriorites();
  }

  showPriorites() {
    for (let x = 0; x < this.prioritesPath.length; x++) {
      if (this.prioritesPath[x]) {
        for (let y = 0; y < this.prioritesPath[x].length; y++) {
          if (this.prioritesPath[x][y]) {
            this.map.writeText(x,y,this.prioritesPath[x][y]);
          }
        }
      }
    }
  }

  memoryCleaner() {
    let currentStep = this.map.getTime();
    for (let xM = 0; xM < this.memory.length; xM++) {
      if (this.memory[xM]) {
        for (let yM = 0; yM < this.memory[xM].length; yM++) {
          if (this.memory[xM][yM] && this.memory[xM][yM].time < (currentStep - this.memorySize)) {
            this.memory[xM][yM] = undefined;
          }
        }
      }
    }
  }

  goOptimatePath() {
    ////
    this.buildStepsGrid();
    ////
    let paths = [];
    for (let x = 0; x < this.prioritesPath.length; x++) {

      if (this.prioritesPath[x]) {
        for (let y = 0; y < this.prioritesPath[x].length; y++) {
          if (Math.max(Math.abs(x - this.x), Math.abs(y - this.y)) < 2) {
            if (!paths[this.prioritesPath[x][y]]) {
              paths[this.prioritesPath[x][y]] = [{x, y}];
            } else {
              paths[this.prioritesPath[x][y]].push({x, y});
            }
          }
        }
      }
    }


    if (typeof(paths) === 'object') {
      let objectKeys = Object.getOwnPropertyNames(paths);
      let value = -999999;
      for (let i = 0; i < objectKeys.length; i++) {
        let nValue = parseInt(objectKeys[i]);
        value = ((value < nValue) ? nValue : value);
      }
      this.target = paths[value][Tools.randomInt(0, paths[value].length)];
    } else {
      this.target = paths[paths.length - 1][Tools.randomInt(0, paths[paths.length - 1].length)];
    }
    this.moveToTarget();
    this.memoryCleaner();
  }


  moveToTarget() {
    if (this.target) {
      let xD, yD;
      if (this.x > this.target.x) {
        xD = -1;
      } else if (this.x === this.target.x) {
        xD = 0;
      } else {
        xD = 1;
      }
      if (this.y > this.target.y) {
        yD = -1;
      } else if (this.y === this.target.y) {
        yD = 0;
      } else {
        yD = 1;
      }

      let actionResult = this.go(xD, yD)();
      if (actionResult) {
        if (typeof(actionResult) !== 'boolean') {
          this.typesAction[actionResult]();
        }
      } else {
        // console.log(actionResult);
        // console.log('bot can not do this action, or wrong action num');
      }
    }
  }

  runAwayTarget() {
    if (this.target) {
      let xD, yD;
      if (this.x > this.target.x) {
        xD = 1;
      } else if (this.x === this.target.x) {
        xD = 0;
      } else {
        xD = -1;
      }
      if (this.y > this.target.y) {
        yD = 1;
      } else if (this.y === this.target.y) {
        yD = 0;
      } else {
        yD = -1;
      }

      let actionResult = this.go(xD, yD)();
      if (actionResult) {
        if (typeof(actionResult) !== 'boolean') {
          this.typesAction[actionResult]();
        }
      } else {
        // console.log(actionResult);
        // console.log(xD, yD);
        // console.log('bot can not do this action, or wrong action num');
      }
    }
  }
}


class geneticAlgorithm {
  constructor(map, genomeDefaultParameters, types, botsCount, lifeCycles, smartGenomesCount) {
    this.map = map;
    this.types = types;
    this.genomeDefaultParameters = genomeDefaultParameters;
    this.smartGenomesCount = smartGenomesCount;

    this.botsCount = botsCount;
    this.lifeCycles = lifeCycles;

    this.smartGenomes = [];
  }

  generate(count, type) {
    for (let i = 0; i < count; i++) {
      this.map.fillCoordinate(Tools.randomInt(0,this.map.width / this.map.gridStep), Tools.randomInt(0,this.map.height / this.map.gridStep), type)
    }
  }


  worldStart() {
    for (let i = 0; i < this.lifeCycles; i++) {
      console.log('cycle: ' + i);
      this.startCycle();
    }
  }

  startCycle() {
    this.counter = 0;
    this.map.clearCanvas();
    this.map.fillGrid();
    this.map.fillItemsArray();
    this.map.dropTime();
    this.generate(this.botsCount * 6, 'eat');
    // this.generate(this.botsCount * 3, 'poison');
    this.bots = [];
    this.botsFactory();
    this.lifeBots = this.bots.length;
    this.smartGenomes = [];
    this.botsStatistic = {lifeLength: [], smartLifeLength: []};
    while (this.lifeBots > 0 && this.counter < 100) {
      this.worldStep();
      this.counter++;
      if (this.counter === 99) {
        console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      }
    }
    console.log(Tools.avergeLength(this.botsStatistic.lifeLength));
    console.log(this.bots);
    console.log(this.smartGenomes);
  }

  botsFactory() {
    if (this.smartGenomes.length === 0) {
      for (let i = 0; i < this.botsCount; i++) {
        this.bots.push({bot: new Player(this.generateGenome())});
      }


      //add one smart
      let smartGenome = {
        visionRange: 2,
        coordinates :{x: 10, y: 10},
        memorySize: 5,
        actions: {
          bot: {
            priority: [-100, 0, 0, 0, 0, 0, 0, 0, 0],
            memoryDelta: 0,
            distanceDelta: 1
          },
          eat: {
            priority: [900 ,200, 180, 160, 140, 120, 110, 100, 90],
            memoryDelta: 1,
            distanceDelta: 1
          },
          poison: {
            priority: [-100, 0, 0, 0, 0, 0, 0, 0, 0],
            memoryDelta: 1,
            distanceDelta: 1
          },
          wall: {
            priority: [-70, -60, -50, 0, 0, 0, 0, 0, 0],
            memoryDelta: 0,
            distanceDelta: -5
          },
          empty: {
            priority: [-9,-8,-7,-6,-5,-4,-3,-2,-1],
            memoryDelta: 0,
            distanceDelta: 1
          }
        },
        heals: 100,
        map: this.map
      };
      this.bots.push({bot: new Player(smartGenome)});
      //add one smart



    } else {
      for (let father = 0; father < this.smartGenomes.length; father++) {
        for (let mather = 0; mather < this.smartGenomes.length; mather++) {
          // if (father !== mather) {
            for (let child = 0; child < 4; child++) {
              this.bots.push({bot: new Player(this.generateGenome(this.smartGenomes[father], this.smartGenomes[mather], child))});

              // console.group('genome');
              // console.log('father:');
              // console.log(this.smartGenomes[father].genome.actions);
              // console.log('mather:');
              // console.log(this.smartGenomes[mather].genome.actions);
              // console.groupEnd();
            }
          // }
        }
      }
    }
  }

  generateGenome(father, mather, mutationPercent) {
    let genome = this.genomeDefaultParameters;

    genome.coordinates = {x: Tools.randomInt(0,this.map.width / this.map.gridStep), y: Tools.randomInt(0,this.map.height / this.map.gridStep)};
    genome.actions = {};
    let deep = 10;
    if (!father && !mather) {
      for (let i = 0; i < this.types.length; i++) {
        genome.actions[this.types[i]] = {
          memoryDelta: Tools.randomInt(-2,3),
          distanceDelta: Tools.randomInt(-2,3),
          priority: []
        };
        for (let deepStep = 0; deepStep < deep; deepStep++) {
          genome.actions[this.types[i]].priority.push(Tools.randomInt(-100,100));
        }
      }
    } else {
      for (let i = 0; i < this.types.length; i++) {
        let smartCoefficient = ( .5 - (1 - (Math.max(father.lifeLength, mather.lifeLength) / Math.min(father.lifeLength, mather.lifeLength))));
        genome.actions[this.types[i]] = (
          smartCoefficient > Math.random() ?
            (Math.max(father.lifeLength, mather.lifeLength) === father.lifeLength ? Object.assign({}, father.genome.actions[this.types[i]]) : Object.assign({}, mather.genome.actions[this.types[i]])) :
            (Math.min(father.lifeLength, mather.lifeLength) === father.lifeLength ? Object.assign({}, father.genome.actions[this.types[i]]) : Object.assign({}, mather.genome.actions[this.types[i]]))
        );
        if (this.types[i] === 'eat') {
          // console.log(Object.assign({}, mather.genome.actions[this.types[i]]));
          // console.log(Object.assign({}, father.genome.actions[this.types[i]]));
          // console.log(( .5 - (1 - (Math.max(father.lifeLength, mather.lifeLength) / Math.min(father.lifeLength, mather.lifeLength)))) > Math.random());
        }
        genome.actions[this.types[i]].memoryDelta += (Tools.randomInt(0,100) < mutationPercent ? Tools.randomInt(-1, 2) : 0);
        genome.actions[this.types[i]].distanceDelta += (Tools.randomInt(0,100) < mutationPercent ? Tools.randomInt(-1, 2) : 0);
        for (let priority = 0; priority < genome.actions[this.types[i]].priority.length; priority++) {
          genome.actions[this.types[i]].priority[priority] += (Tools.randomInt(0,100) < mutationPercent ? Tools.randomInt(-5, 6) : 0);
        }
      }
      // console.group('genome');
      // console.log('father:');
      // console.log(father.genome.actions);
      // console.log('mather:');
      // console.log(mather.genome.actions);
      // console.log('child:');
      // console.log(genome.actions);
      // console.groupEnd('genome');
    }
    genome = JSON.parse(JSON.stringify(genome));
    // genome = Object.assign({}, genome);
    genome.map = this.map;
    return genome;
    // return Tools.objectCopy(genome);
  }

  worldStep() {
    for (let i = 0; i < this.bots.length; i++) {
      if (this.bots[i].bot.heals > 0) {
        this.bots[i].bot.goOptimatePath();
        this.bots[i].bot.heals -= 5;
        if (this.bots[i].bot.heals <= 0) {
          this.bots[i].longLife = this.map.getTime();
          this.botsStatistic.lifeLength.push(this.bots[i].longLife);
          if (this.lifeBots <= this.smartGenomesCount) {
            this.botsStatistic.smartLifeLength.push(this.bots[i].longLife);
            this.smartGenomes.push({lifeLength: this.bots[i].longLife, genome: this.bots[i].bot.genome});
          }
          this.lifeBots--;
        }
      }
    }
    this.map.nextStep();
  }

}

let genomeDefaultParameters = {
  visionRange: 2,
  memorySize: 5,
  heals: 250
};


let map = new Map(1350, 750, 15, {
  bot: '#292929',
  eat: '#ef6767',
  poison: '#0dffae',
  wall: '#8e8c8c'
}, true);



let world = new geneticAlgorithm(map, genomeDefaultParameters, ['bot', 'eat', 'poison', 'wall', 'empty'], 64, 3, 4);


// let bot = new Player({
//   visionRange: 2,
//   coordinates :{x: 10, y: 10},
//   memorySize: 5,
//   actions: {
//     bot: {
//       priority: [-100, 0, 0, 0, 0, 0, 0, 0, 0],
//       memoryDelta: 0,
//       distanceDelta: 1
//     },
//     eat: {
//       priority: [900 ,200, 180, 160, 140, 120, 110, 100, 90],
//       memoryDelta: 1,
//       distanceDelta: 1
//     },
//     poison: {
//       priority: [-100, 0, 0, 0, 0, 0, 0, 0, 0],
//       memoryDelta: 1,
//       distanceDelta: 1
//     },
//     wall: {
//       priority: [-70, -60, -50, 0, 0, 0, 0, 0, 0],
//       memoryDelta: 0,
//       distanceDelta: -5
//     },
//     empty: {
//       priority: [-9,-8,-7,-6,-5,-4,-3,-2,-1],
//       memoryDelta: 0,
//       distanceDelta: 1
//     }
//   },
//   heals: 100,
//   map: map
// });
// world.generateEat(20);
// world.step();
