/* global searchFormEl, searchInputEl, searchSelectEl */

import { search } from './search';

searchFormEl.addEventListener(
  'blur',
  (e) => {
    if (searchFormEl.contains(e.relatedTarget)) {
      return;
    }

    searchSelectEl.style.display = 'none';
  },
  true,
);

searchFormEl.addEventListener(
  'focus',
  () => {
    searchSelectEl.style.display = 'block';
  },
  true,
);

searchInputEl.onfocus = () => {
  searchInputEl.select();
};

searchInputEl.onkeydown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();

    searchSelectEl.focus();
    searchSelectEl.selectedIndex = 0;

    searchInputEl.value = searchSelectEl.value;
    search(false);
  }
};

searchInputEl.oninput = search;

searchSelectEl.oninput = () => {
  searchInputEl.value = searchSelectEl.value;
  search(false);
};

searchSelectEl.onkeydown = (e) => {
  if (e.key === 'ArrowUp' && searchSelectEl.selectedIndex === 0) {
    e.preventDefault();

    searchInputEl.focus();
  }

  if (e.key === 'Escape') {
    e.preventDefault();

    searchSelectEl.blur();
  }
};
