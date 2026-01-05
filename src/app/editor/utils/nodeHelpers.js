// Constants
export const NODE_IDS = {
  TARGET: "target",
  PREVIEW: "preview",
  DATA: "data",
  MAPPING: "mapping",
};

export const NODE_SPACING = 110;
export const DEFAULT_POSITIONS = {
  TARGET: { x: 60, y: 40 },
  PREVIEW: { x: 60, y: 200 },
};

// Helper functions untuk node operations
export const findNodeById = (nodes, nodeId) =>
  nodes.find((n) => n.id === nodeId);

export const filterNodesByIds = (nodes, excludeIds) =>
  nodes.filter((n) => !excludeIds.includes(n.id));

export const getActionNodes = (nodes) =>
  nodes.filter((n) => n.type === "action");

export const sortNodesByY = (nodes) =>
  [...nodes].sort((a, b) => a.position.y - b.position.y);

export const getLastNodeY = (nodes) =>
  nodes.length > 0 ? Math.max(...nodes.map((n) => n.position.y)) : 0;

export const generateActionId = () =>
  `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper untuk menentukan source node untuk action baru
export const determineActionSource = (nodes, newActionNode, actionId) => {
  const mappingNode = findNodeById(nodes, NODE_IDS.MAPPING);
  const actionNodes = getActionNodes(nodes);
  const otherActions = actionNodes.filter((n) => n.id !== actionId);

  if (mappingNode) {
    if (otherActions.length === 0) {
      return { sourceId: NODE_IDS.MAPPING, isFirstAction: true };
    }
    const sorted = otherActions
      .filter((a) => a.position.y < newActionNode.position.y)
      .sort((a, b) => b.position.y - a.position.y);
    if (sorted.length > 0) {
      return { sourceId: sorted[0].id, isFirstAction: false };
    }
    return { sourceId: NODE_IDS.MAPPING, isFirstAction: true };
  } else {
    if (otherActions.length === 0) {
      return { sourceId: NODE_IDS.TARGET, isFirstAction: true };
    }
    const sorted = otherActions
      .filter((a) => a.position.y < newActionNode.position.y)
      .sort((a, b) => b.position.y - a.position.y);
    if (sorted.length > 0) {
      return { sourceId: sorted[0].id, isFirstAction: false };
    }
    return { sourceId: NODE_IDS.TARGET, isFirstAction: true };
  }
};

// Helper untuk menentukan apakah action adalah action terakhir
export const isLastAction = (actionNodes, actionId, newActionNode) => {
  const otherActions = actionNodes.filter((n) => n.id !== actionId);
  return (
    otherActions.length === 0 ||
    !otherActions.some((a) => a.position.y > newActionNode.position.y)
  );
};

// Helper untuk menghitung posisi action node baru
export const calculateActionPosition = (nodes, dropPosition) => {
  const existingActionNodes = getActionNodes(nodes);
  let actionY = dropPosition.y;

  if (existingActionNodes.length > 0) {
    actionY = getLastNodeY(existingActionNodes) + NODE_SPACING;
  } else {
    const mappingNode = findNodeById(nodes, NODE_IDS.MAPPING);
    const targetNode = findNodeById(nodes, NODE_IDS.TARGET);
    if (mappingNode) {
      actionY = mappingNode.position.y + NODE_SPACING;
    } else if (targetNode) {
      actionY = targetNode.position.y + NODE_SPACING;
    }
  }

  return { x: dropPosition.x || DEFAULT_POSITIONS.TARGET.x, y: actionY };
};
