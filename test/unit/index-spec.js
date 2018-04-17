const {
  expect
} = require('chai');
const hierarchy = require('../../src/index');

describe('index', () => {
  it('hierarchy', () => {
    expect(hierarchy).to.be.an('object');
  });
});
