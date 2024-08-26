
const separateTree = require('./separate-root');
const VALID_DIRECTIONS = [
  'LR', // left to right
  'RL', // right to left
  'TB', // top to bottom
  'BT', // bottom to top
  'H', // horizontal
  'V' // vertical
];
const HORIZONTAL_DIRECTIONS = [
  'LR',
  'RL',
  'H'
];
const isHorizontal = direction => HORIZONTAL_DIRECTIONS.indexOf(direction) > -1;
const DEFAULT_DIRECTION = VALID_DIRECTIONS[0];

module.exports = (root, options, layoutAlgrithm) => {
  const direction = options.direction || DEFAULT_DIRECTION;
  options.isHorizontal = isHorizontal(direction);
  if (direction && VALID_DIRECTIONS.indexOf(direction) === -1) {
    throw new TypeError(`Invalid direction: ${direction}`);
  }

  if (direction === VALID_DIRECTIONS[0]) {
    // LR
    layoutAlgrithm(root, options);
  } else if (direction === VALID_DIRECTIONS[1]) {
    // RL
    layoutAlgrithm(root, options);
    root.right2left();
  } else if (direction === VALID_DIRECTIONS[2]) {
    // TB
    layoutAlgrithm(root, options);
  } else if (direction === VALID_DIRECTIONS[3]) {
    // BT
    layoutAlgrithm(root, options);
    root.bottom2top();
  } else if (direction === VALID_DIRECTIONS[4] || direction === VALID_DIRECTIONS[5]) {
    // H or V
    // separate into left and right trees
    const { left, right } = separateTree(root, options);
    // do layout for left and right trees
    layoutAlgrithm(left, options);
    layoutAlgrithm(right, options);
    options.isHorizontal ? (left.right2left()) : (left.bottom2top());
    // combine left and right trees
    right.translate(left.x - right.x, left.y - right.y);
    // translate root
    root.x = left.x;
    root.y = right.y;
    const bb = root.getBoundingBox();
    if (options.isHorizontal) {
      if (bb.top < 0) {
        root.translate(0, -bb.top);
      }
    } else {
      if (bb.left < 0) {
        root.translate(-bb.left, 0);
      }
    }
  }
  // fixed root position, default value is true
  let fixedRoot = options.fixedRoot;
  if (fixedRoot === undefined) fixedRoot = true;
  if (fixedRoot) {
    root.translate(-(root.x + root.width / 2 + root.hgap), -(root.y + root.height / 2 + root.vgap));
  }

  if (options.radial) {
    const [ rScale, radScale ] = options.isHorizontal ? [ "x", "y" ] : [ "y", "x" ];

    const min = { x: Infinity, y: Infinity };
    const max = { x: -Infinity, y: -Infinity };

    let count = 0;
    root.DFTraverse((node) => {
      count++;
      const { x, y } = node;
      min.x = Math.min(min.x, x);
      min.y = Math.min(min.y, y);
      max.x = Math.max(max.x, x);
      max.y = Math.max(max.y, y);
    });

    const radDiff = max[radScale] - min[radScale];
    if (radDiff === 0) return root;

    const avgRad = (Math.PI * 2) / count;
    root.DFTraverse((node) => {
      const rad =
        ((node[radScale] - min[radScale]) / radDiff) * (Math.PI * 2 - avgRad) +
        avgRad;
      const r = node[rScale] - root[rScale];
      node.x = Math.cos(rad) * r;
      node.y = Math.sin(rad) * r;
    });
  }

  return root;
};
