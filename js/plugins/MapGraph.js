// 路径点对象
class PathNode {
  name = ''; // 路径标识符
  pos = [-1, -1, -1]; // 位置信息元组: [mapId, x, y]

  constructor(name, mapId, x, y) {
    this.name = name;
    this.pos = [mapId, x, y];
  }

  // 获取路径点所在地图Id
  get mapId() {
    return this.pos[0];
  }

  // 获取路径点所在x坐标
  get x() {
    return this.pos[1];
  }

  // 获取路径点所在y坐标
  get y() {
    return this.pos[2];
  }
}

// 地图路径图对象
class MapGraph {
  nodes = {}; // 节点字典
  edges = {}; // 连接字典
  cost = {}; // 代价字典

  // 链式方法创建新节点
  addNode(name, mapId, x, y) {
    this.nodes[name] = new PathNode(name, mapId, x, y);
    this.edges[name] = [];
    return this;
  }

  // 链式方法创建新连接
  addEdge(nodeAName, nodeBName, cost) {
    this.edges[nodeAName].push(this.getPathNode(nodeBName));
    this.edges[nodeBName].push(this.getPathNode(nodeAName));
    this.cost[[nodeAName, nodeBName]] = cost;
    return this;
  }

  // 获取连接间代价
  getCost(nodeA, nodeB) {
    if (nodeA === nodeB) return 0;
    if (this.cost[[nodeA.name, nodeB.name]])
      return this.cost[[nodeA.name, nodeB.name]];
    return this.cost[[nodeB.name, nodeA.name]];
  }

  // 寻路
  findRoutine(start, end) {
    // 待访问路径队列, 包含到该路径点的
    const openList = [{ node: start, cost: 0 }];
    // 已访问路径队列
    const closedList = [];
    // 最终
    const routine = [end];
    const backTracking = {};
    const cost = { [start.name]: 0 };
    // Dijkstra 算法
    while (openList.length) {
      // 优先选取访问节点队列中总代价最小的下一节点
      openList.sort((a, b) => a.cost - b.cost);
      const { node: head } = openList.shift();
      // 标记新节点为已访问
      closedList.push(head);
      // 对于每一个临近节点
      const foundEnd = this.edges[head.name].some((node) => {
        // 计算新的节点到临近节点的总代价
        const newCost = this.getCost(head, node) + cost[head.name];
        // 如果路径代价为负数, 其单向非连通
        if (newCost < 0) return false;
        // 判断临近节点是否已经或者将要访问
        const isVisiting = openList.find((obj) => obj.node === node);
        const isVisited = closedList.includes(node);
        // 判断总代价是否在之前设定过
        const costIsSet = node.name in cost;
        // 判断新的路径是否优于旧的路径
        const lessCost = cost[node.name] > newCost;
        // 更新总代价并标记回溯路径
        if (!(isVisited || isVisiting) || !costIsSet || lessCost) {
          cost[node.name] = newCost;
          backTracking[node.name] = head;
          if (isVisiting) isVisiting[cost] = newCost;
        }
        // 如果该节点为终点, 则跳过剩余循环
        if (node === end) return true;
        // 将节点加入待访问节点队列
        if (!(isVisited || isVisiting)) openList.push({ node, cost: newCost });
        return false;
      });
      // 如果已到达终点, 则跳过剩余循环
      if (foundEnd) break;
    }
    // 回溯路径
    let tail = end;
    while (tail !== start) {
      // 指向路径的回溯路径
      tail = backTracking[tail.name];
      routine.push(tail);
    }
    // 反转回溯后的路径
    routine.reverse();
    return routine;
  }

  // 通过路径名获取连接
  getPathNode(nodeName) {
    return this.nodes[nodeName];
  }
}

window.$mapGraph = new MapGraph();
window.PathNode = PathNode;
window.MapGraph = MapGraph;
