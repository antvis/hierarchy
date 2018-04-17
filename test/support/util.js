const {
  readFileSync
} = require('fs');
const {
  resolve
} = require('path');

module.exports = {
  readFileSync(pathname) {
    return readFileSync(resolve(process.cwd(), pathname), 'utf8');
  }
};
