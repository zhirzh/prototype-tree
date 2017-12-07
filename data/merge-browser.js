const { readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

function hydrate(nodePaths) {
  const data = {
    name: 'null',
    children: [],
  };

  nodePaths.forEach((nodePath) => {
    nodePath
      .split('|')
      .slice(2)
      .reduce((parent, nodeName) => {
        parent.children = parent.children || [];

        let node = parent.children.find(c => c.name === nodeName);

        if (node === undefined) {
          node = {
            name: nodeName,
            children: [],
          };

          parent.children.push(node);
        }

        return node;
      }, data);
  });

  return data;
}

const RAW_DIR = join(__dirname, 'raw');
const FINAL_DIR = join(__dirname, 'final');

const dataSet = new Set();

readdirSync(RAW_DIR).forEach((filename) => {
  const rawData = require(join(RAW_DIR, filename));

  rawData.forEach((nodePath) => {
    if (dataSet.has(nodePath) === false) {
      dataSet.add(nodePath);
    }
  });
});

writeFileSync(
  join(FINAL_DIR, 'browser.json'),
  JSON.stringify(hydrate(Array.from(dataSet)), null, 2),
);
