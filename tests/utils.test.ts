import { describe, expect, it } from "vitest";
import type { TreeNode } from "../src/types";
import { flattenTree, indexTree, moveTreeNode } from "../src/utils";

const nodes: TreeNode[] = [
  { id: "a", label: "A", children: [{ id: "a1", label: "A1" }] },
  { id: "b", label: "B", children: [{ id: "b1", label: "B1" }] },
];

describe("tree utilities", () => {
  it("indexes parents", () => {
    expect(indexTree(nodes).parentMap.get("a1")).toBe("a");
  });

  it("flattens only expanded branches", () => {
    expect(flattenTree(nodes, new Set(["a"])).map(item => item.node.id)).toEqual(["a", "a1", "b"]);
  });

  it("moves nodes between parents", () => {
    const moved = moveTreeNode(nodes, { nodeId: "a1", targetId: "b", position: "inside" });
    expect(moved[0].children).toEqual([]);
    expect(moved[1].children?.map(node => node.id)).toEqual(["b1", "a1"]);
  });

  it("rejects moving a node into its descendant", () => {
    expect(moveTreeNode(nodes, { nodeId: "a", targetId: "a1", position: "inside" })).toBe(nodes);
  });

  it("rejects duplicate ids", () => {
    expect(() => indexTree([{ id: "x", label: "X" }, { id: "x", label: "Again" }])).toThrow(/Duplicate/);
  });
});
