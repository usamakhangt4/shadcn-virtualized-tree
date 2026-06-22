# shadcn-virtualized-tree

A typed React tree library with a headless state hook and an optional virtualized default UI. The core does not depend on Tailwind or shadcn; the included stylesheet is replaceable.

## Install

```bash
npm install shadcn-virtualized-tree lucide-react
```

## Quick start

```tsx
import { useState } from "react";
import {
  useTree,
  VirtualizedTree,
  type TreeNode,
} from "shadcn-virtualized-tree";
import "shadcn-virtualized-tree/styles.css";

export function FileTree() {
  const [nodes, setNodes] = useState<TreeNode[]>([
    {
      id: "src",
      label: "src",
      children: [{ id: "index.ts", label: "index.ts" }],
    },
  ]);

  const tree = useTree({
    nodes,
    onNodesChange: setNodes,
    selectionMode: "multiple",
    selectDescendants: true,
    defaultExpandedIds: ["src"],
  });

  return <VirtualizedTree tree={tree} height={320} />;
}
```

## Headless usage

`useTree` returns flattened visible nodes, node and parent indexes, selection and expansion state, and mutation helpers. Render those values in any design system:

```tsx
const tree = useTree({ nodes, selectionMode: "single" });

return tree.flatNodes.map(({ node, depth }) => (
  <button
    key={node.id}
    style={{ paddingInlineStart: depth * 20 }}
    onClick={() => tree.toggleSelected(node.id)}
  >
    {node.label}
  </button>
));
```

Selection and expansion can be controlled with `selectedIds`, `expandedIds`, and their corresponding change callbacks. Tree movement is immutable through `tree.moveNode({ nodeId, targetId, position })`.

## Current scope

- Fixed-height virtualized rows
- Single and multiple selection
- Optional parent and descendant selection propagation
- Controlled or uncontrolled selection and expansion
- Immutable move/reparent utility
- Keyboard navigation and ARIA tree metadata
- Custom labels, icons, row sizing, indentation, and styling

Lazy loading and drag-and-drop are intentionally application adapters rather than hard-coded network or sensor behavior. Consumers can update `nodes` after loading and call `moveNode` from the drag-and-drop system they prefer.

## Icons and colors

Lucide icons are only the defaults. Replace every structural icon with components from any React icon library:

```tsx
<VirtualizedTree
  tree={tree}
  icons={{
    chevron: MyChevron,
    folder: MyFolder,
    folderOpen: MyOpenFolder,
    file: MyFile,
    check: MyCheck,
    grip: MyDragHandle,
    loader: MySpinner,
    indeterminate: MyMinus,
  }}
/>
```

Individual nodes can still provide their own `icon` component. Components receive common `size` and `className` props.

Colors are arbitrary theme tokens, not a fixed preset list:

```tsx
<VirtualizedTree
  tree={tree}
  theme={{
    accent: "#10b981",
    focusRing: "#34d399",
    selectedForeground: "#a7f3d0",
    selectedBackground: "rgb(16 185 129 / 18%)",
    background: "#07130f",
    border: "#164e3d",
  }}
/>
```

The same values can be overridden with `--svt-*` CSS variables or ordinary CSS classes when application-level styling is preferred.
