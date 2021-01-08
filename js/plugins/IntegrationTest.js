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
    .addEdge('B', 'C', 1);

  // 计算路径
  const routine = $mapGraph.findRoutine(
    $mapGraph.getPathNode('A'),
    $mapGraph.getPathNode('C-1'),
  );
  console.log(routine.map((node) => node.name));
}
