/* global d3, searchFormEl */

import './form';
import main from './main';
import { setDataIndex, setParents } from './search';

const { searchParams } = new URL(window.location);

if (searchParams.has('iframe')) {
  searchFormEl.style.display = 'none';
}

const dataType = searchParams.get('data');
let file;

switch (dataType) {
  case 'browser':
  case 'node-sparse':
  case 'node':
  case 'orphan':
    file = `${dataType}.json`;
    break;

  default:
    file = 'browser.json';
}

d3.json(`../data/final/${file}`, (data) => {
  setDataIndex(data);
  setParents(data, null);

  main(data);
});
