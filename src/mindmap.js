const TreeLayout = require('./layout/base');
const mindmap = require('./layout/mindmap');
const doTreeLayout = require('./layout/do-layout');

class MindmapLayout extends TreeLayout {
  execute() {
    const me = this;
    const root = doTreeLayout(me.rootNode, me.options, mindmap);
    return root;
  }
}

const DEFAULT_OPTIONS = {
};

function mindmapLayout(root, options) {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  return new MindmapLayout(root, options).execute();
}

module.exports = mindmapLayout;
