const { app, BrowserWindow, ipcMain } = require('electron')

const { LolApi, Constants } = require('twisted')
const api = new LolApi({
	key: "RGAPI-9bbe30f6-37c6-443e-8850-a1d001e4dc47",
	region: Constants.Regions.EU_WEST
})

const main = require("../main.js")

// variables
var championsCache = []
var idToName = []
var summonerId = 0;
var region = Constants.Regions.EU_WEST;

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
		resizable: false
	})

	podiumWindow.loadFile('./html/podium.html')

	//podiumWindow.webContents.openDevTools()
}

function findWindowByTitle(title) {
    return BrowserWindow.getAllWindows().find(w => w.title === title);
}

ipcMain.on('menuBtnAction', (event, arg) => {
	if (arg === "minimize") {
        const mainWindow = findWindowByTitle("Mastery Checker");
        if (mainWindow) {
		    mainWindow.minimize()
        }
	} else if (arg === "exit") {
		const mainWindow = findWindowByTitle("Mastery Checker");
        if (mainWindow) {
		    mainWindow.close()
        }
	} else if (arg == "podium" && !findWindowByTitle("Podium")) {
		createPodiumWindow()
	} else if (arg == "podium-minimize") {
        const podiumWindow = findWindowByTitle("Podium")
        if (podiumWindow) {
		    podiumWindow.minimize()
        }
	} else if (arg == "podium-exit") {
        const podiumWindow = findWindowByTitle("Podium")
        if (podiumWindow) {
            podiumWindow.close()
        }
	} else if (arg == "open-main") {
        const mainWindow = findWindowByTitle("Mastery Checker");
        if (!mainWindow) {
            let window = main.createMainWindow()
            if (window) {
                parseMastery(summonerId)
            }
        }
    }
})

async function getChampionDataById(id) {
	let championId = Number(id.replace("champ", ""))
	let data = championsCache[String(championId)]
	let masteries = await api.Champion.masteryBySummoner(summonerId, region)
	return { champs: data, mastery: masteries.response.find(c => c.championId == championId) }
}

ipcMain.on('getChampionDataById', async (event, id) => {
	event.sender.send("updateInfo", await getChampionDataById(id))
})

async function parseMastery(arg)
{
    const mainWindow = findWindowByTitle("Mastery Checker")
    if (!mainWindow) {
        mainWindow.webContents.send("updateList", {success: false})
        return;
    }

    try {
        try {
            let summoner = await api.Summoner.getByName(arg, region)
            summonerId = summoner.response.id
        } catch {}

		var masteries = await api.Champion.masteryBySummoner(summonerId, region)
		var champions = await api.DataDragon.getChampion()
	} catch (err) {
		mainWindow.webContents.send("updateList", {success: false})
		return;
	}

	if (idToName.length == 0 || championsCache.length == 0) { // cache champions on first search
		Object.keys(champions.data).forEach(function(champ) {
			let obj = champions.data[champ];
			idToName[obj.key] = obj.name
			championsCache[obj.key] = obj
		});
	}

    mainWindow.webContents.send("updateList", {masteries: masteries.response, names: idToName, success: true})
}

ipcMain.on('parseMastery', (event, arg) => {
	parseMastery(arg)
})

ipcMain.on("updatePodium", async (event) => {
    const podiumWindow = BrowserWindow.getAllWindows().find(w => w.title === "Podium")
	if (!podiumWindow) {
		event.sender.send("updatePodium", {success: false})
		return;
	}

	// find top 3 mastery to advance
	let masteries = await api.Champion.masteryBySummoner(summonerId, region)
	let filtered = masteries.response.filter(c => c.championLevel < 5)
	filtered.sort(function(a, b) { return a.championPoints < b.championPoints})
	filtered = filtered.slice(0, 3)

	filtered.forEach(champ => {
		let champInfo = championsCache[champ.championId]
		champ.imgUrl = `http://ddragon.leagueoflegends.com/cdn/${champInfo.version}/img/champion/${champInfo.image.full}`
	})

	event.sender.send("updatePodium", {podium: filtered, success: true})
})

ipcMain.on("updateRegion", async (event, arg) => {
    switch (arg) {
        case "EUW": region = Constants.Regions.EU_WEST; break
        case "EUNE": region = Constants.Regions.EU_EAST; break
        case "NA": region = Constants.Regions.AMERICA_NORTH; break
        case "BR": region = Constants.Regions.BRAZIL; break
        case "JP": region = Constants.Regions.JAPAN; break
        case "KR": region = Constants.Regions.KOREA; break
        case "RU": region = Constants.Regions.RUSSIA; break
        case "TR": region = Constants.Regions.TURKEY; break
        case "OCE": region = Constants.Regions.OCEANIA; break
        case "LAS": region = Constants.Regions.LAT_SOUTH; break
        case "LAN": region = Constants.Regions.LAT_NORTH; break
    }
})