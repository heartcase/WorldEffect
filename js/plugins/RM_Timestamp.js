/*:
 * @target MZ
 *
 * @param daysListInMonth
 * @text 每月天数
 * @type number[]
 * @min 1
 *
 * @param day1OfWeek
 * @text 第一天的星期数
 * @desc 第一天：0001-01-01
 * @type number
 * @min 1
 * @default 1
 *
 */

// 计算日期和天数
// 可以重写 配置和方法，以自定义日历结构

// RM_Timestamp
{
  const parameters = PluginManager.parameters('RM_Timestamp');
  // 每月天数
  const daysListInMonth = JSON.parse(parameters['daysListInMonth'])
    .map((param) => +Number(param));
  // Y1M1D1 的星期 (1-7)
  const DAY1_OF_WEEK = Number(parameters['day1OfWeek'] || 1);

  // ymd2ord : 日期(y, M, d) -> 天数n
  // ord2ymd : 天数n -> 日期{y, M, d}
  const {ymd2ord, ord2ymd} = ((daysListInMonth) => {
    const divmod = (a, b) => [(a - a % b) / b, a % b];

    const MINYEAR = 1;
    const MAXYEAR = 9999;

    const MONTHS_PER_YEAR = daysListInMonth.length;
    const DAYS_IN_MONTH = [-1, ...daysListInMonth]; // [-1, M1, M2, M3, ..]
    const DAYS_BEFORE_MONTH = [-1]; // [-1, 0, M1, M1+M2, M1+M2+M3, ..]
    {
      let dbm = 0
      for (var i = 1; i <= DAYS_IN_MONTH.length; i++) {
        DAYS_BEFORE_MONTH.push(dbm);
        dbm += DAYS_IN_MONTH[i];
      }
      delete dbm;
    }
    const DAYS_IN_YEAR = DAYS_BEFORE_MONTH[DAYS_BEFORE_MONTH.length-1];

    const daysInYear = (year) => DAYS_IN_YEAR;
    const daysBeforeYear = (year) => (year - 1) * DAYS_IN_YEAR;

    const daysInMonth = (month, year) => DAYS_IN_MONTH[month];
    const daysBeforeMonth = (month, year) => DAYS_BEFORE_MONTH[month];

    // 日期(y, M, d) -> 天数n
    const ymd2ord = (year, month, day) => {
      //dim = daysInMonth(month, year);
      return (daysBeforeYear(year) + daysBeforeMonth(month, year) + day);
    };

    // 天数n -> 日期{y, M, d}
    const ord2ymd = (n) => {
      n -= 1;
      var [n1, n] = divmod(n, daysBeforeYear(2));
      const y = n1 * 1 + 1;
      const M = DAYS_BEFORE_MONTH.findIndex((dbm) => dbm > n) - 1;
      const d = n - DAYS_BEFORE_MONTH[M] + 1;
      return {y, M, d};
    };

    return {ymd2ord, ord2ymd};
  })(daysListInMonth);

  class RM_Timestamp extends Object {
    constructor(time = 0) {
      super(...arguments);
      this._time = time;

      // TODO : 根据 year,month,day,hour,minute,second 构造
    }

    getTime() {
      return this._time;
    }
    setTime(time) {
      this._time = time;
    }
    addTime(delta) {
      this._time += delta;
      return this._time;
    }
    
    getMilliseconds() {
      return Math.floor(this._time) % 60;
    }
    getSeconds() {
      return Math.floor(this._time / 60) % 60;
    }
    getMinutes() {
      return Math.floor(this._time / 3600) % 60;
    }
    getHours() {
      return Math.floor(this._time / 216000) % 24;
    }

    getDay1OfWeek() {
      return DAY1_OF_WEEK;
    }
    getDay() {
      return ((Math.floor(this._time / 5184000) + this.getDay1OfWeek() - 1) % 7) + 1;
    }
    
    getDate() {
      return this.ord2ymd(Math.floor(this._time / 5184000) + 1).d;
    }
    getMonth() {
      return this.ord2ymd(Math.floor(this._time / 5184000) + 1).M;
    }
    getYear() {
      return this.ord2ymd(Math.floor(this._time / 5184000) + 1).y;
    }
    getFullYear() {
      return this.ord2ymd(Math.floor(this._time / 5184000) + 1).y;
    }

    formatDisplay(format) {
      // TODO
    }
    display() {
      // TODO : 调用 formatDisplay 实现
      return this.getTime().toString();
    }
    displayTime() {
      // TODO : 调用 formatDisplay 实现
      const s = this.getSeconds().toString().padStart(2, 0);
      const m = this.getMinutes().toString().padStart(2, 0);
      const H = this.getHours().toString().padStart(2, 0);
      return `${H}:${m}:${s}`;
    }
    displayDate() {
      // TODO : 调用 formatDisplay 实现
      const d = this.getDate().toString().padStart(2, 0);
      const M = this.getMonth().toString().padStart(2, 0);
      const y = this.getYear().toString().padStart(4, 0);
      return `${y}-${M}-${d}`;
    }
  }

  // TODO : Object.defineProperties  year, ..

  RM_Timestamp.prototype.ymd2ord = ymd2ord;
  RM_Timestamp.prototype.ord2ymd = ord2ymd;
  
  window.RM_Timestamp = RM_Timestamp;
}

// RM_RealTimestamp
{
  // ymd2ord : 日期(y, M, d) -> 天数n
  // ord2ymd : 天数n -> 日期{y, M, d}
  const {ymd2ord, ord2ymd} = (() => {
    const divmod = (a, b) => [(a - a % b) / b, a % b];

    const MINYEAR = 1;
    const MAXYEAR = 9999;
    const MAXORDINAL = 3652059;

    const MONTHS_PER_YEAR = 12;
    const DAYS_IN_MONTH = [-1, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const DAYS_BEFORE_MONTH = [-1]; // [-1, 31, 59, 120, ..]
    {
      let dbm = 0
      for (var i = 1; i <= DAYS_IN_MONTH.length; i++) {
        DAYS_BEFORE_MONTH.push(dbm);
        dbm += DAYS_IN_MONTH[i];
      }
      delete dbm;
    }
    const DAYS_IN_YEAR = 365;

    const isLeap = (year) =>
      year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);

    const daysInYear = (year) => 365;
    const daysBeforeYear = (year) => {
      const y = year - 1;
      return (
        y * 365 + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)
      );
    };

    const daysInMonth = (year, month) => {
      console.assert(1 <= month && month <= 12, month);
      if (month == 2 && isLeap(year)) {
        return 29;
      }
      return DAYS_IN_MONTH[month];
    };
    const daysBeforeMonth = (year, month) => {
      console.assert(1 <= month && month <= 12, 'month must be in 1..12');
      return DAYS_BEFORE_MONTH[month] + (month > 2 && isLeap(year));
    };

    const DI400Y = daysBeforeYear(401); // number of days in 400 years
    const DI100Y = daysBeforeYear(101); //    "    "   "   " 100   "
    const DI4Y = daysBeforeYear(5); //    "    "   "   "   4   "

    console.assert(DI4Y == 4 * 365 + 1);
    console.assert(DI400Y == 4 * DI100Y + 1);
    console.assert(DI100Y == 25 * DI4Y - 1);

    // 日期(y, M, d) -> 天数n
    const ymd2ord = (year, month, day) => {
      console.assert(1 <= month && month <= 12, 'month must be in 1..12');
      dim = daysInMonth(year, month);
      console.assert(1 <= day && day <= dim, `day must be in 1..${dim}`);
      return daysBeforeYear(year) + daysBeforeMonth(year, month) + day;
    };

    // 天数n -> 日期{y, M, d}
    const ord2ymd = (n) => {
      n -= 1;

      var [n400, n] = divmod(n, DI400Y);
      var year = n400 * 400 + 1;
      var [n100, n] = divmod(n, DI100Y);
      var [n4, n] = divmod(n, DI4Y);
      var [n1, n] = divmod(n, 365);
      year += n100 * 100 + n4 * 4 + n1;

      if (n1 == 4 || n100 == 4) {
        return [year - 1, 12, 31];
      }

      var leapyear = n1 == 3 && (n4 != 24 || n100 == 3);
      var month = (n + 50) >> 5;
      var preceding = DAYS_BEFORE_MONTH[month] + (month > 2 && leapyear);
      if (preceding > n) {
        month -= 1;
        preceding -= DAYS_IN_MONTH[month] + (month == 2 && leapyear);
      }
      n -= preceding;

      return {
        y: year, 
        M: month, 
        d: n + 1
      };
    };

    return {ymd2ord, ord2ymd};
  })();

  class RM_RealTimestamp extends RM_Timestamp {
    constructor(time) {
      super(...arguments);
    }

    getDay1OfWeek() {
      return 3; // TODO : 0001-01-01 的真实星期数
    }
  }

  // 重写 ymd2ord, ord2ymd
  RM_RealTimestamp.prototype.ymd2ord = ymd2ord;
  RM_RealTimestamp.prototype.ord2ymd = ord2ymd;

  window.RM_RealTimestamp = RM_RealTimestamp;
}

