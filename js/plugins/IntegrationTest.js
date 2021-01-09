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

  TimeFly.everyHourEvents.push((deltaTime) => {
    $gameNpc.forEach((npcData) => {
      npcData.patternUpdate();
    });
    $gameMap.requestRefresh();
  });
}

// Test MapGraph

{
  $mapGraph
    // 声明节点
    .addNode(new PathNode('A', 1, 1, 1))
    .addNode(new PathNode('B', 2, 1, 1))
    .addNode(new PathNode('C', 3, 1, 1))
    .addNode(new PathNode('C-1', 3, 1, 2))
    // 声明路径
    .addEdge('A', 'B', 3)
    .addEdge('A', 'C', 5)
    .addEdge('C', 'C-1', 1)
    .addEdge('B', 'C', 4);

  // 计算路径
  const routine = $mapGraph.findRoutine(
    $mapGraph.getPathNode('A'),
    $mapGraph.getPathNode('C'),
  );
  console.log(routine.map((node) => node.name));
}

// Test GameNpc

function test() {
  $mapGraph
    .addNode(new PathNode('村子->少年家', 1, 17, 13))
    .addNode(new PathNode('少年家->村子', 3, 8, 12))
    .addEdge('村子->少年家', '少年家->村子');

  Game_NPC.createNewNpc('少年')
    .addPattern(
      NPCPattern.createNPCPattern('walkInHome', 'morning')
        .addCondition('HourRange', [0, 11])
        .addPatrolNode(PathNode.createPathNode('少年家-少年-1', 3, 6, 7))
        .addPatrolNode(PathNode.createPathNode('少年家-少年-2', 3, 6, 7)),
    )
    .addPattern(
      NPCPattern.createNPCPattern('walkInVillage', 'afternoon')
        .addCondition('HourRange', [12, 23])
        .addPatrolNode(PathNode.createPathNode('村子-少年-1', 1, 4, 8))
        .addPatrolNode(PathNode.createPathNode('村子-少年-2', 1, 13, 8)),
    )
    .setLocationToPathNode('少年家-少年-1');
}
