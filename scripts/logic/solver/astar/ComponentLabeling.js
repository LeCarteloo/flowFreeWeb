class ComponentLabeling {
  constructor() {
    // Creating empty array 2D with size of the map
    // -1 - Points
    this.labels = Array(GameMap.size)
      .fill()
      .map(() => Array(GameMap.size).fill('-1')); //! To -1 later
    // this.equivalent = new Map();
    this.equivalent = []; // Array(GameMap.size).fill('')
    this.nextLabel = 0;
    this.numberOfSectors = []; // = 0
    // HashMap
    this.union = new Map();
    this.currentPoint = [];
    this.endPoint = [];
  }

  //! changed
  fourConnectivity(map, y, x) {
    let result = [];

    if (x > 0 && map[y][x - 1] == "0") {
      // console.log("Left neighbour");
      result.push({ Y: y, X: x - 1 });
    }
    if (y > 0 && map[y - 1][x] == "0") {
      // console.log("Upp neighbour");
      result.push({ Y: y - 1, X: x });
    }

    return result;
  }

  // Connected-component labeling //!with Disjoint set
  // TODO: PERFORMANCE
  detectSectors(map) {
    // First run, '0' - is not background
    // Raster scan
    for (let y = 0; y < GameMap.size; y++) {
      for (let x = 0; x < GameMap.size; x++) {
        if (map[y][x] == "0") {
          let neighbours = this.fourConnectivity(map, y, x);
          if (neighbours.length == 0) {
            this.equivalent[this.nextLabel] = this.nextLabel.toString();
            this.labels[y][x] = this.nextLabel;
            this.union.set(this.nextLabel, this.nextLabel)
            this.nextLabel++;
          } else {
            let label = [];
            neighbours.forEach(neighbour => {
              label.push(this.labels[neighbour.Y][neighbour.X]);
            });
            this.labels[y][x] = Math.min(...label);
            label.forEach((l) => {
              if(this.labels[y][x] != l) {
                this.equivalent[l] += this.labels[y][x];
                this.equivalent[this.labels[y][x]] += l;

              }
            });
          }
        }
        // console.log(this.equivalent);
      }
    }
    // this.printLabels(this.labels)

    //! If got time change it
    for (let i = 0; i < this.equivalent.length; i++) {
      for (let j = 0; j < this.equivalent[i].length; j++) {
        if(this.equivalent[i][j] == i) {
          continue;
        }
        
        let ts = parseInt(Math.min(...this.equivalent[Math.min(...this.equivalent[i])]));
        if(ts < parseInt(this.equivalent[i][j]) && ts < this.union.get(parseInt(this.equivalent[i][j]))) {
          this.union.set(parseInt(this.equivalent[i][j]), ts)
        }
      }
    }

    // console.log(this.union);

    // Second run
    for (let y = 0; y < GameMap.size; y++) {
      for (let x = 0; x < GameMap.size; x++) {
        if (map[y][x] == "0") {
            this.labels[y][x] = this.union.get(this.labels[y][x]);
            // TODO: (NOTE)
            if (!this.numberOfSectors.includes(this.labels[y][x])) {
              this.numberOfSectors.push(this.labels[y][x]);
            }
        }
      }
    }
    // console.log('');
    // this.printLabels(this.labels)
  }

  printLabels(labels) {
    for (let y = 0; y < labels.length; y++) {
      console.log(labels[y]);
    }
  }
  // Add points to detected sectors
  addPointsToSectors(mapState) {
    // TODO: IMPORTANT NUMBER OF SECTORS COULD BE LARGER THAN NUMBER OF COLORS
    for (let i = 0; i < GameMap.numberOfColors; i++) {
      this.currentPoint[i] = "";
      this.endPoint[i] = "";
    }

    for (let j = 0; j < GameMap.numberOfColors; j++) {
      // Finish condition
      //TODO: IMPORTANT ADD TO ARRAY AFTER FINISHING COLOR (in Moves.js)
      if (mapState.isFinished(j)) {
        continue;
      }

      let neighboursOfCurrent = Moves.testMoves(mapState, j);
      // let temp = [];
      neighboursOfCurrent.forEach((neighbour) => {
        const y = neighbour.To.Y;
        const x = neighbour.To.X;
        if (
          this.labels[y][x] != -1 &&
          !this.currentPoint[this.labels[y][x]].includes(j)
        ) {
          this.currentPoint[this.labels[y][x]] += j.toString();
          // this.currentPoint.splice(this.labels[y][x], 0, j.toString())
        }
      });

      let neighboursOfEnd = this.possibleMoves(j);

      neighboursOfEnd.forEach((neighbour) => {
        const y = neighbour.To.Y;
        const x = neighbour.To.X;
        if (
          this.labels[y][x] != -1 &&
          !this.endPoint[this.labels[y][x]].includes(j)
        ) {
          this.endPoint[this.labels[y][x]] += j.toString();
        }
      });
    }

    // console.log(this.labels);
    // console.log("current ", this.currentPoint);
    // console.log("end ", this.endPoint);
  }

  isStranded(mapState) {
    // Hardcoded number of generated sectors
    // let sectorNum = 2;
    this.detectSectors(mapState.map);
    this.addPointsToSectors(mapState);

    //! ?
    let colorsInSectors = [];

    // console.log(this.numberOfSectors.length);

    for (let i = 0; i < this.numberOfSectors.length; i++) {
      const curr = this.currentPoint[i];
      const end = this.endPoint[i];
      // console.log(this.currentPoint);
      // console.log(this.endPoint);
      // console.log(this.currentPoint[i]);

      if (
        (curr.length > 0 && end.length == 0) ||
        (end.length > 0 && curr.length == 0)
      ) {
        return true;
      }

      for (let c = 0; c < curr.length; c++) {
        for (let e = 0; e < end.length; e++) {
          if (this.currentPoint[i][c] == this.endPoint[i][e]) {
            if (!colorsInSectors.includes(this.endPoint[i][e])) {
              colorsInSectors.push(this.endPoint[i][e]);
            }
            break;
          }
        }
      }
    }
    // console.log(colorsInSectors);
    if (colorsInSectors.length != GameMap.numberOfColors - GameMap.finishedPoints.length) {
      return true;
    }

    return false;
  }

  //TODO: Remove this function and wrote it in Moves.js
  possibleMoves(color) {
    let result = [];
    const y = GameMap.endPoint[color].Y;
    const x = GameMap.endPoint[color].X;
    const map = GameMap.map;

    if (x < GameMap.size - 1 && map[y][x + 1] == "0") {
      // console.log("Left neighbour");
      result.push({ From: { Y: y, X: x }, To: { Y: y, X: x + 1 } });
    }
    if (x > 0 && map[y][x - 1] == "0") {
      // console.log("Right neighbour");
      result.push({ From: { Y: y, X: x }, To: { Y: y, X: x - 1 } });
    }
    if (y < GameMap.size - 1 && map[y + 1][x] == "0") {
      // console.log("Upp neighbour");
      result.push({ From: { Y: y, X: x }, To: { Y: y + 1, X: x } });
    }
    if (y > 0 && map[y - 1][x] == "0") {
      // console.log("Down neighbour");
      result.push({ From: { Y: y, X: x }, To: { Y: y - 1, X: x } });
    }

    return result;
  }
}
