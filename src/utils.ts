import type { FlatTreeNode, MoveInstruction, TreeIndexes, TreeNode } from "./types";

export function indexTree<T>(nodes: TreeNode<T>[]): TreeIndexes<T> {
  const nodeMap = new Map<string, TreeNode<T>>();
  const parentMap = new Map<string, string | null>();

  const visit = (items: TreeNode<T>[], parentId: string | null) => {
    for (const node of items) {
      if (nodeMap.has(node.id)) throw new Error(`Duplicate tree node id: ${node.id}`);
      nodeMap.set(node.id, node);
      parentMap.set(node.id, parentId);
      if (node.children) visit(node.children, node.id);
    }
  };

  visit(nodes, null);
  return { nodeMap, parentMap };
}

export function flattenTree<T>(nodes: TreeNode<T>[], expandedIds: ReadonlySet<string>): FlatTreeNode<T>[] {
  const result: FlatTreeNode<T>[] = [];
  const visit = (items: TreeNode<T>[], depth: number, parentId: string | null) => {
    items.forEach((node, index) => {
      result.push({ node, depth, parentId, posInSet: index + 1, setSize: items.length });
      if (node.children && expandedIds.has(node.id)) visit(node.children, depth + 1, node.id);
    });
  };
  visit(nodes, 0, null);
  return result;
}

export function getDescendantIds<T>(node: TreeNode<T>, includeDisabled = false): string[] {
  const ids: string[] = [];
  const visit = (items?: TreeNode<T>[]) => {
    for (const child of items ?? []) {
      if (includeDisabled || !child.disabled) ids.push(child.id);
      visit(child.children);
    }
  };
  visit(node.children);
  return ids;
}

export function isDescendant(parentMap: ReadonlyMap<string, string | null>, ancestorId: string, nodeId: string): boolean {
  let current: string | null | undefined = nodeId;
  while (current) {
    if (current === ancestorId) return true;
    current = parentMap.get(current);
  }
  return false;
}

export function moveTreeNode<T>(nodes: TreeNode<T>[], move: MoveInstruction): TreeNode<T>[] {
  if (move.nodeId === move.targetId) return nodes;
  const { parentMap } = indexTree(nodes);
  if (!parentMap.has(move.nodeId) || !parentMap.has(move.targetId)) return nodes;
  if (isDescendant(parentMap, move.nodeId, move.targetId)) return nodes;

  let extracted: TreeNode<T> | undefined;
  const remove = (items: TreeNode<T>[]): TreeNode<T>[] => items.flatMap(node => {
    if (node.id === move.nodeId) {
      extracted = node;
      return [];
    }
    if (!node.children) return [node];
    const children = remove(node.children);
    return children === node.children ? [node] : [{ ...node, children }];
  });

  const withoutNode = remove(nodes);
  if (!extracted) return nodes;
  const movingNode = extracted;
  const targetParentId = move.position === "inside" ? move.targetId : parentMap.get(move.targetId);

  const insert = (items: TreeNode<T>[], parentId: string | null): TreeNode<T>[] => {
    if (parentId === targetParentId && move.position !== "inside") {
      const index = items.findIndex(node => node.id === move.targetId);
      if (index < 0) return items;
      const next = [...items];
      next.splice(move.position === "before" ? index : index + 1, 0, movingNode);
      return next;
    }
    return items.map(node => {
      if (move.position === "inside" && node.id === move.targetId) {
        return { ...node, children: [...(node.children ?? []), movingNode] };
      }
      if (!node.children) return node;
      const children = insert(node.children, node.id);
      return children === node.children ? node : { ...node, children };
    });
  };

  return insert(withoutNode, null);
}
