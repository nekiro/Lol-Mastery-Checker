const { BrowserWindow, ipcMain } = require("electron");
const { LolApi, RiotApi, Constants } = require("twisted");

const key = "<your_key_here>";

const riotApi = new RiotApi({
  key,
  region: Constants.Regions.EU_WEST,
});
const api = new LolApi({
  key,
  region: Constants.Regions.EU_WEST,
});

const main = require("../main.js");
const Settings = require("./settings.js");

// variables
const championsCache = [];
const idToName = [];
let summonerId = 0;
let region = Constants.Regions.EU_WEST;
let settings = new Settings();

function createPodiumWindow() {
  const podiumWindow = new BrowserWindow({
    width: 230,
    height: 350,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "Podium",
    resizable: false,
  });

  podiumWindow.loadFile("./html/podium.html");

  //podiumWindow.webContents.openDevTools()
}

function findWindowByTitle(title) {
  return BrowserWindow.getAllWindows().find((w) => w.title === title);
}

ipcMain.on("menuBtnAction", (event, arg) => {
  if (arg === "minimize") {
    const mainWindow = findWindowByTitle("Mastery Checker");
    if (mainWindow) {
      mainWindow.minimize();
    }
  } else if (arg === "exit") {
    const mainWindow = findWindowByTitle("Mastery Checker");
    if (mainWindow) {
      mainWindow.close();
    }
  } else if (arg == "podium" && !findWindowByTitle("Podium")) {
    createPodiumWindow();
  } else if (arg == "podium-minimize") {
    const podiumWindow = findWindowByTitle("Podium");
    if (podiumWindow) {
      podiumWindow.minimize();
    }
  } else if (arg == "podium-exit") {
    const podiumWindow = findWindowByTitle("Podium");
    if (podiumWindow) {
      podiumWindow.close();
    }
  } else if (arg == "open-main") {
    const mainWindow = findWindowByTitle("Mastery Checker");
    if (!mainWindow) {
      let window = main.createMainWindow();
      if (window) {
        parseMastery(summonerId);
      }
    }
  }
});

async function getChampionDataById(id) {
  let championId = Number(id.replace("champ", ""));
  let data = championsCache[String(championId)];
  let masteries = await api.Champion.masteryByPUUID(summonerId, region);
  return {
    champs: data,
    mastery: masteries.response.find((c) => c.championId == championId),
  };
}

ipcMain.on("getChampionDataById", async (event, id) => {
  event.sender.send("updateInfo", await getChampionDataById(id));
});

async function parseMastery(arg) {
  const mainWindow = findWindowByTitle("Mastery Checker");
  if (!mainWindow) {
    mainWindow.webContents.send("updateList", { success: false });
    return;
  }

  let masteries;
  let champions;
  let summoner;
  let account;

  try {
    account = (
      await riotApi.Account.getByRiotId(
        arg,
        region,
        Constants.RegionGroups.EUROPE
      )
    ).response;

    summoner = await api.Summoner.getByPUUID(account.puuid, region);
    summonerId = summoner.response.puuid;
    masteries = await api.Champion.masteryByPUUID(summonerId, region);
    champions = await api.DataDragon.getChampion();
  } catch (err) {
    mainWindow.webContents.send("updateList", { success: false });
    return;
  }

  if (idToName.length == 0 || championsCache.length == 0) {
    // cache champions on first search
    Object.keys(champions.data).forEach(function (champ) {
      let obj = champions.data[champ];
      idToName[obj.key] = obj.name;
      championsCache[obj.key] = obj;
    });
  }

  settings.set("summoner", account.gameName);

  mainWindow.webContents.send("updateList", {
    masteries: masteries.response,
    names: idToName,
    nickname: account.gameName,
    success: true,
  });
}

ipcMain.on("parseMastery", (event, arg) => {
  parseMastery(arg);
});

ipcMain.on("updatePodium", async (event) => {
  const podiumWindow = BrowserWindow.getAllWindows().find(
    (w) => w.title === "Podium"
  );
  if (!podiumWindow) {
    event.sender.send("updatePodium", { success: false });
    return;
  }

  // find top 3 mastery to advance
  let masteries = await api.Champion.masteryByPUUID(summonerId, region);
  let filtered = masteries.response.filter((c) => c.championLevel < 5);
  filtered.sort(function (a, b) {
    return a.championPoints < b.championPoints;
  });
  filtered = filtered.slice(0, 3);

  filtered.forEach((champ) => {
    let champInfo = championsCache[champ.championId];
    champ.imgUrl = `http://ddragon.leagueoflegends.com/cdn/${champInfo.version}/img/champion/${champInfo.image.full}`;
  });

  event.sender.send("updatePodium", { podium: filtered, success: true });
});

ipcMain.on("updateFindChamp", (event, search) => {
  settings.set("findChamp", search);
});

const stringToRegion = {
  EUW: Constants.Regions.EU_WEST,
  EUNE: Constants.Regions.EU_EAST,
  NA: Constants.Regions.AMERICA_NORTH,
  BR: Constants.Regions.BRAZIL,
  JP: Constants.Regions.JAPAN,
  KR: Constants.Regions.KOREA,
  RU: Constants.Regions.RUSSIA,
  TR: Constants.Regions.TURKEY,
  OCE: Constants.Regions.OCEANIA,
  LAS: Constants.Regions.LAT_SOUTH,
  LAN: Constants.Regions.LAT_NORTH,
};

ipcMain.on("updateRegion", async (event, arg) => {
  region = stringToRegion[arg];
});

module.exports = {
  settings,
  parseMastery,
};
