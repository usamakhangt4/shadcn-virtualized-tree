import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import type { TreeNode } from "../src/types";
import { useTree } from "../src/use-tree";
import { VirtualizedTree } from "../src/virtualized-tree";

function TreeHarness({
  nodes,
  selectionMode = "single",
  onActivate,
}: {
  nodes: TreeNode[];
  selectionMode?: "none" | "single" | "multiple";
  onActivate?: (id: string) => void;
}) {
  const tree = useTree({ nodes, selectionMode });
  return <VirtualizedTree tree={tree} onActivate={onActivate} />;
}

describe("VirtualizedTree", () => {
  afterEach(() => cleanup());

  it("does not activate disabled nodes", () => {
    const onActivate = vi.fn();
    const nodes = [{ id: "disabled", label: "Disabled", disabled: true }];
    const { getByRole } = render(<TreeHarness nodes={nodes} onActivate={onActivate} />);

    fireEvent.click(getByRole("treeitem"));
    fireEvent.keyDown(getByRole("tree"), { key: "Enter" });

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("only marks the tree multiselectable for multiple selection mode", () => {
    const nodes = [{ id: "node", label: "Node" }];
    const { getByRole, rerender } = render(<TreeHarness nodes={nodes} selectionMode="single" />);

    expect(getByRole("tree").getAttribute("aria-multiselectable")).toBeNull();

    rerender(<TreeHarness nodes={nodes} selectionMode="multiple" />);

    expect(getByRole("tree").getAttribute("aria-multiselectable")).toBe("true");
  });
});
