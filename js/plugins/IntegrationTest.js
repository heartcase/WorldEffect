// Add Switch Cases

{
  const getHours = () => Math.floor(TimeFly.display() / 216000) % 24;

  PageSwitch.registerCase(
    'HourRange',
    /CASE: Hour Range from ([^\s]+) to ([^\s]+)/,
    (event, fromHour, toHour) => {
      return +fromHour <= getHours() && getHours() <= +toHour;
    },
  );

  PageSwitch.registerCase(
    'DialogueName',
    /Dialogue: ([^\s]+)/,
    (event, dialogueName) => dialogueName === event.data.dialogueName,
  );

  TimeFly.everyHourEvents.push(() => {
    console.log(getHours());
    $gameNpc.forEach((npcData) => {
      npcData.patternUpdate();
      if (npcData.mapId !== $gameMap._mapId) {
        npcData.offSceneUpdate(1);
      }
    });
    $gameMap.requestRefresh();
  });
}

// Test MapGraph

{
  $mapGraph
    // 声明节点
    .addNode('A', 1, 1, 1)
    .addNode('B', 2, 1, 1)
    .addNode('C', 3, 1, 1)
    .addNode('C-1', 3, 1, 2)
    // 声明路径
    .addEdge('A', 'B', 3)
    .addEdge('A', 'C', 5)
    .addEdge('C', 'C-1', 1)
    .addEdge('B', 'C', 1);

  // 计算路径
  const routine = $mapGraph.findRoutine(
    $mapGraph.getPathNode('A'),
    $mapGraph.getPathNode('C-1'),
  );
  console.log(routine.map((node) => node.name));
}

// Test GameNpc

function test() {
  $mapGraph
    // 地图连接点
    .addNode('村子->少年家', 1, 8, 5)
    .addNode('少年家->村子', 3, 8, 12)
    .addEdge('村子->少年家', '少年家->村子', 1)
    // 地图-少年家
    .addNode('少年家-少年-1', 3, 6, 7)
    .addNode('少年家-少年-2', 3, 11, 7)
    .addEdge('少年家-少年-1', '少年家-少年-2', 1)
    .addEdge('少年家-少年-1', '少年家->村子', 1)
    .addEdge('少年家-少年-2', '少年家->村子', 1)
    // TODO: 自动将一个地图内的路径点设置为cost为1的全连通
    // 地图-村子
    .addNode('村子-少年-1', 1, 4, 8)
    .addNode('村子-少年-2', 1, 13, 8)
    .addEdge('村子-少年-1', '村子-少年-2', 1)
    .addEdge('村子-少年-1', '村子->少年家', 1)
    .addEdge('村子-少年-2', '村子->少年家', 1);

  Game_NPC.createNewNpc('少年')
    .addPattern(
      NPCPattern.createNPCPattern('walkInHome', 'morning')
        .addCondition('HourRange', [0, 11])
        .addPatrolNode('少年家-少年-1')
        .addPatrolNode('少年家-少年-2'),
    )
    .addPattern(
      NPCPattern.createNPCPattern('walkInVillage', 'afternoon')
        .addCondition('HourRange', [12, 23])
        .addPatrolNode('村子-少年-1')
        .addPatrolNode('村子-少年-2'),
    )
    .setLocationToPathNode('少年家-少年-1')
    .patternUpdate();
}
