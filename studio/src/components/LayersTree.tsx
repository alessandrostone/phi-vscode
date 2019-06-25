/** @jsx jsx */
import { jsx, InterpolationWithTheme } from "@emotion/core";
import * as T from "../types";
import { column, row, colors, sectionTitle } from "../styles";
import AddLayerPopover from "./AddLayerPopover";
import { useRef, useState, useMemo } from "react";
import { Delete, Edit } from "../icons";
import IconButton from "./IconButton";
import { makeLayer } from "../factories";
import { findLayerById } from "../layerUtils";

type Props = {
  root?: T.Layer;
  onSelectLayer: (layerId: string | undefined) => void;
  selectedLayerId?: string;
  onLayerChange: (layer: T.Layer | undefined) => void;
  refs: T.Refs;
};

export type LayersTreeItem = {
  parent?: LayersTreeItem;
  layer: T.Layer;
  depth: number;
};

type DropPosition = {
  index: number;
  depth: number;
};

type InsertPosition = { parentId: string; position: number };

const itemHeight = 32;
const depthOffset = 22;
const leftOffset = 22;

function flatten<T>(arrOfArr: T[][]): T[] {
  const result = [];
  for (let arr of arrOfArr) {
    for (let item of arr) {
      result.push(item);
    }
  }
  return result;
}

export function flattenLayer(
  layer: T.Layer | undefined,
  parent?: LayersTreeItem,
  depth: number = 0
): LayersTreeItem[] {
  if (!layer) {
    return [];
  }
  const item = { parent, layer, depth };
  const results: LayersTreeItem[] = [item];
  if (layer.type === "container") {
    for (let child of flatten(
      layer.children.map(child => flattenLayer(child, item, depth + 1))
    )) {
      results.push(child);
    }
  }
  return results;
}

type DepthsBoundaries = {
  min: number;
  max: number;
};

export function layerTypeToIcon(type: T.LayerType) {
  switch (type) {
    case "text":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path fill="none" d="M0 0h24v24H0V0z" />
          <path d="M9.17 15.5h5.64l1.14 3h2.09l-5.11-13h-1.86l-5.11 13h2.09l1.12-3zM12 7.98l2.07 5.52H9.93L12 7.98zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H4V4h16v16z" />
        </svg>
      );
    case "container":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path fill="none" d="M0 0h24v24H0V0z" />
          <path d="M21 18H2v2h19v-2zm-2-8v4H4v-4h15m1-2H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm1-4H2v2h19V4z" />
        </svg>
      );
    default:
      throw new Error("Invalid layer type");
  }
}

type DraggedData = {
  layer: T.Layer;
  index: number;
};

export function getDepthsBoundaries(
  items: LayersTreeItem[],
  dragIndex: number,
  dropPosition: DropPosition
): DepthsBoundaries {
  const beforeItem = items[dropPosition.index];
  const nextItem = items[dropPosition.index + 1];

  // At this point, if beforeItem is part of the subtree, it should be the last item of the subtree
  if (isPartOfSubtree(beforeItem, items[dragIndex])) {
    return {
      min: nextItem ? nextItem.depth : 1,
      max: items[dragIndex].depth
    };
  }

  return {
    min: nextItem ? nextItem.depth : 1,
    max:
      beforeItem.layer.type === "container"
        ? beforeItem.depth + 1
        : beforeItem.depth
  };
}

export function getDragIndicatorLeft(
  items: LayersTreeItem[],
  dragIndex: number,
  dropPosition: DropPosition
) {
  const boundaries = getDepthsBoundaries(items, dragIndex, dropPosition);
  if (dropPosition.depth > boundaries.max) {
    return boundaries.max;
  }
  if (dropPosition.depth < boundaries.min) {
    return boundaries.min;
  }
  return dropPosition.depth;
}

function isPartOfSubtree(child: LayersTreeItem, root: LayersTreeItem) {
  let current = child;
  while (current && current.parent) {
    if (current.parent.layer === root.layer) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

export function isValidDropIndex(
  items: LayersTreeItem[],
  draggedIndex: number,
  index: number
): boolean {
  return (
    index >= 0 &&
    index < items.length &&
    !isPartOfSubtree(items[index + 1], items[draggedIndex])
  );
}

function getDragIndicatorStyle(
  items: LayersTreeItem[],
  draggedIndex?: number,
  dropPosition?: DropPosition
): InterpolationWithTheme<any> {
  if (
    draggedIndex === undefined ||
    dropPosition === undefined ||
    !isValidDropIndex(items, draggedIndex, dropPosition.index)
  ) {
    return {
      display: "none"
    };
  }

  return {
    display: "block",
    position: "absolute",
    top: dropPosition.index * itemHeight + itemHeight,
    left:
      getDragIndicatorLeft(items, draggedIndex, dropPosition) * depthOffset +
      leftOffset,
    right: 0,
    height: "2px",
    background: colors.primary
  };
}

function deleteLayer(root: T.Layer, toDelete: T.Layer): T.Layer | undefined {
  if (root === toDelete) {
    return undefined;
  }

  if (root.type !== "container") {
    return root;
  }

  return {
    ...root,
    children: root.children
      .map(child => deleteLayer(child, toDelete))
      .filter(x => x !== undefined) as T.Layer[]
  };
}

export function findInsertionPosition(
  items: LayersTreeItem[],
  dropPosition: DropPosition
): InsertPosition {
  let position = 0;
  let parent: T.Layer | undefined;

  for (let i = dropPosition.index; i >= 0; i--) {
    const item = items[i];
    if (item.depth === dropPosition.depth) {
      position++;
    }
    if (item.depth === dropPosition.depth - 1) {
      parent = item.layer;
      break;
    }
  }

  if (!parent) {
    throw new Error("Parent not found");
  }

  return {
    parentId: parent.id,
    position
  };
}

function addLayer(
  root: T.Layer | undefined,
  selectedLayerId: string | undefined,
  newLayer: T.Layer
): T.Layer | undefined {
  if (!root) {
    return newLayer;
  }

  if (!selectedLayerId) {
    return;
  }

  const selectedLayer = findLayerById(root, selectedLayerId);

  if (!selectedLayer) {
    throw new Error(`Layer with id ${selectedLayerId} not found in root`);
  }

  if (selectedLayer.type === "container") {
    return updateLayer(root, {
      ...selectedLayer,
      children: [...selectedLayer.children].concat(newLayer)
    });
  }
}

function updateLayer(
  rootLayer: T.Layer | undefined,
  newLayer: T.Layer
): T.Layer {
  if (!rootLayer) {
    return newLayer;
  }

  if (rootLayer.id === newLayer.id) {
    return newLayer;
  }

  if (rootLayer.type === "container") {
    return {
      ...rootLayer,
      children: rootLayer.children.map(child => updateLayer(child, newLayer))
    };
  }

  return rootLayer;
}

function insertLayer(
  root: T.Layer,
  toInsert: T.Layer,
  insertPosition: InsertPosition
): T.Layer {
  if (root.type === "container") {
    if (root.id === insertPosition.parentId) {
      return {
        ...root,
        children: root.children
          .slice(0, insertPosition.position)
          .concat([toInsert])
          .concat(root.children.slice(insertPosition.position))
      };
    }

    return {
      ...root,
      children: root.children.map(child =>
        insertLayer(child, toInsert, insertPosition)
      )
    };
  }

  if (root.id === insertPosition.parentId) {
    throw new Error("A layer can only be inserted inside a container");
  }

  return root;
}

function moveLayer(
  root: T.Layer,
  itemToMove: LayersTreeItem,
  items: LayersTreeItem[],
  dropPosition: DropPosition
) {
  const tmp = deleteLayer(root, itemToMove.layer);
  if (!tmp) {
    throw new Error(
      "Temporary layer after delete should exist. If not, the root has been deleted"
    );
  }
  return insertLayer(
    tmp,
    itemToMove.layer,
    findInsertionPosition(items, dropPosition)
  );
}

function LayersTree({
  root,
  onSelectLayer,
  selectedLayerId,
  onLayerChange,
  refs
}: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | undefined>();
  const [dragIndicatorPosition, setDragIndicatorPosition] = useState<
    DropPosition | undefined
  >(undefined);
  const [isRenaming, setIsRenaming] = useState(false);
  const treeViewRef = useRef<HTMLDivElement>(null);
  const flattenLayers = useMemo(() => flattenLayer(root), [root]);
  return (
    <div
      css={[
        column,
        {
          width: "240px",
          height: "100%"
        }
      ]}
    >
      <div
        css={[
          row,
          { justifyContent: "space-between", margin: "24px 24px 16px 24px" }
        ]}
      >
        <h2 css={sectionTitle}>Layers</h2>
        <AddLayerPopover
          onAdd={type => {
            const newLayer = makeLayer(type, root, refs);
            onLayerChange(addLayer(root, selectedLayerId, newLayer));
            onSelectLayer(newLayer.id);
          }}
          disabled={false}
        />
      </div>
      <div
        ref={treeViewRef}
        css={[column, { position: "relative", height: "100%" }]}
        onDragOver={e => {
          const boundingRect = e.currentTarget.getBoundingClientRect();
          const relativeX = e.pageX - boundingRect.left;
          const relativeY = e.pageY - boundingRect.top;
          const index = Math.min(
            Math.round((relativeY - itemHeight) / itemHeight),
            flattenLayers.length - 1
          );
          const depth = Math.round((relativeX - leftOffset) / depthOffset);
          if (
            dragIndicatorPosition == null ||
            dragIndicatorPosition.index !== index ||
            dragIndicatorPosition.depth !== depth
          ) {
            setDragIndicatorPosition({
              index,
              depth
            });
          }
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={e => {
          e.preventDefault();
          onLayerChange(
            moveLayer(root!, flattenLayers[draggedIndex!], flattenLayers, {
              index: dragIndicatorPosition!.index,
              depth: getDragIndicatorLeft(
                flattenLayers,
                draggedIndex!,
                dragIndicatorPosition!
              )
            })
          );
        }}
      >
        <div
          css={getDragIndicatorStyle(
            flattenLayers,
            draggedIndex,
            dragIndicatorPosition
          )}
        />
        {flattenLayers.map((item, index) => (
          <div
            key={item.layer.id}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragEnd={() => setDragIndicatorPosition(undefined)}
            onDoubleClick={() => setIsRenaming(true)}
            onClick={() => {
              onSelectLayer(item.layer.id);
            }}
            css={[
              row,
              {
                paddingLeft: item.depth * depthOffset + leftOffset + "px",
                paddingTop: "2px",
                paddingBottom: "2px",
                paddingRight: "8px",
                borderStyle: "solid",
                borderWidth: "2px",
                borderColor:
                  item.layer.id === selectedLayerId
                    ? colors.primary
                    : "transparent",
                alignItems: "center",
                fontSize: "14px",
                ":hover button": {
                  display: "block"
                }
              }
            ]}
          >
            {layerTypeToIcon(item.layer.type)}
            <span css={{ flex: "1 1 auto", marginLeft: "4px" }}>
              {item.layer.name}
            </span>
            <IconButton
              cssOverrides={{ display: "none", flex: "0 0 auto" }}
              icon={<Edit height={20} width={20} />}
              onClick={e => {
                e.stopPropagation();
              }}
            />
            <IconButton
              cssOverrides={{ display: "none", flex: "0 0 auto" }}
              icon={<Delete height={20} width={20} />}
              onClick={e => {
                e.stopPropagation();
                const newRoot = deleteLayer(root!, item.layer);
                onLayerChange(newRoot);
                onSelectLayer(newRoot ? newRoot.id : undefined);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LayersTree;
