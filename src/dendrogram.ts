import TreeLayout from './layout/base';
import dendrogram from './layout/dendrogram';
import doTreeLayout from './layout/do-layout';
import { assign } from './util';
import type { HierarchyData, HierarchyNode, DendrogramOptions } from './types';

class DendrogramLayout extends TreeLayout {
  execute(): HierarchyNode {
    this.rootNode.width = 0;
    return doTreeLayout(this.rootNode, this.options, dendrogram);
  }
}

const DEFAULT_OPTIONS: DendrogramOptions = {};

export default function dendrogramLayout(
  root: HierarchyData,
  options?: DendrogramOptions,
): HierarchyNode {
  const mergedOptions = assign({}, DEFAULT_OPTIONS, options);
  return new DendrogramLayout(root, mergedOptions).execute();
}
