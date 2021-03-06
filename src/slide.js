/* eslint eqeqeq: [0, "smart"] */

var app = angular.module('slideApp', ['ngAnimate']);

/**
 * gameModes - Save game configuraions
 *
 * @return {object} this instance of serviec.
 */
app.service('gameModes', function () {
  this.modes = {
    beginner: {
      row: 3,
      column: 3,
      elasped: 240000
    },
    amateur: {
      row: 4,
      column: 4,
      elasped: 3600000
    },
    semipro: {
      row: 5,
      column: 5,
      elasped: 7200000
    },
    professional: {
      row: 6,
      column: 6,
      elasped: 10800000
    },
    legendary: {
      row: 8,
      column: 8,
      elasped: 14400000
    }
  };

  this.defaultMode = Object.keys(this.modes)[0];

  this.get = function (mode) {
    if (mode) {
      return this.modes[mode];
    }
    return this.modes[this.defaultMode];
  };
});

app.controller('slideCtrl', function ($scope, $interval, Game, gameModes,
  save) {
  var game;
  var delay = 1000;
  var timerInstance;

  /**
   * closeevent - fires when tab / winow is closed.
   *
   */
  function closeevent() {
    var data = {
      model: $scope.game.grid,
      history: $scope.game.history,
      time: $scope.game.elasped,
      mode: $scope.game.mode
    };
    save.set(data);
  }

  $scope.init = function () {
    var savedGame = save.get();
    if (savedGame) {
      $scope.newGame(savedGame.mode, savedGame.model,
          savedGame.history, savedGame.time);
    } else {
      $scope.newGame();
    }
  };

  $scope.game = {};
  $scope.game.history = [];
  $scope.game.modes = gameModes.modes;

  /**
   * newGame - Define new game.
   */
  $scope.newGame = function (mode, model, history, time) {
    var type = gameModes.get(mode);
    $scope.game.solved = false;
    $scope.game.mode = mode || gameModes.defaultMode;
    $scope.game.history = history || [];
    $scope.game.elasped = time || type.elasped;
    game = new Game(type.row, type.column);
    $scope.game.grid = model || game.newGame();
    if (timerInstance) {
      $interval.cancel(timerInstance);
    }
    timerInstance = $interval(function () {
      $scope.game.elasped -= delay;
    }, delay);
    // saves the first time data.
    closeevent();
  };

  /**
   * move - move the paddle
   *
   * @param  {number} x description
   * @param  {number} y description
   */
  $scope.move = function (x, y) {
    game.move($scope.game.grid, x, y).then(function (resp) {
      $scope.game.grid = resp.model;
      $scope.game.history.push(resp);
    });
  };

  /**
   * solve - autosolve the game
   */
  $scope.solve = function () {
    $scope.game.grid = game.solve();
  };

  /**
   * Keep watching the model.
   */
  $scope.$watch('game.grid', function () {
    if (_.isEqual($scope.game.grid, game.solve())) {
      $scope.game.solved = true;
      save.remove();
      $interval.cancel(timerInstance);
    }
  });

  /**
   * On window close
   */
  window.onbeforeunload = closeevent;
});

app.factory('Game', function ($q) {
  /**
   * shuffleArray - Shuffle an array in random order
   *
   * @param  {array} arr an array
   * @return {array}     shuffled array
   */
  function shuffleArray(arr) {
    var p = arr.slice();
    p.sort(function () {
      return 0.5 - Math.random();
    });
    return p;
  }

  /**
   * newGame - Desing new game, make model
   *
   * @return {object}  model
   */
  function newGame() {
    var elem;
    var solvedArray;
    for (;;) {
      elem = this.shuffleArray(this.elements);
      if (this.isSolvable(elem)) {
        solvedArray = elem;
        break;
      }
    }

    return this.makeModel(solvedArray);
  }

  /**
   * solve - solve the game
   *
   * @return {object} solved mode
   */
  function solve() {
    var arr = angular.copy(this.elements);
    var removedItem = arr.shift();
    arr.push(removedItem);
    this.moves = 0;
    return this.makeModel(arr);
  }

  /**
   * makeModel - make model for the matrix
   *
   * @param  {type} arr an arrry to deign a model
   * @return {type}     model, matrix sliced in collection.
   */
  function makeModel(arr) {
    var model = {};
    var elem;
    var x = this.x;
    var y = this.y;
    var j = 0;
    var i;
    for (i = 0; i < x * y; i += y) {
      elem = arr.slice();
      model[j] = elem.splice(i, y);
      j += 1;
    }
    this.currentModel = model;
    return model;
  }

  /**
   * pivot - it is the blank tile
   *
   * @param  {object} model  description
   * @param  {number} anchor element of which you find to location, here 0.
   * @return {object}        pos in x & y.
   */
  function pivot(model, anchor) {
    var pos = _.reduce(model, function (result, value, key) {
      var k = value.indexOf(anchor);
      if (k > -1) {
        result.x = parseInt(key, 10);
        result.y = k;
      }
      return result;
    }, {});
    return pos;
  }

  /**
   * directions - calculate the possible direction to move tile.
   *
   * @param  {number} x x co-ordindate
   * @param  {number} y y co-ordindate
   * @return {object}   description , up, down, left, right
   */
  function directions(x, y) {
    var dir = {};
    // down
    if (x + 1 < this.x) {
      dir.down = {
        x: x + 1,
        y: y
      };
    }

    // right
    if (y + 1 < this.y) {
      dir.right = {
        x: x,
        y: y + 1
      };
    }

    // up
    if (x - 1 >= 0) {
      dir.up = {
        x: x - 1,
        y: y
      };
    }

    // left
    if (y - 1 >= 0) {
      dir.left = {
        x: x,
        y: y - 1
      };
    }
    return dir;
  }

  /**
   * checkMove - check that an element can be move or not, cross check with
   * directions object.
   *
   * @param  {object} dirs directions up, down, left, right
   * @param  {number} x    x co-ordindate
   * @param  {type} y    y co-ordindate
   * @return {object}    result witth staus, direction, and postion.
   */
  function checkMove(dirs, x, y) {
    return _.reduce(dirs, function (result, value, key) {
      if (value.x == x && value.y == y) {
        result.status = true;
        result.direaction = key;
        result.pos = value;
      }
      return result;
    }, {});
  }

  /**
   * move - make the move,
   *
   * @param  {object} model
   * @param  {number} x     x co-ordindate
   * @param  {number} y     x co-ordindate
   * @return {promise}
   */
  function move(model, x, y) {
    var deferred = $q.defer();
    var piv = this.pivot(model, 0);
    var dirs = this.directions(piv.x, piv.y);
    var mov = this.checkMove(dirs, x, y);
    var temp;
    if (mov.status) {
      // Swaping the values in model
      temp = model[x][y];
      model[x][y] = model[piv.x][piv.y];
      model[piv.x][piv.y] = temp;
      this.moves += 1;
      this.currentModel = model;
      deferred.resolve({
        model: model,
        new: mov,
        old: piv,
        value: temp
      });
    } else {
      deferred.reject('Can not move here');
    }
    return deferred.promise;
  }

  /**
   * isSolvable - count number of inversion
   *
   * @return {boolean}  true/false
   */
  function isSolvable(arr) {
    // counting empty location from bottom.
    var arrReverse = angular.copy(arr).reverse();
    var arryInv = angular.copy(arr);
    var inversionCount;
    var emptyLoc = Math.ceil((arrReverse.indexOf(0) + 1) / this.y);
    // Removing 0.
    arryInv.splice(arryInv.indexOf(0), 1);
    inversionCount = arryInv.reduce(function (result, value, key, self) {
      return self.slice(key).filter(function (b) {
        return b < value;
      }).map(function (b) {
        return [value, b];
      }).concat(result);
    }, []).length;

    // width is odd
    if (this.x % 2 === 1) {
      return inversionCount % 2 === 0;
    }
    // width is even && inversion count is odd
    if (inversionCount % 2 === 1) {
      // then emptyLoc from bottom would be even
      return (emptyLoc % 2 === 0);
    }
    // width is even && inversion count is even then emptyLoc would be odd
    return (emptyLoc % 2 === 1);
  }

  /**
   * Board - constructor
   *
   * @param  {number} x number of rows
   * @param  {type} y number of columns
   */
  function Board(x, y) {
    this.x = x;
    this.y = y;
    this.elements = _.range(x * y);
    this.newGame = newGame;
    this.currentModel = {};
    this.shuffleArray = shuffleArray;
    this.makeModel = makeModel;
    this.pivot = pivot;
    this.directions = directions;
    this.move = move;
    this.checkMove = checkMove;
    this.solve = solve;
    this.moves = 0;
    this.isSolvable = isSolvable;
  }

  return Board;
});

/**
 * save - save and get data form localStorage
 *
 * @return {type}  description
 */
app.service('save', function () {
  /**
   * set - set data in localStorage
   *
   * @param  {object} obj object which it to be inserted.
   */
  function set(obj) {
    localStorage.setItem(this.id, JSON.stringify(obj));
  }

  /**
   * remove - delete data from localStorage
   */
  function remove() {
    localStorage.removeItem(this.id);
  }

  /**
   * get - get data form localStorage
   *
   * @return {object}  saved data from localStorage
   */
  function get() {
    return JSON.parse(localStorage.getItem(this.id));
  }

  this.id = 'slideGame';
  this.set = set;
  this.get = get;
  this.remove = remove;
});
