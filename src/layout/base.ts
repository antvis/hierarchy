import hierarchy from './hierarchy';
import type { HierarchyData, HierarchyNode, HierarchyOptions } from '../types';

export default class Layout {
  options: HierarchyOptions;
  rootNode: HierarchyNode;

  constructor(root: HierarchyData, options: HierarchyOptions = {}) {
    this.options = options;
    this.rootNode = hierarchy(root, options);
  }

  execute(): HierarchyNode {
    throw new Error('please override this method');
  }
}
