const { writeFileSync } = require('fs');
const { join } = require('path');

const parse = require('./parse');

const data = {
  name: 'null',
  children: [],
};

const orphan = Object.create(null);

const obj = Object.create(orphan);

class Animal {}
Object.setPrototypeOf(Animal.prototype, orphan);

class Human extends Animal {}

function Bacteria() {}
Object.setPrototypeOf(Bacteria.prototype, obj);
// Bacteria.prototype = Object.create(obj);  <---  also works

// parsing
parse(data, Object);
parse(data, Animal);
parse(data, Human);
parse(data, Bacteria);

writeFileSync(join(__dirname, 'final', 'orphan.json'), JSON.stringify(data, null, 2));
