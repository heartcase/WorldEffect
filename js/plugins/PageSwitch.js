window.PageSwitch = {};

{
  const casePatterns = {};
  const caseHandlers = {};

  // core
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

  /*
  2021.1.2 开关关
  下面的checkCases2方法针对的是写成这样的注释：
  
  <conditions>
  ( A or B ) and C
  A : SelfData name is "HeartCase"
  B : SelfData name is "AngelHeartCase"
  C : GameVariable 5 > 10086
  </conditions>
  
  A、B、C在下面的注释中被称为标记。
  这段代码尚未测试。
  */
  const checkCases2 = (event, page) => {
    // 第一步：读取注释内容到数组
    const list = page.list;
    let started = -1;
    let arrayExpression = [];
    for (let i = 0; i < list.length; i++) {
      if (started == -1) {
        if(list[i].code == 108 && list[i].parameters[0].search('<conditions>') != -1) {
          started = i;
        }
      } else {
        if(list[i].code == 400 || 108) {
          if (list[i].parameters[0].search('</conditions>') != -1) {
            break;
          } else {
            arrayExpression.push(list[i].parameters[0]);
          }
        }
      }
    }
    console.log('提取出注释中从<conditions>到</conditions>中间的内容');
    console.log(arrayExpression);
    // 以上是第一步
    // 第二步：计算每一行的结果（每个子条件）并记录
    const flag = {}; // 记录每行标记的名称和对应的结果 
    // 翻译每条标记的表达式
    for (let i = 1; i < arrayExpression.length; i++) {
      const flagName = arrayExpression[i].split(' : ')[0];
      const comment = arrayExpression[i].split(' : ')[1];
      // 下面这段是从checkCases中复制来的
      for (const key in casePatterns) {
        const pattern = casePatterns[key];
        const handler = caseHandlers[key];
        const match = comment.match(pattern);
        if (match) {
          const [_, ...matches] = match;
          const result = handler(event, ...matches);
          flag[flagName] = result;
        }
      }
      // 从checkCases中复制来的止于此
    }
    console.log('各标记的表达式');
    console.log(flag);
    // 以上是第二步
    // 第三步：翻译总表达式（母条件）
    let headExpression = arrayExpression[0].split(' ');
    let headFormula = '';
    for (let i = 0; i < headExpression.length; i++) {
      switch headExpression[i] {
        case '(':
          headFormula += '( ';
          break;
        case ')':
          headFormula += ') ';
          break;
        case 'or':
          headFormula += '||';
          break;
        case 'and':
          headFormula += '&&';
          break;
        default:
          headFormula += '${flag[' + headExpression[i] + ']} ';
      }
    }
    console.log('总表达式');
    console.log(headFormula);
    let headResult = new Function('return ' + '`' + headFormula + '`')();
    return headResult;
  };
  
  
  const registerCase = (key, pattern, handler) => {
    casePatterns[key] = pattern;
    caseHandlers[key] = handler;
  };

  // overwrite
  const meetsConditions = Game_Event.prototype.meetsConditions;
  Game_Event.prototype.meetsConditions = function (page) {
    const result = meetsConditions.call(this, page);
    return result && checkCases(this, page);
  };
  window.PageSwitch.registerCase = registerCase;
}

{
  window.PageSwitch.registerCase(
    'SelfDataHasSet',
    /CASE: SelfData ([^\s]+) has set/,
    (event, key) =>
      $gameSelfData.value([event._mapId, event._eventId, key]) !== undefined,
  );

  window.PageSwitch.registerCase(
    'SelfDataHasNotSet',
    /CASE: SelfData ([^\s]+) has not set/,
    (event, key) =>
      $gameSelfData.value([event._mapId, event._eventId, key]) === undefined,
  );

  window.PageSwitch.registerCase(
    'SelfDataIs',
    /CASE: SelfData ([^\s]+) is ([^\s]+)/,
    (event, key, value) =>
      $gameSelfData.value([event._mapId, event._eventId, key]) === value,
  );

  window.PageSwitch.registerCase(
    'SelfDataIsNot',
    /CASE: SelfData ([^\s]+) is not ([^\s]+)/,
    (event, key, value) =>
      $gameSelfData.value([event._mapId, event._eventId, key]) !== value,
  );
}
