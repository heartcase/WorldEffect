/*:
 * @target MZ
 */
// 独立数据类
{
  class Game_SelfData extends Game_SelfSwitches {
    setValue(key, value) {
      if (value === undefined) {
        delete this._data[key];
      } else {
        this._data[key] = value;
      }
      this.onChange();
    }
    value(key) {
      return this._data[key];
    }
  }

  // 需要设置为window对象的属性才可以被正确得反序列化
  window.Game_SelfData = Game_SelfData;
}
// 全局对象
{
  // 初始化
  const createGameObjects = DataManager.createGameObjects;
  DataManager.createGameObjects = () => {
    createGameObjects();
    window.$gameSelfData = new Game_SelfData();
  };

  // 序列化
  const makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = () => {
    const contents = makeSaveContents();
    contents.selfData = $gameSelfData;
    return contents;
  };

  // 反序列化
  const extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = (contents) => {
    extractSaveContents(contents);
    $gameSelfData = contents.selfData;
  };
}

// SelfData API
{
  // 获取DataKey
  const getDataKey = (mapId, eventId, key) => `${mapId},${eventId},${key}`;
  const getSharedDataKey = (sharedId, key) => `$${sharedId},${key}`;

  // 获取Event对应的所有DataKey
  const getKeysHelper = (keyPattern) =>
    Object.keys($gameSelfData._data).filter(
      (dataKey) => dataKey.slice(0, keyPattern.length) === keyPattern,
    );

  const getDataKeys = (mapId, eventId) => getKeysHelper(`${mapId},${eventId},`);
  const getSharedDataKeys = (sharedId) => getKeysHelper(`$${sharedId},`);

  // 判断是否是SharedDataEvent (<SharedId: id>)
  // 判断是否自身拥有getDataKey方法
  // 否则使用默认getDataKey方法
  const getDataKeyFromEvent = (event, key) => {
    if (event.event().meta.SharedId !== undefined) {
      const sharedId = event.event().meta.SharedId;
      return getSharedDataKey(sharedId, key);
    }
    if (event.getDataKey) {
      return event.getDataKey(key);
    }
    const { _mapId, _eventId } = event;
    return getDataKey(_mapId, _eventId, key);
  };

  // 面向事件脚本的setValue方法
  // 例子 脚本: setValue(this, 'age', 10);
  const setValue = (interpreter, key, value) => {
    const event = $gameMap.event(interpreter._eventId);
    const dataKey = getDataKeyFromEvent(event, key);
    $gameSelfData.setValue(dataKey, value);
  };

  // 面向事件脚本的value方法
  const getValue = (interpreter, key) => {
    const event = $gameMap.event(interpreter._eventId);
    const dataKey = getDataKeyFromEvent(event, key);
    return $gameSelfData.value(dataKey);
  };

  window.SelfData = {
    getDataKeys,
    getSharedDataKeys,
    setValue,
    getValue,
  };
}
