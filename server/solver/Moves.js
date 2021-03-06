const Neighbours = require("./Neighbours");
const GameMap = require("./GameMap");
const Check = require("./Check");
const _ = require("lodash");
const LobbySettings = require("../LobbySettings");

module.exports = class Moves {
  // Find forced moves of all not finished colors
  static forcedMoves(node) {
    for (let i = 0; i < GameMap.numberOfColors; i++) {
      if (node.isFinished(i)) {
        continue;
      }

      /* Getting neighbours where current node can move,
            later check neighbours of this node possible moves */
      let moves = Neighbours.possibleMoves(node.mapState, i);

      for (const move of moves) {
        // Cloning the current node and making move in given direction
        let tempNode = _.cloneDeep(node);
        tempNode.updateMapState(i, move);

        // Finding all neighbours of the move made above
        const current = tempNode.mapState.current[i].Y;

        let neighbourMoves = Neighbours.allNeighbours(current.Y, current.X);
        let tilesCounter = 0;

        // Node must have only one neighbour
        if (neighbourMoves.length != 1) {
          return false;
        }

        for (const nMove of neighbourMoves) {
          if (
            nMove.X < GameMap.size - 1 &&
            tempNode.mapState.map[nMove.Y][nMove.X + 1] == "|"
          ) {
            tilesCounter++;
          }
          if (
            nMove.Y < GameMap.size - 1 &&
            tempNode.mapState.map[nMove.Y + 1][nMove.X] == "|"
          ) {
            tilesCounter++;
          }
          if (
            nMove.X > 0 &&
            tempNode.mapState.map[nMove.Y][nMove.X - 1] == "|"
          ) {
            tilesCounter++;
          }
          if (
            nMove.Y > 0 &&
            tempNode.mapState.map[nMove.Y - 1][nMove.X] == "|"
          ) {
            tilesCounter++;
          }

          for (let j = 0; j < GameMap.numberOfColors; j++) {
            if (tempNode.isFinished(j) || j == i) {
              continue;
            }

            if (
              nMove.X - 1 == tempNode.mapState.current[j].X &&
              nMove.Y == tempNode.mapState.current[j].Y
            ) {
              tilesCounter++;
            }
            if (
              nMove.X + 1 == tempNode.mapState.current[j].X &&
              nMove.Y == tempNode.mapState.current[j].Y
            ) {
              tilesCounter++;
            }
            if (
              nMove.X == tempNode.mapState.current[j].X &&
              nMove.Y - 1 == tempNode.mapState.current[j].Y
            ) {
              tilesCounter++;
            }
            if (
              nMove.X == tempNode.mapState.current[j].X &&
              nMove.Y + 1 == tempNode.mapState.current[j].Y
            ) {
              tilesCounter++;
            }
          }
        }

        if (tilesCounter == 0) {
          // console.log("FORCED2");
          return [move, i];
        }
      }

      /* If the above loop haven't found a neighbour with forced move then 
            forced move is only possible when node has only one neighbour */
      if (moves.length != 1) {
        continue;
      }
      // console.log("FORCED");
      return [moves[0], i];
    }
    return false;
  }

  // Making move on the given node - moving specific color with given cost to the given position
  static moveNode(node, moveTo, color, cost) {
    node.g += cost;
    node.updateMapState(color, moveTo);
    node.h = node.manhattan();

    // console.log("Make move");
    // console.log(_.cloneDeep(node.mapState.map));

    // Check if current pipe is one tile away from end point
    // This cause to check two times if the move is valid (even when first one is not)
    // TODO: Fix double checking valid node
    if (!LobbySettings.canTouch) {
      let moves = Neighbours.possibleMoves(node.mapState, color);
      for (const move of moves) {
        if (
          move.X == GameMap.endPoint[color].X &&
          move.Y == GameMap.endPoint[color].Y
        ) {
          this.moveNode(node, move, color, 0);
        }
      }
    }

    // If node doesn't meet requirements then return null
    if (Check.checkAll(node.mapState, color)) {
      return null;
    }

    return node;
  }

  /* Make all possible moves of given node. Start with forced moves, then
    generate moves for the first color or if it is finished take another one */
  static generateMoves(node) {
    let forced = this.forcedMoves(node);
    let moves = [];

    // If there is a point with a force move on the map state
    if (forced != false) {
      // Perform all the forced moves on the current map state
      while (forced != false) {
        var forcedNode = this.moveNode(node, forced[0], forced[1], 0);
        if (forcedNode == null) {
          return moves;
        }
        forced = this.forcedMoves(node);
      }
      moves.push(_.cloneDeep(forcedNode));
      return moves;
    }

    // Check how many colors are still unfinished
    let allColors = [...Array(GameMap.numberOfColors).keys()];
    let availableColors = allColors.filter(
      (x) => !node.mapState.finishedPoints.includes(x)
    );

    // Generate move for the first not finished color
    for (const color of availableColors) {
      let posMoves = Neighbours.possibleMoves(node.mapState, color);

      for (const posMove of posMoves) {
        let newNode = Moves.moveNode(_.cloneDeep(node), posMove, color, 1);

        if (newNode != null) {
          moves.push(newNode);
        }
      }
      /* This 'break' is causing that only one color is moving untill 
            it's finished (not counting forced moves) */
      break;
    }

    return moves;
  }
};
