import type { HierarchyNode } from './types';

/**
 * Get average height or height for node's position calculation, according to align.
 * @param preNode previous node
 * @param node current node, whose position is going to be calculated
 * @param align 'center' means nodes align at the center, other value means align at the left-top
 * @param heightField field name for height value on preNode and node
 * @return the height for calculation
 */
export function getHeight(
  preNode: HierarchyNode,
  node: HierarchyNode,
  align?: 'center' | undefined,
  heightField: keyof HierarchyNode = 'height'
): number {
  const preNodeHeight = preNode[heightField] as number;
  const nodeHeight = node[heightField] as number;
  return align === 'center' ? (preNodeHeight + nodeHeight) / 2 : preNode.height;
}

export const assign = Object.assign;
