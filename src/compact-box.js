const TreeLayout = require('./layout/base');
const nonLayeredTidyTree = require('./layout/non-layered-tidy');
const doTreeLayout = require('./layout/do-layout');

class CompactBoxTreeLayout extends TreeLayout {
  execute() {
    const me = this;
    const root = doTreeLayout(me.rootNode, me.options, nonLayeredTidyTree);
    root.translate(-(root.x + root.width / 2 + root.hgap), -(root.y + root.height / 2 + root.vgap));
    return root;
  }
}

const DEFAULT_OPTIONS = {
};

function compactBoxLayout(root, options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  return new CompactBoxTreeLayout(root, options).execute();
}

module.exports = compactBoxLayout;
