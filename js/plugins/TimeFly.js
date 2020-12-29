/*:
 * @target MZ
 *
 * @param timeRatio
 * @text 游戏时间和真实时间流速比
 * @type number
 *
 */
{
  const parameters = PluginManager.parameters('TimeFly');
  let frames = 0;
  let lastFrames = 0;

  // 每小时事件
  const everyHourEvents = [];

  // TODO: 每天事件

  const overflows = [
    {
      periodSize: 60 * 60 * 60,
      handlers: everyHourEvents,
    },
  ];
  // 判断是否触发周期事件
  const checkPeriod = (deltaFrames) => {
    for (const each of overflows) {
      const { periodSize, handlers } = each;
      const periods = Math.floor(deltaFrames / periodSize);
      const overflow = lastFrames % periodSize >= frames % periodSize ? 1 : 0;
      if (periods + overflow > 0) {
        handlers.forEach((handler) => {
          handler(periods + overflow);
        });
      }
    }
  };

  // TODO: 跳转x秒
  const addSeconds = (x) => {};

  // TODO: 跳转到下一个x整点
  const setToNextHour = (x) => {};

  const defTimeRatio = +parameters['timeRatio']; // 默认速率 (from 插件参数)
  // 真实速率，修改该值可以调整时间流逝速率
  let timeRatio = defTimeRatio;

  const setTimeRatio = (value) => (timeRatio = value);
  const getTimeRatio = () => timeRatio;

  const tick = (n = 1) => {
    lastFrames = frames;
    frames += timeRatio * n;
    checkPeriod(frames - lastFrames);
  };

  const display = () => frames;

  const displayTime = () => {
    return (new RM_Timestamp(frames)).displayTime();
  };

  const displayDate = () => {
    return (new RM_Timestamp(frames)).displayDate();
  };

  // 判断时间是否流逝
  const isTimePass = (map) => {
    const inTimingMap = $dataMap.meta.TimeFly;
    return inTimingMap && !map._interpreter.isRunning();
  };

  // overwrite
  const update = Game_Map.prototype.update;
  Game_Map.prototype.update = function (sceneActive) {
    update.call(this, sceneActive);
    isTimePass(this) && tick();
  };

  const createGameObjects = DataManager.createGameObjects;
  DataManager.createGameObjects = () => {
    createGameObjects();
    frames = 0;
    timeRatio = defTimeRatio;
  };

  const makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = () => {
    const contents = makeSaveContents();
    contents.frames = frames;
    contents.timeRatio = timeRatio;
    return contents;
  };

  const extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = (contents) => {
    extractSaveContents(contents);
    frames = contents.frames;
    timeRatio = contents.timeRatio;
  };

  window.TimeFly = {
    tick,

    display,
    displayTime,
    displayDate,

    //ymd2ord,
    //ord2ymd,

    setTimeRatio,
    getTimeRatio,

    everyHourEvents, // 注册每日事件
  };
}
