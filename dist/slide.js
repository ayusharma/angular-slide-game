/**
 * Datashop Notification - Notificaion Service for Datashop.
 * @author Ayush Sharma
 * @version v0.0.1
 * @link 
 * @license MIT
 */
/* eslint eqeqeq: [0, "smart"] */

var app = angular.module('slideApp', []);

app.service('gameModes', function () {
  this.modes = {
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

app.controller('slideCtrl', ["$scope", "$interval", "Game", "gameModes", function ($scope, $interval, Game, gameModes) {
  var game;
  var timerInstance;
  $scope.game = {};
  $scope.game.history = [];
  $scope.game.modes = gameModes.modes;

  $scope.newGame = function (mode) {
    var type = gameModes.get(mode);
    var delay = 1000;
    $scope.game.mode = mode || gameModes.defaultMode;
    game = new Game(type.row, type.column);
    $scope.game.history.length = 0;
    $scope.game.grid = game.newGame();
    $scope.game.elasped = type.elasped;
    if (timerInstance) {
      $interval.cancel(timerInstance);
    }
    timerInstance = $interval(function () {
      $scope.game.elasped -= delay;
    }, delay);
  };

  $scope.move = function (x, y) {
    game.move($scope.game.grid, x, y).then(function (resp) {
      $scope.game.grid = resp.model;
      $scope.game.history.push(resp);
    });
  };

  $scope.solve = function () {
    $scope.game.grid = game.solve();
  };

  $scope.$watch('game.grid', function () {
    if (_.isEqual($scope.game.grid, game.solve())) {
      alert('You have solved the it');
    }
  });
}]);

app.factory('Game', ["$q", function ($q) {
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
    var elem = this.shuffleArray(this.elements);
    return this.makeModel(elem);
  }

  /**
   * solve - solve the game
   *
   * @return {object} solved mode
   */
  function solve() {
    this.moves = 0;
    return this.makeModel(this.elements);
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
    this.shuffleArray = shuffleArray;
    this.makeModel = makeModel;
    this.pivot = pivot;
    this.directions = directions;
    this.move = move;
    this.checkMove = checkMove;
    this.solve = solve;
    this.moves = 0;
  }

  return Board;
}]);

// app.service('time', function ($interval) {
//   this.delay = 1000;
//
//   this.set = function (elasped) {
//     return $interval(function () {
//       var elsp;
//       elsp = elasped - this.delay;
//       return elsp;
//     }, this.delay);
//   };
//
//   this.get = function () {
//     return this.elasped;
//   };
//
//   this.remove = function (instance) {
//     $interval.cancel(instance);
//   };
// });
// // app.factory('beforeUnload', function ($rootScope, $window) {
// //     // Events are broadcast outside the Scope Lifecycle
//   $window.onbeforeunload = function (e) {
//     var confirmation = {};
//     var event = $rootScope.$broadcast('onBeforeUnload', confirmation);
//     if (event.defaultPrevented) {
//       return confirmation.message;
//     }
//   };
//
//     $window.onunload = function () {
//         $rootScope.$broadcast('onUnload');
//     };
//     return {};
// })
