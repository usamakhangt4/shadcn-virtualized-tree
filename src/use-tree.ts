import { useCallback, useMemo, useState } from "react";
import type { MoveInstruction, SelectionMode, TreeNode } from "./types";
import { flattenTree, getDescendantIds, indexTree, moveTreeNode } from "./utils";

export interface UseTreeOptions<T> {
  nodes: TreeNode<T>[];
  onNodesChange?: (nodes: TreeNode<T>[]) => void;
  defaultExpandedIds?: Iterable<string>;
  expandedIds?: ReadonlySet<string>;
  onExpandedChange?: (ids: Set<string>) => void;
  defaultSelectedIds?: Iterable<string>;
  selectedIds?: ReadonlySet<string>;
  onSelectedChange?: (ids: Set<string>) => void;
  selectionMode?: SelectionMode;
  selectDescendants?: boolean;
  selectParents?: boolean;
}

export function useTree<T = unknown>(options: UseTreeOptions<T>) {
  const {
    nodes,
    onNodesChange,
    selectionMode = "single",
    selectDescendants = false,
    selectParents = false,
  } = options;
  const [internalExpanded, setInternalExpanded] = useState(() => new Set(options.defaultExpandedIds));
  const [internalSelected, setInternalSelected] = useState(() => new Set(options.defaultSelectedIds));
  const expandedIds = options.expandedIds ?? internalExpanded;
  const selectedIds = options.selectedIds ?? internalSelected;
  const indexes = useMemo(() => indexTree(nodes), [nodes]);
  const flatNodes = useMemo(() => flattenTree(nodes, expandedIds), [nodes, expandedIds]);

  const commitExpanded = useCallback((next: Set<string>) => {
    if (!options.expandedIds) setInternalExpanded(next);
    options.onExpandedChange?.(next);
  }, [options.expandedIds, options.onExpandedChange]);

  const commitSelected = useCallback((next: Set<string>) => {
    if (!options.selectedIds) setInternalSelected(next);
    options.onSelectedChange?.(next);
  }, [options.selectedIds, options.onSelectedChange]);

  const toggleExpanded = useCallback((id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    commitExpanded(next);
  }, [expandedIds, commitExpanded]);

  const toggleSelected = useCallback((id: string) => {
    if (selectionMode === "none") return;
    const node = indexes.nodeMap.get(id);
    if (!node || node.disabled) return;
    if (selectionMode === "single") {
      commitSelected(selectedIds.has(id) ? new Set() : new Set([id]));
      return;
    }

    const next = new Set(selectedIds);
    const selecting = !next.has(id);
    if (selecting) next.add(id); else next.delete(id);

    if (selectDescendants) {
      for (const childId of getDescendantIds(node)) {
        if (selecting) next.add(childId); else next.delete(childId);
      }
    }
    if (selectParents) {
      let parentId = indexes.parentMap.get(id);
      while (parentId) {
        const parent = indexes.nodeMap.get(parentId);
        if (selecting && !parent?.disabled) next.add(parentId);
        else next.delete(parentId);
        parentId = indexes.parentMap.get(parentId);
      }
    }
    commitSelected(next);
  }, [selectionMode, indexes, selectedIds, selectDescendants, selectParents, commitSelected]);

  const moveNode = useCallback((move: MoveInstruction) => {
    onNodesChange?.(moveTreeNode(nodes, move));
  }, [nodes, onNodesChange]);

  return {
    nodes,
    flatNodes,
    nodeMap: indexes.nodeMap,
    parentMap: indexes.parentMap,
    expandedIds,
    selectedIds,
    toggleExpanded,
    toggleSelected,
    setExpandedIds: commitExpanded,
    setSelectedIds: commitSelected,
    moveNode,
  } as const;
}

export type TreeApi<T = unknown> = ReturnType<typeof useTree<T>>;
