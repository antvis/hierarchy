import TreeLayout from './layout/base';
import nonLayeredTidyTree from './layout/non-layered-tidy';
import doTreeLayout from './layout/do-layout';
import { assign } from './util';
import type { HierarchyData, HierarchyNode, CompactBoxOptions } from './types';

class CompactBoxTreeLayout extends TreeLayout {
  execute(): HierarchyNode {
    return doTreeLayout(this.rootNode, this.options, nonLayeredTidyTree);
  }
}

const DEFAULT_OPTIONS: CompactBoxOptions = {};

export default function compactBoxLayout(
  root: HierarchyData,
  options?: CompactBoxOptions,
): HierarchyNode {
  const mergedOptions = assign({}, DEFAULT_OPTIONS, options);
  return new CompactBoxTreeLayout(root, mergedOptions).execute();
}
