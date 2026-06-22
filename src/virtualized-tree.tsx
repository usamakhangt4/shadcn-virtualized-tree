import { Check, ChevronRight, File, Folder, FolderOpen, GripVertical } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { TreeApi } from "./use-tree";

export interface VirtualizedTreeProps<T> {
  tree: TreeApi<T>;
  height?: number;
  rowHeight?: number;
  overscan?: number;
  className?: string;
  style?: CSSProperties;
  showIcons?: boolean;
  indent?: number;
  renderLabel?: (node: TreeApi<T>["nodes"][number]) => ReactNode;
  onActivate?: (id: string) => void;
  showCheckboxes?: boolean;
  enableOrdering?: boolean;
}

export function VirtualizedTree<T>({
  tree,
  height = 400,
  rowHeight = 32,
  overscan = 6,
  className,
  style,
  showIcons = true,
  indent = 20,
  renderLabel = node => node.label,
  onActivate,
  showCheckboxes = false,
  enableOrdering = false,
}: VirtualizedTreeProps<T>) {
  const reactId = useId().replace(/:/g, "");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(tree.flatNodes[0]?.node.id ?? null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: "before" | "inside" | "after" } | null>(null);
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(tree.flatNodes.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);
  const visible = tree.flatNodes.slice(start, end);
  const activeIndex = useMemo(() => tree.flatNodes.findIndex(item => item.node.id === activeId), [tree.flatNodes, activeId]);

  useEffect(() => {
    if (activeIndex < 0 || !viewportRef.current) return;
    const top = activeIndex * rowHeight;
    const bottom = top + rowHeight;
    if (top < viewportRef.current.scrollTop) viewportRef.current.scrollTop = top;
    else if (bottom > viewportRef.current.scrollTop + height) viewportRef.current.scrollTop = bottom - height;
  }, [activeIndex, height, rowHeight]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (tree.flatNodes.length === 0) return;
    const index = activeIndex < 0 ? 0 : activeIndex;
    const current = tree.flatNodes[index];
    if (event.key === "ArrowDown") setActiveId(tree.flatNodes[Math.min(index + 1, tree.flatNodes.length - 1)].node.id);
    else if (event.key === "ArrowUp") setActiveId(tree.flatNodes[Math.max(index - 1, 0)].node.id);
    else if (event.key === "ArrowRight") {
      if (!tree.expandedIds.has(current.node.id) && (current.node.children?.length || current.node.childrenCount)) tree.toggleExpanded(current.node.id);
      else if (tree.flatNodes[index + 1]) setActiveId(tree.flatNodes[index + 1].node.id);
    } else if (event.key === "ArrowLeft") {
      if (tree.expandedIds.has(current.node.id)) tree.toggleExpanded(current.node.id);
      else if (current.parentId) setActiveId(current.parentId);
    } else if (event.key === "Enter" || event.key === " ") {
      tree.toggleSelected(current.node.id);
      onActivate?.(current.node.id);
    } else return;
    event.preventDefault();
  };

  return (
    <div
      ref={viewportRef}
      role="tree"
      tabIndex={0}
      aria-activedescendant={activeId ? `${reactId}-${activeId}` : undefined}
      aria-multiselectable
      className={["svt-viewport", className].filter(Boolean).join(" ")}
      style={{ height, ...style }}
      onScroll={event => setScrollTop(event.currentTarget.scrollTop)}
      onKeyDown={onKeyDown}
    >
      <div className="svt-spacer" style={{ height: tree.flatNodes.length * rowHeight }}>
        {visible.map((item, offset) => {
          const { node, depth } = item;
          const expanded = tree.expandedIds.has(node.id);
          const selected = tree.selectedIds.has(node.id);
          const expandable = Boolean(node.children?.length || node.childrenCount);
          const Icon = expandable ? (expanded ? FolderOpen : Folder) : (node.icon ?? File);
          const dropPosition = dropTarget?.id === node.id ? dropTarget.position : null;
          return (
            <div
              id={`${reactId}-${node.id}`}
              key={node.id}
              role="treeitem"
              aria-level={depth + 1}
              aria-posinset={item.posInSet}
              aria-setsize={item.setSize}
              aria-expanded={expandable ? expanded : undefined}
              aria-selected={selected}
              aria-disabled={node.disabled}
              draggable={enableOrdering && !node.disabled}
              className={`svt-row${selected ? " svt-row-selected" : ""}${activeId === node.id ? " svt-row-active" : ""}${node.disabled ? " svt-row-disabled" : ""}${dropPosition ? ` svt-drop-${dropPosition}` : ""}`}
              style={{ height: rowHeight, transform: `translateY(${(start + offset) * rowHeight}px)`, paddingLeft: depth * indent + 8 }}
              onMouseDown={() => setActiveId(node.id)}
              onClick={() => { tree.toggleSelected(node.id); onActivate?.(node.id); }}
              onDragStart={event => {
                setDraggedId(node.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={event => {
                if (!draggedId || draggedId === node.id || node.disabled) return;
                let parent = tree.parentMap.get(node.id);
                while (parent) {
                  if (parent === draggedId) return;
                  parent = tree.parentMap.get(parent);
                }
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = (event.clientY - rect.top) / rect.height;
                const position = ratio < .25 ? "before" : ratio > .75 ? "after" : expandable ? "inside" : ratio < .5 ? "before" : "after";
                setDropTarget({ id: node.id, position });
              }}
              onDrop={event => {
                event.preventDefault();
                if (draggedId && dropTarget?.id === node.id) {
                  tree.moveNode({ nodeId: draggedId, targetId: node.id, position: dropTarget.position });
                  if (dropTarget.position === "inside" && !tree.expandedIds.has(node.id)) tree.toggleExpanded(node.id);
                }
                setDraggedId(null);
                setDropTarget(null);
              }}
              onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}
            >
              {enableOrdering && <GripVertical className="svt-grip" size={14} />}
              <button
                type="button"
                tabIndex={-1}
                aria-label={expanded ? "Collapse" : "Expand"}
                className={`svt-toggle${expandable ? "" : " svt-toggle-hidden"}`}
                onClick={event => { event.stopPropagation(); if (expandable) tree.toggleExpanded(node.id); }}
              >
                <ChevronRight className={expanded ? "svt-chevron-expanded" : ""} size={14} />
              </button>
              {showIcons && <Icon className="svt-icon" size={16} />}
              {showCheckboxes && <span aria-hidden className={`svt-checkbox${selected ? " svt-checkbox-checked" : ""}`}>{selected && <Check size={12} />}</span>}
              <span className="svt-label">{renderLabel(node)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
