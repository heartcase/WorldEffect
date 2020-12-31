/*:
 * @target MZ
 *
 */

{
  const eventMapId = 2;
  const filename = `Map${eventMapId.padZero(3)}.json`;
  DataManager._databaseFiles.push({ name: '$dataEventMap', src: filename });

  class Game_DynamicEvent extends Game_Event {
    constructor(name, mapId, eventId, templateId) {
      super(name, mapId, eventId, templateId);
    }

    initialize(name, mapId, eventId, templateId) {
      this.name = name;
      this.templateId = templateId;
      super.initialize(mapId, eventId);
    }

    event() {
      return window.$dataEventMap.events[this.templateId];
    }

    getDataKey(key) {
      return `#${this.name},${key}`;
    }
  }

  const $gameEvents = [];
  const createDynamicEventData = (name, mapId, templateId, payload) => {
    const eventData = {
      name, // 唯一标识名
      mapId, // 所在地图Id
      templateId, // 模板事件Id
      payload, // 初始化信息
    };
    $gameEvents.push(eventData);
  };

  // 加载数据
  const setupEventData = (event, payload) => {
    // 判断Event是否加载过
    if (!SelfData.getValue(event, 'init')) {
      // 初始化Event
      for (const each in payload) {
        SelfData.setValue(event, each, payload[each]);
      }
      SelfData.setValue(event, 'init', true);
    }
    // 加载位置
    const [x, y] = SelfData.getValue(event, 'pos');
    event.setPosition(x, y);
  };

  const setupEvents = Game_Map.prototype.setupEvents;
  Game_Map.prototype.setupEvents = function () {
    setupEvents.call(this);
    $gameEvents
      .filter(Boolean)
      .filter((event) => event.mapId === this._mapId)
      .forEach((event) => {
        let eventId = this._events.length;
        this._events[eventId] = new Game_DynamicEvent(
          event.name,
          this._mapId,
          eventId,
          event.templateId,
        );
        setupEventData(this._events[eventId], event.payload);
      });
  };

  // TODO: 低优先级, 独立开关支持, 从key的参数列表里判断event类型
  // 判断key[1]是否是Game_DynamicEvent，此处用的方法是instanceof
  
  const Game_SelfSwitches_value = Game_SelfSwitches.prototype.value;
  Game_SelfSwitches.prototype.value = function(key) {
    if (key[0] == $gameMap.mapId() && $gameMap.event(key[1]) instanceof Game_DynamicEvent) {
      var key2 = [eventMapId, $gameMap.event(key[1]).templateId, key[2]];
      return !!this._data[key2];
    }
    return Game_SelfSwitches_value.apply(this, arguments);
  };
  
  const Game_SelfSwitches_setValue = Game_SelfSwitches.prototype.setValue;
  Game_SelfSwitches.prototype.setValue = function(key, value) {
    if (key[0] == $gameMap.mapId() && $gameMap.event(key[1]) instanceof Game_DynamicEvent) {
      var key2 = [eventMapId, $gameMap.event(key[1]).templateId, key[2]];
      if (value) {
          this._data[key2] = true;
      } else {
          delete this._data[key2];
      }
      this.onChange();
    } else {
      Game_SelfSwitches_setValue.apply(this, arguments);
    }
  };

  // Usage
  // createDynamicEventData('少年', 1, 1, { pos: [1, 1] });

  window.EventWanderer = {
    createDynamicEventData,
  };
}
