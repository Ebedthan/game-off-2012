var ANG_INCREMENT, Arena, BulletStatus, ElementStatus, Engine, Line, MOVE_INCREMENT, PI2, RAD2DEG, Rectangle, RobotActions, RobotStatus, Vector2, WallStatus, normalizeAngle,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

MOVE_INCREMENT = 1;

ANG_INCREMENT = 1;

PI2 = Math.PI * 2;

RAD2DEG = 180 / Math.PI;

normalizeAngle = function(a) {
  return ((a % 360) + 360) % 360;
};

Vector2 = (function() {

  function Vector2(x, y) {
    this.x = x;
    this.y = y;
    if (this.x instanceof Vector2) {
      this.y = this.x.y;
      this.x = this.x.x;
    }
  }

  Vector2.prototype.rotate = function(angle, reference) {
    var cos, sin, translatedX, translatedY;
    angle = (angle * Math.PI) / 180;
    sin = Math.sin(angle);
    cos = Math.cos(angle);
    translatedX = this.x - reference.x;
    translatedY = this.y - reference.y;
    this.x = translatedX * cos - translatedY * sin + reference.x;
    this.y = translatedX * sin + translatedY * cos + reference.y;
    return this;
  };

  Vector2.prototype.module = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  Vector2.prototype.projectTo = function(axis) {
    var denominator, divisionResult, numerator;
    numerator = (this.x * axis.x) + (this.y * axis.y);
    denominator = (axis.x * axis.x) + (axis.y * axis.y);
    divisionResult = numerator / denominator;
    return new Vector2(divisionResult * axis.x, divisionResult * axis.y);
  };

  Vector2.prototype.dot = function(other) {
    return this.x * other.x + this.y * other.y;
  };

  Vector2.add = function(v1, v2) {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  };

  Vector2.subtract = function(v1, v2) {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  };

  Vector2.divide = function(v1, scalar) {
    return new Vector2(v1.x / scalar, v1.y / scalar);
  };

  Vector2.multiply = function(v1, scalar) {
    return new Vector2(v1.x * scalar, v1.y * scalar);
  };

  return Vector2;

})();

RobotActions = (function() {

  function RobotActions(currentStatus) {
    this.id = currentStatus.id;
    this.angle = normalizeAngle(currentStatus.rectangle.angle + 90);
    this.cannonRelativeAngle = normalizeAngle(currentStatus.cannonAngle + 90);
    this.cannonAbsoluteAngle = normalizeAngle(this.angle + this.cannonRelativeAngle);
    this.position = new Vector2(currentStatus.rectangle.position);
    this.life = currentStatus.life;
    this.gunCoolDownTime = currentStatus.gunCoolDownTime;
    this.availableClones = currentStatus.availableClones;
    this.parentId = currentStatus.parentStatus ? currentStatus.parentStatus.id : null;
    this.arenaWidth = currentStatus.arena.width;
    this.arenaHeight = currentStatus.arena.height;
    this.queue = [];
  }

  RobotActions.prototype.move = function(amount, direction) {
    if (amount === 0) {
      return;
    }
    this.queue.push({
      action: "move",
      direction: direction,
      count: Math.abs(amount) / MOVE_INCREMENT
    });
    return true;
  };

  RobotActions.prototype.ahead = function(amount) {
    return this.move(amount, 1);
  };

  RobotActions.prototype.back = function(amount) {
    return this.move(amount, -1);
  };

  RobotActions.prototype.rotateCannon = function(degrees) {
    if (degrees === 0) {
      return;
    }
    return this.queue.push({
      action: "rotateCannon",
      direction: degrees,
      count: Math.abs(degrees) / ANG_INCREMENT
    });
  };

  RobotActions.prototype.turnGunLeft = function(degrees) {
    return this.rotateCannon(-degrees);
  };

  RobotActions.prototype.turnGunRight = function(degrees) {
    return this.rotateCannon(degrees);
  };

  RobotActions.prototype.turn = function(degrees) {
    if (degrees === 0) {
      return;
    }
    return this.queue.push({
      action: "turn",
      direction: degrees,
      count: Math.abs(degrees) / ANG_INCREMENT
    });
  };

  RobotActions.prototype.turnLeft = function(degrees) {
    return this.turn(-degrees);
  };

  RobotActions.prototype.turnRight = function(degrees) {
    return this.turn(degrees);
  };

  RobotActions.prototype.fire = function(bullets) {
    return this.queue.push({
      action: "fire"
    });
  };

  RobotActions.prototype.notify = function(callback) {
    return this.queue.push({
      action: "notify",
      callback: callback
    });
  };

  RobotActions.prototype.stop = function(callback) {
    return this.queue = [
      {
        action: "stop"
      }
    ];
  };

  RobotActions.prototype.clone = function() {
    return this.queue.push({
      action: "clone"
    });
  };

  RobotActions.prototype.log = function() {
    var messages;
    messages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this.queue.push({
      action: "log",
      messages: messages
    });
  };

  RobotActions.prototype.ignore = function(eventName) {
    return this.queue.push({
      action: "ignore",
      eventName: eventName
    });
  };

  RobotActions.prototype.listen = function(eventName) {
    return this.queue.push({
      action: "listen",
      eventName: eventName
    });
  };

  return RobotActions;

})();

Arena = (function() {

  function Arena(width, height) {
    this.width = width;
    this.height = height;
    this.rectangle = new Rectangle(this.width / 2, this.height / 2, this.width, this.height);
  }

  return Arena;

})();

Line = (function() {

  function Line(x1, y1, x2, y2) {
    this.p1 = new Vector2(x1, y1);
    this.p2 = new Vector2(x2, y2);
  }

  return Line;

})();

Rectangle = (function() {

  function Rectangle(x, y, width, height, angle) {
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (width == null) {
      width = 1;
    }
    if (height == null) {
      height = 1;
    }
    this.angle = angle != null ? angle : 0;
    this.position = new Vector2(x, y);
    this.setDimension(width, height);
    this.updateCoords();
  }

  Rectangle.prototype.setAngle = function(angle) {
    this.angle = normalizeAngle(angle);
    return this.updateCoords();
  };

  Rectangle.prototype.setDimension = function(width, height) {
    this.dimension = {
      width: width,
      height: height
    };
    this.halfWidth = width / 2;
    this.halfHeight = height / 2;
    this.radius = Math.sqrt(this.halfWidth * this.halfWidth + this.halfHeight * this.halfHeight);
    this.minRadius = Math.min(this.halfWidth, this.halfHeight);
    return this.updateCoords();
  };

  Rectangle.prototype.setPosition = function(x, y) {
    this.position.x = x;
    this.position.y = y;
    return this.updateCoords();
  };

  Rectangle.prototype.incPosition = function(x, y) {
    this.position.x += x;
    this.position.y += y;
    return this.updateCoords();
  };

  Rectangle.prototype.updateCoords = function() {
    var bottom, left, right, top;
    top = this.position.y - this.halfHeight;
    left = this.position.x - this.halfWidth;
    bottom = this.position.y + this.halfHeight;
    right = this.position.x + this.halfWidth;
    this.upperRight = new Vector2(right, top).rotate(this.angle, this.position);
    this.upperLeft = new Vector2(left, top).rotate(this.angle, this.position);
    this.lowerLeft = new Vector2(left, bottom).rotate(this.angle, this.position);
    return this.lowerRight = new Vector2(right, bottom).rotate(this.angle, this.position);
  };

  Rectangle.prototype.containingCollisionAngle = function(otherRectangle) {
    var rad;
    rad = this.minRadius;
    if (this.position.x - rad <= otherRectangle.upperLeft.x) {
      return 270;
    }
    if (this.position.x + rad >= otherRectangle.lowerRight.x) {
      return 90;
    }
    if (this.position.y - rad <= otherRectangle.upperLeft.y) {
      return 360;
    }
    if (this.position.y + rad >= otherRectangle.lowerRight.y) {
      return 180;
    }
    return false;
  };

  Rectangle.prototype.intersects = function(other) {
    var axis, axisList, distance, _i, _len;
    distance = Vector2.subtract(this.position, other.position).module();
    if (distance > (this.radius + other.radius)) {
      return false;
    }
    axisList = [Vector2.subtract(this.upperRight, this.upperLeft), Vector2.subtract(this.upperRight, this.lowerRight), Vector2.subtract(other.upperRight, other.upperLeft), Vector2.subtract(other.upperRight, other.lowerRight)];
    for (_i = 0, _len = axisList.length; _i < _len; _i++) {
      axis = axisList[_i];
      if (!this.isAxisCollision(other, axis)) {
        return false;
      }
    }
    return true;
  };

  Rectangle.prototype.isAxisCollision = function(other, axis) {
    var maxMine, maxOther, minMine, minOther, myProjections, otherProjections;
    myProjections = [this.generateScalar(this.upperLeft, axis), this.generateScalar(this.upperRight, axis), this.generateScalar(this.lowerLeft, axis), this.generateScalar(this.lowerRight, axis)];
    otherProjections = [this.generateScalar(other.upperLeft, axis), this.generateScalar(other.upperRight, axis), this.generateScalar(other.lowerLeft, axis), this.generateScalar(other.lowerRight, axis)];
    minMine = Math.min.apply(Math, myProjections);
    maxMine = Math.max.apply(Math, myProjections);
    minOther = Math.min.apply(Math, otherProjections);
    maxOther = Math.max.apply(Math, otherProjections);
    if (minMine <= maxOther && maxMine >= maxOther) {
      return true;
    } else if (minOther <= maxMine && maxOther >= maxMine) {
      return true;
    }
    return false;
  };

  Rectangle.prototype.generateScalar = function(corner, axis) {
    var projected;
    projected = corner.projectTo(axis);
    return (axis.x * projected.x) + (axis.y * projected.y);
  };

  return Rectangle;

})();

ElementStatus = (function() {

  ElementStatus.id = 1;

  function ElementStatus() {
    this.id = 'element' + (RobotStatus.id++);
    this.rectangle = new Rectangle();
  }

  ElementStatus.prototype.isAlive = function() {
    return true;
  };

  return ElementStatus;

})();

WallStatus = (function(_super) {

  __extends(WallStatus, _super);

  function WallStatus(x1, y1, x2, y2) {
    WallStatus.__super__.constructor.call(this);
    this.line = new Line(x1, y1, x2, y2);
  }

  return WallStatus;

})(ElementStatus);

BulletStatus = (function(_super) {

  __extends(BulletStatus, _super);

  function BulletStatus(robotStatus) {
    var angleRad, xInc, yInc;
    this.robotStatus = robotStatus;
    BulletStatus.__super__.constructor.call(this);
    this.rectangle.setAngle(this.robotStatus.rectangle.angle + this.robotStatus.cannonAngle);
    angleRad = (this.rectangle.angle * Math.PI) / 180;
    this.sinAngle = Math.sin(angleRad);
    this.cosAngle = Math.cos(angleRad);
    xInc = this.cosAngle * (this.robotStatus.rectangle.dimension.width / 2);
    yInc = this.sinAngle * (this.robotStatus.rectangle.dimension.height / 2);
    this.rectangle.setPosition(this.robotStatus.rectangle.position.x + xInc, this.robotStatus.rectangle.position.y + yInc);
    this.rectangle.setDimension(2, 2);
    this.speed = 2;
    this.strength = 20;
    this.running = true;
  }

  BulletStatus.prototype.isIdle = function() {
    return false;
  };

  BulletStatus.prototype.isAlive = function() {
    return this.running;
  };

  BulletStatus.prototype.runItem = function() {
    this.previousPosition = new Vector2(this.rectangle.position);
    this.rectangle.incPosition(this.cosAngle * this.speed, this.sinAngle * this.speed);
    return null;
  };

  BulletStatus.prototype.destroy = function() {
    return this.running = false;
  };

  BulletStatus.prototype.rollbackAfterCollision = function() {
    if (this.previousPosition) {
      return this.rectangle.setPosition(this.previousPosition.x, this.previousPosition.y);
    }
  };

  BulletStatus.prototype.updateQueue = function() {};

  return BulletStatus;

})(ElementStatus);

RobotStatus = (function(_super) {

  __extends(RobotStatus, _super);

  RobotStatus.deathOrder = 1;

  function RobotStatus(robot, arena) {
    this.robot = robot;
    this.arena = arena;
    RobotStatus.__super__.constructor.call(this);
    this.life = 100;
    this.cannonAngle = 0;
    this.rectangle.setDimension(27, 24);
    this.baseScanWaitTime = 50;
    this.baseGunCoolDownTime = 50;
    this.scanWaitTime = 0;
    this.gunCoolDownTime = 0;
    this.availableClones = 1;
    this.queue = [];
    this.clones = [];
    this.parentStatus = null;
    this.bulletsFired = 0;
    this.bulletsHit = 0;
    this.deathIdx = null;
    this.enemiesKilled = 0;
    this.friendsKilled = 0;
    this.ignoredEvents = {};
    this.accidentalCollisions = {};
  }

  RobotStatus.prototype.instantiateRobot = function() {
    var actions;
    actions = new RobotActions(this);
    this.robot.instance = new this.robot.constructor(actions);
    return this.updateQueue(actions);
  };

  RobotStatus.prototype.clone = function() {
    var cloneRobotStatus;
    cloneRobotStatus = new RobotStatus(this.robot, this.arena);
    cloneRobotStatus.rectangle.setAngle(this.rectangle.angle);
    cloneRobotStatus.rectangle.setPosition(this.rectangle.position.x, this.rectangle.position.y);
    cloneRobotStatus.life = this.life / 4;
    cloneRobotStatus.availableClones = 0;
    cloneRobotStatus.parentStatus = this;
    this.clones.push(cloneRobotStatus);
    return cloneRobotStatus;
  };

  RobotStatus.prototype.stats = function() {
    return {
      bulletsFired: this.clones.reduce(function(a, b) {
        return a + b.bulletsFired;
      }, this.bulletsFired),
      bulletsHit: this.clones.reduce(function(a, b) {
        return a + b.bulletsHit;
      }, this.bulletsHit),
      enemiesKilled: this.clones.reduce(function(a, b) {
        return a + b.enemiesKilled;
      }, this.enemiesKilled),
      friendsKilled: this.clones.reduce(function(a, b) {
        return a + b.friendsKilled;
      }, this.friendsKilled)
    };
  };

  RobotStatus.prototype.getAccidentalCollisions = function() {
    var ac;
    ac = this.accidentalCollisions;
    this.accidentalCollisions = {};
    return ac;
  };

  RobotStatus.prototype.addAccidentalCollision = function(status) {
    return this.accidentalCollisions[status.id] = true;
  };

  RobotStatus.prototype.isClone = function() {
    return !!this.parentStatus;
  };

  RobotStatus.prototype.isAlive = function() {
    return this.life > 0 && (this.parentStatus === null || this.parentStatus.life > 0);
  };

  RobotStatus.prototype.isIdle = function() {
    return this.queue.length === 0;
  };

  RobotStatus.prototype.takeHit = function(bulletStatus) {
    var _ref;
    this.life -= bulletStatus.strength;
    bulletStatus.destroy();
    bulletStatus.robotStatus.bulletsHit += 1;
    if (!this.isAlive()) {
      this.deathIdx = RobotStatus.deathOrder++;
      if (bulletStatus.robotStatus.parentStatus === this || (_ref = bulletStatus.robotStatus, __indexOf.call(this.clones, _ref) >= 0)) {
        return bulletStatus.robotStatus.friendsKilled += 1;
      } else {
        return bulletStatus.robotStatus.enemiesKilled += 1;
      }
    }
  };

  RobotStatus.prototype.rollbackAfterCollision = function() {
    if (this.previousPosition) {
      this.rectangle.setPosition(this.previousPosition.x, this.previousPosition.y);
    }
    if (this.previousAngle) {
      return this.rectangle.setAngle(this.previousAngle);
    }
  };

  RobotStatus.prototype.cannonTotalAngle = function() {
    return normalizeAngle(this.rectangle.angle + this.cannonAngle);
  };

  RobotStatus.prototype.canScan = function() {
    return this.scanWaitTime === 0;
  };

  RobotStatus.prototype.tickScan = function() {
    if (this.scanWaitTime > 0) {
      return this.scanWaitTime -= 1;
    }
  };

  RobotStatus.prototype.preventScan = function() {
    return this.scanWaitTime = this.baseScanWaitTime;
  };

  RobotStatus.prototype.abortCurrentMovement = function() {
    if (this.queue.length > 0 && this.queue[0].started) {
      return this.queue.shift();
    }
  };

  RobotStatus.prototype.runItem = function() {
    var angle, direction, item, rad, stopConsuming;
    if (this.gunCoolDownTime > 0) {
      this.gunCoolDownTime--;
    }
    item = this.queue.shift();
    stopConsuming = false;
    while (item) {
      switch (item.action) {
        case 'ignore':
          this.ignoredEvents[item.eventName] = true;
          break;
        case 'listen':
          delete this.ignoredEvents[item.eventName];
          break;
        case 'log':
          this.roundLog.events.push({
            type: 'log',
            messages: item.messages,
            id: this.id
          });
          break;
        default:
          stopConsuming = true;
      }
      if (stopConsuming) {
        break;
      }
      item = this.queue.shift();
    }
    if (!item) {
      return;
    }
    if ('count' in item) {
      item.started = true;
      item.count--;
      if (item.count > 0) {
        this.queue.unshift(item);
      }
    }
    direction = 1;
    if (item.direction && item.direction < 0) {
      direction = -1;
    }
    this.previousPosition = null;
    this.previousAngle = null;
    this.previousCannonAngle = null;
    switch (item.action) {
      case 'move':
        rad = (this.rectangle.angle * Math.PI) / 180;
        this.previousPosition = new Vector2(this.rectangle.position);
        this.rectangle.incPosition(Math.cos(rad) * MOVE_INCREMENT * direction, Math.sin(rad) * MOVE_INCREMENT * direction);
        break;
      case 'rotateCannon':
        this.previousCannonAngle = this.cannonAngle;
        this.cannonAngle += ANG_INCREMENT * direction;
        this.cannonAngle = normalizeAngle(this.cannonAngle);
        break;
      case 'turn':
        this.previousAngle = this.rectangle.angle;
        angle = this.previousAngle + ANG_INCREMENT * direction;
        this.rectangle.setAngle(angle);
        break;
      case 'fire':
        if (this.gunCoolDownTime !== 0) {
          return;
        }
        this.gunCoolDownTime = this.baseGunCoolDownTime;
        this.bulletsFired += 1;
        return new BulletStatus(this);
      case 'clone':
        if (!this.availableClones) {
          return;
        }
        this.availableClones--;
        return this.clone();
      case 'notify':
        item.callback && item.callback();
    }
    return null;
  };

  RobotStatus.prototype.updateQueue = function(actions) {
    if (actions.queue.length > 0 && actions.queue[0].action === 'stop') {
      return this.queue = actions.queue.slice(1);
    } else {
      return this.queue = actions.queue.concat(this.queue);
    }
  };

  return RobotStatus;

})(ElementStatus);

Engine = (function() {

  function Engine() {
    var height, maxTurns, randomFunc, robotData, robotStatus, robotsData, width, _i, _len, _ref;
    width = arguments[0], height = arguments[1], maxTurns = arguments[2], randomFunc = arguments[3], robotsData = 5 <= arguments.length ? __slice.call(arguments, 4) : [];
    this.maxTurns = maxTurns;
    this.randomFunc = randomFunc;
    this.round = 0;
    this.arena = new Arena(width, height);
    this.robotsStatus = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = robotsData.length; _i < _len; _i++) {
        robotData = robotsData[_i];
        _results.push(new RobotStatus(robotData, this.arena));
      }
      return _results;
    }).call(this);
    this.deadStatuses = [];
    this.initPositions();
    _ref = this.robotsStatus;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      robotStatus = _ref[_i];
      robotStatus.instantiateRobot();
    }
  }

  Engine.prototype.initPositions = function() {
    var angle, givenRect, robotStatus, rx, ry, _i, _len, _ref, _results;
    _ref = this.robotsStatus;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      robotStatus = _ref[_i];
      givenRect = robotStatus.robot.rectangle;
      if (givenRect) {
        robotStatus.rectangle.setPosition(givenRect.position.x, givenRect.position.y);
        _results.push(robotStatus.rectangle.setAngle(givenRect.angle));
      } else {
        rx = Math.floor(this.randomFunc() * this.arena.rectangle.dimension.width);
        ry = Math.floor(this.randomFunc() * this.arena.rectangle.dimension.height);
        angle = Math.floor(this.randomFunc() * 360);
        robotStatus.rectangle.setAngle(angle);
        robotStatus.rectangle.setPosition(rx, ry);
        this.findEmptyPosition(robotStatus);
        robotStatus.robot.rectangle = {};
        robotStatus.robot.rectangle.position = new Vector2(robotStatus.rectangle.position);
        _results.push(robotStatus.robot.rectangle.angle = robotStatus.rectangle.angle);
      }
    }
    return _results;
  };

  Engine.prototype.isDraw = function() {
    return this.round > this.maxTurns;
  };

  Engine.prototype.safeCall = function() {
    var method, obj, params;
    obj = arguments[0], method = arguments[1], params = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!obj[method]) {
      return;
    }
    return obj[method].apply(obj, params);
  };

  Engine.prototype.intersectsAnything = function(robotStatus) {
    var status, _i, _len, _ref;
    if (robotStatus.rectangle.containingCollisionAngle(this.arena.rectangle)) {
      return true;
    }
    _ref = this.robotsStatus;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      status = _ref[_i];
      if (status === robotStatus || !status.isAlive()) {
        continue;
      }
      if (robotStatus.rectangle.intersects(status.rectangle)) {
        return true;
      }
    }
    return false;
  };

  Engine.prototype.findEmptyPosition = function(robotStatus) {
    var arenaH, arenaW, baseX, baseY, nx, ny, robotH, robotW, x, y, _i, _j, _ref, _ref1;
    arenaW = this.arena.width;
    arenaH = this.arena.height;
    robotW = robotStatus.rectangle.dimension.width;
    robotH = robotStatus.rectangle.dimension.height;
    baseX = robotStatus.rectangle.position.x;
    baseY = robotStatus.rectangle.position.y;
    for (y = _i = 0, _ref = arenaH - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; y = _i += robotH) {
      for (x = _j = 0, _ref1 = arenaW - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; x = _j += robotW) {
        ny = (y + baseY + robotH) % arenaH;
        nx = (x + baseX + robotW) % arenaW;
        robotStatus.rectangle.setPosition(nx, ny);
        if (!this.intersectsAnything(robotStatus)) {
          return robotStatus;
        }
      }
    }
    return false;
  };

  Engine.prototype.checkCollision = function(robotStatus) {
    var accidentalCollisions, actions, bearing, clone, eventName, isEnemyRobot, status, vec, wallCollisionAngle, _i, _j, _len, _len1, _ref, _ref1;
    actions = robotStatus instanceof RobotStatus ? new RobotActions(robotStatus) : null;
    wallCollisionAngle = robotStatus.rectangle.containingCollisionAngle(this.arena.rectangle);
    if (wallCollisionAngle) {
      robotStatus.rollbackAfterCollision();
      if (robotStatus instanceof BulletStatus) {
        robotStatus.destroy();
        this.roundLog.events.push({
          type: 'exploded',
          id: robotStatus.id
        });
      } else {
        bearing = normalizeAngle(wallCollisionAngle - robotStatus.rectangle.angle - 90);
        if (bearing > 180) {
          bearing -= 360;
        }
        robotStatus.abortCurrentMovement();
        if (!robotStatus.ignoredEvents['onWallCollision']) {
          actions.ignore('onWallCollision');
          this.safeCall(robotStatus.robot.instance, 'onWallCollision', {
            robot: actions,
            bearing: bearing
          });
          actions.listen('onWallCollision');
        }
      }
    }
    if (robotStatus instanceof BulletStatus) {
      return actions;
    }
    accidentalCollisions = robotStatus.getAccidentalCollisions();
    _ref = this.robotsStatus;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      status = _ref[_i];
      if (status === robotStatus || !status.isAlive()) {
        continue;
      }
      isEnemyRobot = status instanceof RobotStatus;
      if (robotStatus.rectangle.intersects(status.rectangle)) {
        eventName = 'onRobotCollision';
        if (status instanceof BulletStatus) {
          bearing = normalizeAngle(status.rectangle.angle + 180 - robotStatus.rectangle.angle);
          if (status.robotStatus === robotStatus) {
            continue;
          }
          eventName = 'onHitByBullet';
          robotStatus.takeHit(status);
          this.roundLog.events.push({
            type: 'exploded',
            id: status.id
          });
          if (!robotStatus.isAlive()) {
            this.roundLog.events.push({
              type: 'dead',
              id: robotStatus.id
            });
            _ref1 = robotStatus.clones;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              clone = _ref1[_j];
              this.roundLog.events.push({
                type: 'dead',
                id: clone.id
              });
            }
          }
        } else {
          vec = Vector2.subtract(status.rectangle.position, robotStatus.rectangle.position);
          bearing = normalizeAngle((Math.atan2(vec.y, vec.x) * 180 / Math.PI) - robotStatus.rectangle.angle);
          robotStatus.rollbackAfterCollision();
          robotStatus.abortCurrentMovement();
        }
        if (bearing > 180) {
          bearing -= 360;
        }
        if (!robotStatus.ignoredEvents[eventName]) {
          actions.ignore(eventName);
          this.safeCall(robotStatus.robot.instance, eventName, {
            robot: actions,
            bearing: bearing,
            collidedRobot: isEnemyRobot ? this.basicEnemyInfo(status) : null,
            myFault: !!isEnemyRobot
          });
          actions.listen(eventName);
        }
        if (isEnemyRobot) {
          status.addAccidentalCollision(robotStatus);
        }
      } else if (isEnemyRobot && accidentalCollisions[status.id]) {
        if (!robotStatus.ignoredEvents[eventName]) {
          vec = Vector2.subtract(status.rectangle.position, robotStatus.rectangle.position);
          bearing = normalizeAngle((Math.atan2(vec.y, vec.x) * 180 / Math.PI) - robotStatus.rectangle.angle);
          if (bearing > 180) {
            bearing -= 360;
          }
          actions.ignore(eventName);
          this.safeCall(robotStatus.robot.instance, eventName, {
            robot: actions,
            bearing: bearing,
            collidedRobot: this.basicEnemyInfo(status),
            myFault: false
          });
          actions.listen(eventName);
        }
      }
    }
    return actions;
  };

  Engine.prototype.checkSight = function(robotStatus) {
    var actions, dirVec, dist, minDistance, robotInSight, status, virtualHeight, virtualRect, virtualWidth, _i, _len, _ref;
    actions = new RobotActions(robotStatus);
    robotStatus.tickScan();
    if (!robotStatus.canScan()) {
      return actions;
    }
    if (robotStatus.ignoredEvents['onScannedRobot']) {
      return actions;
    }
    virtualWidth = 2000;
    virtualHeight = 1;
    dirVec = new Vector2(robotStatus.rectangle.position.x + virtualWidth / 2, robotStatus.rectangle.position.y - virtualHeight / 2);
    dirVec.rotate(robotStatus.cannonTotalAngle(), robotStatus.rectangle.position);
    virtualRect = new Rectangle(dirVec.x, dirVec.y, virtualWidth, virtualHeight, robotStatus.cannonTotalAngle());
    robotInSight = null;
    minDistance = Infinity;
    _ref = this.robotsStatus;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      status = _ref[_i];
      if (status === robotStatus || !status.isAlive()) {
        continue;
      }
      if (!(status instanceof RobotStatus)) {
        continue;
      }
      if (virtualRect.intersects(status.rectangle)) {
        dist = Vector2.subtract(status.rectangle.position, robotStatus.rectangle.position).module();
        if (dist < minDistance) {
          robotInSight = status;
          minDistance = dist;
        }
      }
    }
    if (robotInSight) {
      robotStatus.preventScan();
      actions.ignore('onScannedRobot');
      this.safeCall(robotStatus.robot.instance, 'onScannedRobot', {
        robot: actions,
        scannedRobot: this.basicEnemyInfo(robotInSight)
      });
      actions.listen('onScannedRobot');
      this.roundLog.events.push({
        type: 'onScannedRobot',
        id: robotStatus.id
      });
    }
    return actions;
  };

  Engine.prototype.basicEnemyInfo = function(status) {
    return {
      id: status.id,
      position: new Vector2(status.rectangle.position),
      angle: status.rectangle.angle,
      cannonAngle: status.cannonAngle,
      life: status.life,
      parentId: status.parentStatus ? status.parentStatus.id : null
    };
  };

  Engine.prototype.fight = function() {
    var actions, aliveRobots, fightLog, newStatus, r, robotsOnly, sortedRobots, stats, status, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
    aliveRobots = this.robotsStatus.length;
    fightLog = [];
    while (aliveRobots > 1 && !this.isDraw()) {
      this.round++;
      fightLog.push(this.roundLog = {
        round: this.round,
        objects: [],
        events: []
      });
      aliveRobots = 0;
      _ref = this.robotsStatus;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        status = _ref[_i];
        if (!status.isAlive()) {
          continue;
        }
        status.roundLog = this.roundLog;
        this.roundLog.objects.push({
          type: status instanceof RobotStatus ? 'tank' : 'bullet',
          id: status.id,
          name: status instanceof RobotStatus ? status.robot.name : 'bullet',
          color: status instanceof RobotStatus ? status.robot.color : null,
          isClone: status instanceof RobotStatus ? status.isClone() : false,
          position: {
            x: status.rectangle.position.x,
            y: status.rectangle.position.y
          },
          dimension: {
            width: status.rectangle.dimension.width,
            height: status.rectangle.dimension.height
          },
          life: status.life,
          angle: status.rectangle.angle,
          cannonAngle: status.cannonAngle,
          parentId: status.parentStatus && status.parentStatus.id
        });
        if (status.isIdle()) {
          actions = new RobotActions(status);
          this.safeCall(status.robot.instance, 'onIdle', {
            robot: actions
          });
          status.updateQueue(actions);
        }
        newStatus = status.runItem();
        if (newStatus) {
          this.robotsStatus.push(newStatus);
          if (newStatus instanceof RobotStatus) {
            this.findEmptyPosition(newStatus);
            this.roundLog.events.push({
              type: 'cloned',
              id: status.id,
              cloneId: newStatus.id
            });
          }
        }
        actions = this.checkCollision(status);
        if (actions) {
          status.updateQueue(actions);
        }
        if (status instanceof RobotStatus && !status.isClone()) {
          aliveRobots++;
        }
      }
      _ref1 = this.robotsStatus;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        status = _ref1[_j];
        if (!(status.isAlive() && status instanceof RobotStatus)) {
          continue;
        }
        actions = this.checkSight(status);
        status.updateQueue(actions);
      }
      if (this.roundLogCallback) {
        this.roundLogCallback(this.roundLog);
      }
    }
    robotsOnly = this.robotsStatus.filter(function(el) {
      return el instanceof RobotStatus && !el.isClone();
    });
    sortedRobots = robotsOnly.sort(function(a, b) {
      var vA, vB;
      vA = a.deathIdx ? a.deathIdx : a.life * 1000;
      vB = b.deathIdx ? b.deathIdx : b.life * 1000;
      return vB - vA;
    });
    for (_k = 0, _len2 = sortedRobots.length; _k < _len2; _k++) {
      r = sortedRobots[_k];
      stats = r.stats = r.stats();
      console.log(r.robot.name, r.deathIdx, r.life, stats.bulletsFired, stats.bulletsHit, stats.friendsKilled, stats.enemiesKilled);
    }
    return {
      isDraw: this.isDraw(),
      robots: sortedRobots,
      result: fightLog
    };
  };

  return Engine;

})();
