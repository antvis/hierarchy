import { assign } from '../util';
import type { HierarchyNode, HierarchyOptions } from '../types';

interface WrappedTreeNode {
  x: number;
  y: number;
  height: number;
  leftChild: WrappedTreeNode | null;
  rightChild: WrappedTreeNode | null;
  children: WrappedTreeNode[];
  originNode: HierarchyNode;
  isLeaf: boolean;
  drawingDepth?: number;
}

class WrappedTree implements WrappedTreeNode {
  x: number = 0;
  y: number = 0;
  height: number;
  leftChild: WrappedTreeNode | null = null;
  rightChild: WrappedTreeNode | null = null;
  children: WrappedTreeNode[];
  originNode!: HierarchyNode;
  isLeaf: boolean = false;

  constructor(height: number = 0, children: WrappedTreeNode[] = []) {
    this.height = height;
    this.children = children;
  }
}

const DEFAULT_OPTIONS = {
  isHorizontal: true,
  nodeSep: 20,
  nodeSize: 20,
  rankSep: 200,
  subTreeSep: 10
};

function convertBack(
  converted: WrappedTreeNode,
  root: HierarchyNode,
  isHorizontal: boolean
): void {
  if (isHorizontal) {
    root.x = converted.x;
    root.y = converted.y;
  } else {
    root.x = converted.y;
    root.y = converted.x;
  }
  converted.children.forEach((child, i) => {
    convertBack(child, root.children[i], isHorizontal);
  });
}

export default function dendrogram(
  root: HierarchyNode,
  options: HierarchyOptions = {}
): HierarchyNode {
  const mergedOptions = assign({}, DEFAULT_OPTIONS, options);

  let maxDepth = 0;
  
  function wrappedTreeFromNode(n: HierarchyNode): WrappedTreeNode {
    n.width = 0;
    if (n.depth && n.depth > maxDepth) {
      maxDepth = n.depth;
    }
    const children = n.children;
    const childrenCount = children.length;
    const t = new WrappedTree(n.height, []);
    children.forEach((child, i) => {
      const childWT = wrappedTreeFromNode(child);
      t.children.push(childWT);
      if (i === 0) {
        t.leftChild = childWT;
      }
      if (i === (childrenCount - 1)) {
        t.rightChild = childWT;
      }
    });
    t.originNode = n;
    t.isLeaf = n.isLeaf();
    return t;
  }

  function getDrawingDepth(t: WrappedTreeNode): number {
    if (t.isLeaf || t.children.length === 0) {
      t.drawingDepth = maxDepth;
    } else {
      const depths = t.children.map(child => getDrawingDepth(child));
      const minChildDepth = Math.min(...depths);
      t.drawingDepth = minChildDepth - 1;
    }
    return t.drawingDepth;
  }

  let prevLeaf: WrappedTreeNode | null = null;

  function position(t: WrappedTreeNode): void {
    t.x = t.drawingDepth! * mergedOptions.rankSep;
    if (t.isLeaf) {
      t.y = 0;
      if (prevLeaf) {
        t.y = prevLeaf.y + prevLeaf.height + mergedOptions.nodeSep;
        if (t.originNode.parent !== prevLeaf.originNode.parent) {
          t.y += mergedOptions.subTreeSep;
        }
      }
      prevLeaf = t;
    } else {
      t.children.forEach(child => {
        position(child);
      });
      t.y = (t.leftChild!.y + t.rightChild!.y) / 2;
    }
  }

  const wt = wrappedTreeFromNode(root);
  getDrawingDepth(wt);
  position(wt);
  convertBack(wt, root, mergedOptions.isHorizontal);
  
  return root;
}
