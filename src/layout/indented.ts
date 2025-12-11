import { getHeight } from '../util';
import type { HierarchyNode } from '../types';

function positionNode(
  node: HierarchyNode,
  previousNode: HierarchyNode | null,
  indent: number | ((node: HierarchyNode) => number),
  dropCap: boolean,
  align?: 'center' | undefined
): void {
  // calculate the node's horizontal offset DX, dx's type might be number or function
  const displacementX =
    (typeof indent === 'function' ? indent(node) : indent) * node.depth;

  if (!dropCap) {
    try {
      if (node.parent && node.id === node.parent.children[0].id) {
        node.x += displacementX;
        node.y = previousNode ? previousNode.y : 0;
        return;
      }
    } catch (e) {
      // skip to normal when a node has no parent
    }
  }

  node.x += displacementX;
  if (previousNode) {
    node.y = previousNode.y + getHeight(previousNode, node, align);
    if (previousNode.parent && node.parent && node.parent.id !== previousNode.parent.id) {
      // previous node has different parent
      const prevParent = previousNode.parent;
      const preY = prevParent.y + getHeight(prevParent, node, align);
      node.y = preY > node.y ? preY : node.y;
    }
  } else {
    node.y = 0;
  }
}

export default function indented(
  root: HierarchyNode,
  indent: number | ((node: HierarchyNode) => number),
  dropCap: boolean,
  align?: 'center' | undefined
): void {
  let previousNode: HierarchyNode | null = null;
  root.eachNode((node) => {
    positionNode(node, previousNode, indent, dropCap, align);
    previousNode = node;
  });
}
