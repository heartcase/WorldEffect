class PathNode {
  pos = [-1, -1, -1];
  name = '';

  constructor(name, mapId, x, y) {
    this.name = name;
    this.pos = [mapId, x, y];
  }
  get mapId() {
    return this.pos[0];
  }
  get x() {
    return this.pos[1];
  }
  get y() {
    return this.pos[2];
  }
}

class MapGraph {
  nodes = {};
  edges = {};
  cost = {};
  addNode(node) {
    this.nodes[node.name] = node;
    this.edges[node.pos] = [];
  }
  addEdge(nodeA, nodeB, cost) {
    this.edges[nodeA.pos].push(nodeB);
    this.edges[nodeB.pos].push(nodeA);
    this.cost[[...nodeA.pos, nodeB.pos]] = cost;
  }

  getCost(nodeA, nodeB) {
    if (this.cost[[...nodeA.pos, nodeB.pos]])
      return this.cost[[...nodeA.pos, nodeB.pos]];
    return this.cost[[...nodeB.pos, nodeA.pos]];
  }

  findRoutine(start, end) {
    const openList = [start];
    const closedList = [];
    const routine = [end];
    const backTracking = {};
    const cost = {
      [start.pos]: 0,
    };
    while (openList.length) {
      const head = openList.pop();
      closedList.push(head);
      this.edges[head.pos]
        .filter((node) => !closedList.includes(node))
        .filter((node) => !openList.includes(node))
        // TODO: 最优路径
        .forEach((node) => {
          backTracking[node.pos] = head;
          cost[node.pos] = this.getCost(head, node) + cost[head.pos];
          if (node === end) break;
          openList.push(node);
        });
    }
    let tail = end;
    while (tail !== head) {
      tail = backTracking[tail.pos];
      routine.push(tail);
    }
    routine.reverse();
    return routine;
  }

  getPathNode(nodeName) {
    return this.nodes[nodeName];
  }
}
window.$mapGraph = new MapGraph();
