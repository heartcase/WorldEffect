/*:
 * @target MZ
 */
{
  // 正则表达式映射
  const casePatterns = {};
  // 判断函数映射
  const caseHandlers = {};

  // 判断状态
  const checkCase = (caseName, event, args) => {
    const handler = caseHandlers[caseName];
    return handler(event, ...args);
  };

  // 从事件页首部注释中匹配正则
  const checkCases = (event, page) => {
    const list = page.list;
    for (const each of list) {
      if ([108, 408].includes(each.code)) {
        const comment = each.parameters[0];
        for (const key in casePatterns) {
          const pattern = casePatterns[key];
          const handler = caseHandlers[key];
          const match = comment.match(pattern);
          if (match) {
            // 默认PageSwitch
            const [_, ...matches] = match;
            const result = handler(event, ...matches);
            if (!result) {
              return false;
            }
          }
        }
      } else {
        break;
      }
    }
    return true;
  };

  // 注册 SwitchCase
  // 只注册handler: registerCase('方法名', null, handler)
  const registerCase = (key, pattern, handler) => {
    if (pattern) {
      casePatterns[key] = pattern;
    }
    caseHandlers[key] = handler;
  };

  // overwrite
  const meetsConditions = Game_Event.prototype.meetsConditions;
  Game_Event.prototype.meetsConditions = function (page) {
    const result = meetsConditions.call(this, page);
    return result && checkCases(this, page);
  };

  window.PageSwitch = { registerCase, checkCase };
  window.$caseHandlers = caseHandlers;
}
