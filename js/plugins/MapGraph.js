class PathNode {
  pos = [-1, -1, -1];
  name = '';

  static createPathNode(name, mapId, x, y) {
    $mapGraph.addNode(new PathNode(name, mapId, x, y));
  }

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
    this.edges[node.name] = [];
    return this;
  }
  addEdge(nodeAName, nodeBName, cost) {
    this.edges[nodeAName].push(this.getPathNode(nodeBName));
    this.edges[nodeBName].push(this.getPathNode(nodeAName));
    this.cost[[nodeAName, nodeBName]] = cost;
    return this;
  }

  getCost(nodeA, nodeB) {
    if (this.cost[[nodeA.name, nodeB.name]])
      return this.cost[[nodeA.name, nodeB.name]];
    return this.cost[[nodeB.name, nodeA.name]];
  }

  findRoutine(start, end) {
    const openList = [{ node: start, cost: 0 }];
    const closedList = [];
    const routine = [end];
    const backTracking = {};
    const cost = {
      [start.name]: 0,
    };
    // Dijkstra 算法
    while (openList.length) {
      openList.sort((a, b) => a.cost - b.cost);
      const { node: head } = openList.shift();
      closedList.push(head);
      const foundEnd = this.edges[head.name].some((node) => {
        const isVisited = closedList.includes(node) || openList.includes(node);
        const newCost = this.getCost(head, node) + cost[head.name];
        if (isVisited) {
          if (cost[node.name] === undefined || cost[node.pos] < newCost) {
            cost[node.name] = newCost;
            backTracking[node.name] = head;
          }
          return false;
        } else {
          backTracking[node.name] = head;
          if (node === end) return true;
          openList.push({ node, cost: newCost });
        }
        return false;
      });
      if (foundEnd) break;
    }
    let tail = end;
    while (tail !== start) {
      tail = backTracking[tail.name];
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
