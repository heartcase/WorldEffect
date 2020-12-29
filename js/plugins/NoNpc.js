{
  const executeNextMove = (interpreter) => {
    const event = $gameMap.event(interpreter._eventId);
    const routine = SelfData.getValue(event, 'routine') || [];
    const dest = routine[0];
    // 存在目的地
    if (dest) {
      const [x, y] = dest;
      // 是否到达目的地
      if (event.x !== x || event.y !== y) {
        const d = event.findDirectionTo(x, y);
        event.setDirection(d);
        event.moveForward();
      } else {
        routine.shift();
        const nextDest = routine[0];
        // 是否有下一目的地
        if (nextDest) {
          // 是否是巡逻模式
          const patrolling = SelfData.getValue(event, 'patrolling');
          if (patrolling) {
            routine.push(dest);
          }
          executeNextMove(event);
        }
      }
    }
  };

  window.NoNpc = { executeNextMove };
}
