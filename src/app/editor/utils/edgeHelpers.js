import { NODE_IDS } from "./nodeHelpers";
import {
  findNodeById,
  getActionNodes,
  sortNodesByY,
} from "./nodeHelpers";

// Helper untuk membuat edge
export const createEdge = (source, target, animated = true) => ({
  id: `e-${source}-${target}`,
  source,
  target,
  animated,
});

// Helper untuk filter edges
export const filterEdgesByNodes = (edges, nodeIds) =>
  edges.filter(
    (e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
  );

export const filterEdgesBySource = (edges, sourceId) =>
  edges.filter((e) => e.source !== sourceId);

export const filterEdgesByTarget = (edges, targetId) =>
  edges.filter((e) => e.target !== targetId);

export const filterEdgesByNode = (edges, nodeId) =>
  edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

// Helper untuk mencari edge
export const findEdgeByTarget = (edges, targetId) =>
  edges.find((e) => e.target === targetId);

export const findEdgeBySource = (edges, sourceId) =>
  edges.find((e) => e.source === sourceId);

export const hasEdge = (edges, sourceId, targetId) =>
  edges.some((e) => e.source === sourceId && e.target === targetId);

// Helper untuk reconnect edges setelah node dihapus
export const reconnectEdgesAfterNodeDeletion = (
  prevEdges,
  deletedNodeId,
  remainingNodes
) => {
  const incomingEdge = findEdgeByTarget(prevEdges, deletedNodeId);
  const outgoingEdge = findEdgeBySource(prevEdges, deletedNodeId);
  let newEdges = filterEdgesByNode(prevEdges, deletedNodeId);

  // Reconnect logic
  if (incomingEdge && outgoingEdge) {
    // Node tengah: connect incoming source ke outgoing target
    const newEdgeId = `e-${incomingEdge.source}-${outgoingEdge.target}`;
    if (!hasEdge(newEdges, incomingEdge.source, outgoingEdge.target)) {
      newEdges.push(createEdge(incomingEdge.source, outgoingEdge.target));
    }
  } else if (incomingEdge && !outgoingEdge) {
    // Node terakhir: connect incoming ke preview
    const newEdgeId = `e-${incomingEdge.source}-preview`;
    if (!hasEdge(newEdges, incomingEdge.source, NODE_IDS.PREVIEW)) {
      newEdges.push(createEdge(incomingEdge.source, NODE_IDS.PREVIEW));
    }
  } else if (!incomingEdge && outgoingEdge) {
    // Node pertama: connect dari mapping/target ke outgoing target
    const mappingNode = findNodeById(remainingNodes, NODE_IDS.MAPPING);
    const sourceId = mappingNode ? NODE_IDS.MAPPING : NODE_IDS.TARGET;
    if (!hasEdge(newEdges, sourceId, outgoingEdge.target)) {
      newEdges.push(createEdge(sourceId, outgoingEdge.target));
    }
  }

  // Pastikan action node terakhir selalu connect ke preview
  const remainingActionNodes = getActionNodes(remainingNodes);
  if (remainingActionNodes.length > 0) {
    const sortedActions = sortNodesByY(remainingActionNodes);
    const lastAction = sortedActions[sortedActions.length - 1];
    const lastActionToPreviewId = `e-${lastAction.id}-preview`;

    if (!hasEdge(newEdges, lastAction.id, NODE_IDS.PREVIEW)) {
      // Hapus edge lain dari lastAction jika ada
      newEdges = newEdges.filter(
        (e) => !(e.source === lastAction.id && e.target !== NODE_IDS.PREVIEW)
      );
      newEdges.push(createEdge(lastAction.id, NODE_IDS.PREVIEW));
    }
  } else {
    // Tidak ada action node lagi, connect target/mapping langsung ke preview
    const mappingNode = findNodeById(remainingNodes, NODE_IDS.MAPPING);
    const sourceId = mappingNode ? NODE_IDS.MAPPING : NODE_IDS.TARGET;
    if (!hasEdge(newEdges, sourceId, NODE_IDS.PREVIEW)) {
      newEdges.push(createEdge(sourceId, NODE_IDS.PREVIEW));
    }
  }

  return newEdges;
};

// Helper untuk reconnect edges setelah data/mapping dihapus
export const reconnectEdgesAfterDataSourceDeletion = (prevEdges, nodes) => {
  const newEdges = filterEdgesByNodes(prevEdges, [NODE_IDS.DATA, NODE_IDS.MAPPING]);
  const actionNodes = getActionNodes(nodes);

  if (actionNodes.length > 0) {
    const sortedActions = sortNodesByY(actionNodes);
    const firstAction = sortedActions[0];
    const lastAction = sortedActions[sortedActions.length - 1];

    // Pastikan edge target->firstAction ada
    if (!hasEdge(newEdges, NODE_IDS.TARGET, firstAction.id)) {
      newEdges.push(createEdge(NODE_IDS.TARGET, firstAction.id));
    }

    // Pastikan edge lastAction->preview ada
    if (!hasEdge(newEdges, lastAction.id, NODE_IDS.PREVIEW)) {
      newEdges.push(createEdge(lastAction.id, NODE_IDS.PREVIEW));
    }
  } else {
    // Tidak ada action, connect target langsung ke preview
    if (!hasEdge(newEdges, NODE_IDS.TARGET, NODE_IDS.PREVIEW)) {
      newEdges.push(createEdge(NODE_IDS.TARGET, NODE_IDS.PREVIEW));
    }
  }

  return newEdges;
};

// Helper untuk membuat edges saat menambah data source
export const createDataSourceEdges = (actionNodes) => {
  const edges = [
    createEdge(NODE_IDS.TARGET, NODE_IDS.DATA),
    createEdge(NODE_IDS.DATA, NODE_IDS.MAPPING),
  ];

  if (actionNodes.length > 0) {
    const sortedActions = sortNodesByY(actionNodes);
    const firstAction = sortedActions[0];
    edges.push(createEdge(NODE_IDS.MAPPING, firstAction.id));
  } else {
    edges.push(createEdge(NODE_IDS.MAPPING, NODE_IDS.PREVIEW));
  }

  return edges;
};
