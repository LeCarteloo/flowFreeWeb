class Node {
    constructor(){
        // Map state and number of free tiles
        this.mapState = new MapState();
        this.mapState.map = _.cloneDeep(Map.map);
        this.mapState.freeTiles = Map.size ** 2 - Map.numberOfColors;

        // Current position of every point (later - of last moved pipe of each point)
        for (let i = 0; i < Map.numberOfColors; i++) {
            this.mapState.current[i] = Map.startPoint[i];
        }
        this.g = 0;
        this.h = this.manhattan();
        this.parent = null;
        this.movesNumber = [];
    }
    // A bit modified manhattan distance - it returns remaining free cells beetwen points.
    manhattan() {
        var manhValue = 0; 
        //TODO: Check this out tomorrow smth is not right here

        // for (let i = 0; i < Map.numberOfColors; i++) {
        //     const curr = this.mapState.current[i];
        //     const end = Map.endPoint[i];
        //     manhValue += Math.abs(curr.X - end.X) + Math.abs(curr.Y - end.Y);
        //     console.log(manhValue);
        // }
        
        //! Wrote something just to test it out
        // for (let y = 0; y < Map.size; y++) {
        //     for (let x = 0; x < Map.size; x++) {
        //         if(this.mapState.map[y][x] == '0' || this.mapState.map[y][x] == '?') {
        //             manhValue++;
        //         }    

                // if(Map.map[y][x] == '0' || Map.map[y][x] == '?') {
                //     manhValue++;
                //     // console.log(_.cloneDeep(Map.map));
                // }
            // }
        // }

        manhValue = this.mapState.freeTiles;

        return manhValue;
    }

    //Check if point is finished
    isFinished() {
        return this.mapState.isFinished();
    }

    toString() {
        // return this.mapState;
    }

    getFCost() {
        return this.g + this.h;
    }

    setHCost(value) {
        this.h = value;
    }

    setCurrent(x, y, color) {
        this.mapState.current.splice(color, 1, {Y: y, X: x})
    }

    // Updating map state for given node
    updateMapState(color, position) {
        //TODO: Remove the extra array and work only on object
        // console.log(position);
        this.mapState.map[position[0].To.Y][position[0].To.X] = Map.foundColors[color];
        this.mapState.freeTiles--;

        const y = this.mapState.current[color].Y;
        const x = this.mapState.current[color].X;
        const pt = Map.endPoint[color]

        if(y - 1 == pt.Y && x == pt.X || y + 1 == pt.Y && x == pt.X
            || y == pt.Y && x - 1 == pt.X || y == pt.Y && x + 1 == pt.X) {
            this.mapState.finished.push(color)
        }

        this.setCurrent(position[0].To.X, position[0].To.Y, color);
    }
}