//renderer process
const { ipcRenderer } = require('electron');

// exit button
const exitBtn = document.querySelector('.close-btn');
exitBtn.addEventListener('click', () => {
  ipcRenderer.send('menuBtnAction', 'exit');
});

// minimize
const minimizeBtn = document.querySelector('.minimize-btn');
minimizeBtn.addEventListener('click', () => {
  ipcRenderer.send('menuBtnAction', 'minimize');
});

// podium
const podiumBtn = document.querySelector('.podium-btn');
podiumBtn.addEventListener('click', () => {
  ipcRenderer.send('menuBtnAction', 'podium');
});

// region select
const regionSelect = document.querySelector('#region');
regionSelect.addEventListener('change', () => {
  ipcRenderer.send('updateRegion', regionSelect.value);
});

// sort options
const sortSelect = document.querySelector('#sortOptions');
sortSelect.addEventListener('change', () => {
  onSortOptionChange();
});

//input
const nickNameInput = document.querySelector('.menu-input');
const findChampInput = document.querySelector('#findChamp');

const champList = document.querySelector('.list');

// champ details
const infoDiv = document.querySelector('.info');
const champImg = document.querySelector('#champImage');
const champMasteryPts = document.querySelector('#champMasteryPts');
const champMasteryLevel = document.querySelector('#champMasteryLevel');
const champMasteryNextLvl = document.querySelector('#champMasteryNextLvl');

lastActiveBtn = null;
maestriesCache = [];

onListButtonClick = (elem) => {
  if (lastActiveBtn == elem.target) {
    return;
  }

  if (lastActiveBtn != null) {
    lastActiveBtn.style.filter = 'brightness(1)';
  }

  elem.target.style.filter = 'brightness(1.5)';
  lastActiveBtn = elem.target;

  // update info
  ipcRenderer.send('getChampionDataById', elem.target.id);
};

onSortOptionChange = () => {
  let compare = null;
  if (sortSelect.value == 'Name') {
    compare = (a, b) => a.innerText.localeCompare(b.innerText);
  } else if (sortSelect.value == 'Mastery Pts Asc.') {
    compare = (a, b) => {
      let infoA = maestriesCache[a.innerText];
      let infoB = maestriesCache[b.innerText];
      return infoA.masteryPoints < infoB.masteryPoints ? -1 : 1;
    };
  } else if (sortSelect.value == 'Mastery Pts Desc.') {
    compare = (a, b) => {
      let infoA = maestriesCache[a.innerText];
      let infoB = maestriesCache[b.innerText];
      return infoA.masteryPoints > infoB.masteryPoints ? -1 : 1;
    };
  } else if (sortSelect.value == 'Mastery Level Asc.') {
    compare = (a, b) => {
      let infoA = maestriesCache[a.innerText];
      let infoB = maestriesCache[b.innerText];
      return infoA.masteryLevel < infoB.masteryLevel ? -1 : 1;
    };
  } else if (sortSelect.value == 'Mastery Level Desc.') {
    compare = (a, b) => {
      let infoA = maestriesCache[a.innerText];
      let infoB = maestriesCache[b.innerText];
      return infoA.masteryLevel > infoB.masteryLevel ? -1 : 1;
    };
  }

  if (!compare) {
    return;
  }

  [...champList.children]
    .sort(compare)
    .forEach((node) => champList.appendChild(node));
};

const filterChampList = (name) => {
  Array.from(champList.childNodes).forEach((element) => {
    element.hidden = element.innerText.toLowerCase().search(name) == -1;
  });
};

// hooks
document.addEventListener('keyup', (e) => {
  if (e.key == 'Enter') {
    if (document.activeElement == nickNameInput) {
      ipcRenderer.send('parseMastery', nickNameInput.value);
      nickNameInput.disabled = true;
    } else if (document.activeElement == findChampInput) {
      const name = findChampInput.value.toLowerCase();
      filterChampList(name);
      ipcRenderer.send('updateFindChamp', name);
    }
  }
});

ipcRenderer.on('filterChampList', (event, arg) => {
  findChampInput.value = arg;
  filterChampList(arg);
});

ipcRenderer.on('updateList', async (event, args) => {
  if (!args.success) {
    nickNameInput.disabled = false;
    nickNameInput.placeholder = "Doesn't exist.";
    nickNameInput.value = '';
    champList.innerHTML = '';
    podiumBtn.disabled = true;
    findChampInput.disabled = true;
    sortSelect.disabled = true;
    return;
  }

  nickNameInput.value = args.nickname;
  champList.innerHTML = '';
  infoDiv.style.display = 'none';

  args.masteries.forEach((element) => {
    let name = args.names[element.championId];
    let btn = document.createElement('button');
    btn.id = `champ${element.championId}`;
    btn.onclick = onListButtonClick;

    btn.innerText = name;

    if (!element.chestGranted) {
      let chest = document.createElement('img');
      chest.width = '16';
      chest.height = '16';
      chest.alt = 'chest';
      chest.src = '../assets/chest.svg';
      chest.style.marginLeft = '5px';
      chest.style.filter = 'invert(0.8)';
      chest.style.pointerEvents = 'none';
      btn.appendChild(chest);
    }

    // cache maestry
    maestriesCache[name] = {
      masteryPoints: element.championPoints,
      masteryLevel: element.championLevel,
    };

    champList.appendChild(btn);
  });

  nickNameInput.placeholder = 'Find User';
  nickNameInput.disabled = false;
  findChampInput.disabled = false;
  podiumBtn.disabled = false;
  sortSelect.disabled = false;

  // default sort by name
  onSortOptionChange();
});

ipcRenderer.on('updateInfo', async (event, args) => {
  champImg.src = `http://ddragon.leagueoflegends.com/cdn/${args.champs.version}/img/champion/${args.champs.image.full}`;
  champMasteryPts.innerText = args.mastery.championPoints;
  champMasteryLevel.innerText = args.mastery.championLevel;
  champMasteryNextLvl.innerText = args.mastery.championPointsUntilNextLevel;
  infoDiv.style.display = 'flex';
});
