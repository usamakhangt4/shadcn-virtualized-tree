import type { ElementType, ReactNode } from "react";

export interface TreeNode<T = unknown> {
  id: string;
  label: ReactNode;
  children?: TreeNode<T>[];
  childrenCount?: number;
  disabled?: boolean;
  icon?: ElementType;
  data?: T;
}

export interface FlatTreeNode<T = unknown> {
  node: TreeNode<T>;
  depth: number;
  parentId: string | null;
  posInSet: number;
  setSize: number;
}

export type SelectionMode = "none" | "single" | "multiple";

export interface MoveInstruction {
  nodeId: string;
  targetId: string;
  position: "before" | "inside" | "after";
}

export interface TreeIndexes<T = unknown> {
  nodeMap: Map<string, TreeNode<T>>;
  parentMap: Map<string, string | null>;
}
