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

  // 计算日期和天数
  // 可以重写 配置和方法，以自定义日历结构
  const [ymd2ord, ord2ymd] = (() => {
    const _MINYEAR = 1;
    const _MAXYEAR = 9999;
    const _MAXORDINAL = 3652059;

    const _DAYS_IN_MONTH = [-1, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    const _DAYS_BEFORE_MONTH = [-1];
    {
      let dbm = 0;
      for (var i = 1; i < _DAYS_IN_MONTH.length; i++) {
        _DAYS_BEFORE_MONTH.push(dbm);
        dbm += _DAYS_IN_MONTH[i];
      }
      delete dbm;
    }

    const _is_leap = (year) =>
      year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);

    const _days_before_year = (year) => {
      let y = year - 1;
      return (
        y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)
      );
    };

    const _days_in_month = (year, month) => {
      console.assert(1 <= month && month <= 12, month);
      if (month == 2 && _is_leap(year)) {
        return 29;
      }
      return _DAYS_IN_MONTH[month];
    };

    const _days_before_month = (year, month) => {
      console.assert(1 <= month && month <= 12, 'month must be in 1..12');
      return _DAYS_BEFORE_MONTH[month] + (month > 2 && _is_leap(year));
    };

    // y, m, d => days
    const _ymd2ord = (year, month, day) => {
      console.assert(1 <= month && month <= 12, 'month must be in 1..12');
      dim = _days_in_month(year, month);
      console.assert(1 <= day && day <= dim, `day must be in 1..${dim}`);
      return _days_before_year(year) + _days_before_month(year, month) + day;
    };

    const _DI400Y = _days_before_year(401); // number of days in 400 years
    const _DI100Y = _days_before_year(101); //    "    "   "   " 100   "
    const _DI4Y = _days_before_year(5); //    "    "   "   "   4   "

    console.assert(_DI4Y == 4 * 365 + 1);
    console.assert(_DI400Y == 4 * _DI100Y + 1);
    console.assert(_DI100Y == 25 * _DI4Y - 1);

    const _divmod = (a, b) => [(a - (a % b)) / b, a % b];

    // days -> [y, m, d]
    const _ord2ymd = (n) => {
      n -= 1;

      var [n400, n] = _divmod(n, _DI400Y);
      var year = n400 * 400 + 1;
      var [n100, n] = _divmod(n, _DI100Y);
      var [n4, n] = _divmod(n, _DI4Y);
      var [n1, n] = _divmod(n, 365);
      year += n100 * 100 + n4 * 4 + n1;

      if (n1 == 4 || n100 == 4) {
        return [year - 1, 12, 31];
      }

      var leapyear = n1 == 3 && (n4 != 24 || n100 == 3);
      var month = (n + 50) >> 5;
      var preceding = _DAYS_BEFORE_MONTH[month] + (month > 2 && leapyear);
      if (preceding > n) {
        month -= 1;
        preceding -= _DAYS_IN_MONTH[month] + (month == 2 && leapyear);
      }
      n -= preceding;

      return [year, month, n + 1];
    };

    return [_ymd2ord, _ord2ymd];
  })();

  // 每年4月，每月30天 示例
  /*
  const [ymd2ord, ord2ymd] = (() => {
    const MINYEAR = 1;
    const MAXYEAR = 9999;

    const _MONTHS_PER_YEAR = 4;

    const _DAYS_IN_MONTH = [-1, 30, 30, 30, 30];

    const _DAYS_BEFORE_MONTH = [-1]; // [-1, 0, 30, 60, 90]
    {
        let dbm = 0
        //for (var i = 1; i < _DAYS_IN_MONTH.length; i++) {
        for (var i = 1; i <= _DAYS_IN_MONTH.length; i++) {
            _DAYS_BEFORE_MONTH.push(dbm);
            dbm += _DAYS_IN_MONTH[i];
        }
        delete dbm;
    }


    const _DAYS_PER_YEAR = 120;
    const _days_before_year = (year) => (year - 1) * _DAYS_PER_YEAR;

    const _days_in_month = (month, year) => _DAYS_IN_MONTH[month];

    const _days_before_month = (month, year) => _DAYS_BEFORE_MONTH[month];

    const _ymd2ord = (year, month, day) => {
        dim = _days_in_month(month, year);
        return (_days_before_year(year) +
                _days_before_month(month, year) +
                day);
    };

    const _divmod = (a, b) => [(a - a % b) / b, a % b];

    const _ord2ymd = (n) => {
        n -= 1;
        var [n1, n] = _divmod(n, _days_before_year(2));
        var year = n1 * 1 + 1;
        var month = _DAYS_BEFORE_MONTH.findIndex((dbm) => dbm > n) - 1;
        n -= _DAYS_BEFORE_MONTH[month];
        return [year, month, n+1];
    };

    return [_ymd2ord, _ord2ymd];
  })();
  */

  const DAY1_OF_WEEK = 3; // Y1M1D1 的星期(1-7) (from 插件参数)

  const getTime = () => frames;

  const getMilliseconds = () => Math.floor(frames) % 60;

  const getSeconds = () => Math.floor(frames / 60) % 60;
  const getMinutes = () => Math.floor(frames / 3600) % 60;
  const getHours = () => Math.floor(frames / 216000) % 24;

  const getDay = () =>
    ((Math.floor(frames / 5184000) + DAY1_OF_WEEK - 1) % 7) + 1; // 星期(1-7)

  const getDate = () => ord2ymd(Math.floor(frames / 5184000) + 1)[2];
  const getMonth = () => ord2ymd(Math.floor(frames / 5184000) + 1)[1];
  const getYear = () => ord2ymd(Math.floor(frames / 5184000) + 1)[0];
  const getFullYear = () => ord2ymd(Math.floor(frames / 5184000) + 1)[0];

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
    const s = getSeconds().toString().padStart(2, 0);
    const m = getMinutes().toString().padStart(2, 0);
    const H = getHours().toString().padStart(2, 0);
    return `${H}:${m}:${s}`;
  };

  const displayDate = () => {
    const d = getDate().toString().padStart(2, 0);
    const M = getMonth().toString().padStart(2, 0);
    const y = getYear().toString().padStart(4, 0);
    return `${y}-${M}-${d}`;
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

    getTime,
    getMilliseconds,
    getSeconds,
    getMinutes,
    getHours,
    getDay,
    getDate,
    getMonth,
    getYear,
    getFullYear,

    ymd2ord,
    ord2ymd,

    setTimeRatio,
    getTimeRatio,

    everyHourEvents, // 注册每日事件
  };
}
