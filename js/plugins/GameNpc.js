class NPCPattern {
  conditions = [];
  behaviorName = '';
  dialogueName = '';
  actionName = '';
  routine = [];
  patrol = [];
  d = 0;

  constructor(behaviorName, dialogueName, d = 0) {
    this.behaviorName = behaviorName;
    this.dialogueName = dialogueName;
    this.d = d;
  }

  addRoutineNode(nodeName) {
    const node = $mapGraph.getPathNode(nodeName);
    this.routine.push(node);
    return this;
  }

  addPatrolNode(nodeName) {
    const node = $mapGraph.getPathNode(nodeName);
    this.patrol.push(node);
    return this;
  }

  addCondition(caseName, args) {
    this.conditions.push({
      caseName,
      args,
    });
    return this;
  }

  evaluate(event) {
    return this.conditions.every((condition) => {
      const { caseName, args } = condition;
      return window.PageSwitch.checkCase(caseName, event, args);
    });
  }
}

class Game_NPCEvent extends Game_Event {
  static loadNewEvent(data) {
    const mapId = $gameMap._eventId;
    const eventId = $gameMap._events.length;
    const event = new Game_NPCEvent(mapId, eventId, data);
    $gameMap._events[eventId] = event;
    return event;
  }
  data = null;
  get pos() {}

  constructor(mapId, eventId, data) {
    super(mapId, eventId, data);
  }
  initialize(mapId, eventId, data) {
    super.initialize(mapId, eventId);
    this.templateId = $dataEventMap.events.find(
      (eventData) => eventData && eventData.meta.npcName === data.name,
    );
  }
  unloadFromScene() {}
  event() {
    return window.$dataEventMap.events[this.templateId];
  }
}

class Game_NPC {
  name = '';
  offSceneCounter = 0;
  patterns = [];
  routine = [];
  patrol = [];
  pos = [-1, -1, -1];
  currentDest = null;
  dialogueName = '';
  behaviorName = '';
  actionName = '';
  d = 0;

  get mapId() {
    return this.pos[0];
  }
  get x() {
    return this.pos[1];
  }
  get y() {
    return this.pos[2];
  }

  constructor(name) {
    this.name = name;
  }

  routineIsEmpty() {
    return !this.routine.length;
  }

  patrolIsEmpty() {
    return !this.patrol.length;
  }

  // 场景外NPC更新
  offSceneUpdate(deltaTime) {
    let list;
    let dest;

    // 设置队列list的值:
    if (this.routineIsEmpty()) {
      if (this.patrolIsEmpty()) return;
      list = this.patrol;
    } else {
      list = this.routine;
    }

    // 设置dest为list的head
    dest = list[0];

    // 更新offSceneCounter计数
    this.offSceneCounter += deltaTime;

    // 判断是否需要更新NPC位置
    if (this.offSceneCounter < dest.cost) {
      return;
    }

    // 更新NPC位置
    while (this.offSceneCounter >= dest.cost) {
      this.offSceneCounter -= dest.cost;
      list.shift();
      if (list === this.patrol) {
        list.push(dest);
      } else if (this.routineIsEmpty()) {
        list === this.patrol;
      }
      if (!list.length) {
        return;
      }
      dest = list[0];
    }
    this.pos = dest.pos;
    this.currentDest = dest;

    // NPC登场
    if (this.mapId === $gameMap.mapId) {
      const event = Game_NPCEvent.loadNewEvent(this);
      this.eventId = event._eventId;
    }
  }

  // 场景内NPC位置更新
  onSceneMovementUpdate() {
    let list;
    // 设置队列list的值:
    if (this.routineIsEmpty()) {
      if (this.patrolIsEmpty()) return;
      list = this.patrol;
    } else {
      list = this.routine;
    }

    // 设置dest为list的head
    dest = list[0];

    // 如果已到达目标点
    if (this.x === dest.x && this.y === dest.y) {
      list.shift();
      if (list === this.patrol) {
        list.push(dest);
      } else if (this.routineIsEmpty()) {
        list === this.patrol;
      }
      if (!list.length) {
        this.setDirection(this.d);
        this.pos = dest.pos;
        return;
      }
      dest = list[0];
    }

    // NPC离场
    if (dest.mapId !== $gameMap.mapId) {
      this.event.unloadFromScene();
      return;
    }

    // NPC移动
    const d = this.event.findDirectionTo(dest.x, dest.y);
    this.event.setDirection(d);
    this.event.moveForward();

    // 记录NPC位置
    this.pos = this.event.pos;
    this.currentDest = dest;
  }

  // 增加 NPC 行为模式
  addPattern(pattern) {
    this.patterns.push(pattern);
  }

  // NPC行为模式更新
  patternUpdate() {
    const newPattern = this.patterns.find((each) => each.evaluate());
    const {
      behaviorName,
      dialogueName,
      actionName,
      routine,
      patrol,
      d,
    } = newPattern;
    if (this.behaviorName !== behaviorName) {
      // 计算到线路起始点的路径
      const dest = this.routineIsEmpty() ? patrol[0] : routine[0];
      const initRoutine = $gameMapGraph.findRoutine(this.currentDest, dest);
      this.routine = initRoutine.concat(routine);
      this.patrol = patrol.slice();
      this.d = d;
    }
    this.dialogueName = dialogueName;
    this.actionName = actionName;
    $gameMap.requestRefresh();
  }
}

window.Game_NPC = Game_NPC;
window.NPCPattern = NPCPattern;
