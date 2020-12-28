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
