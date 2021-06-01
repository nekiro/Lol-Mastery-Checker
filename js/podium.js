//renderer process
const { ipcRenderer } = require('electron');

// exit button
const exitBtn = document.querySelector(".close-btn")
exitBtn.addEventListener("click", () => { ipcRenderer.send('menuBtnAction', "podium-exit") })

// minimize
const minimizeBtn = document.querySelector(".minimize-btn")
minimizeBtn.addEventListener("click", () => { ipcRenderer.send('menuBtnAction', "podium-minimize") })

// open main window
const openMainBtn = document.querySelector(".open-main-btn")
openMainBtn.addEventListener("click", () => { ipcRenderer.send('menuBtnAction', "open-main") })

// podium list
const podiumList = document.querySelector(".podium-list")

var shouldUpdatePodium = true

function updatePodium() {
    if (!shouldUpdatePodium) {
        return
    }

    ipcRenderer.send("updatePodium")

    // loop the update
    setTimeout(updatePodium, 60000)
}

// fire first update
updatePodium()

ipcRenderer.on("updatePodium", async (event, args) => {
    if (!args.success) {
        shouldUpdatePodium = false
        return;
    }

    podiumList.innerHTML = ""

    args.podium.forEach(element => {
        let champImg = document.createElement("img")
        champImg.alt = "champ"
        champImg.src = element.imgUrl
        champImg.style.pointerEvents = "none"

        podiumList.appendChild(champImg)

        let div = document.createElement("div")

        let elem = document.createElement("div")
        elem.id = "champMasteryPts"
        elem.innerText = `${element.championPoints} points`

        div.appendChild(elem)

        elem = document.createElement("div")
        elem.id = "champMasteryNextLvl"
        elem.innerText = `${element.championPointsUntilNextLevel} to go`

        div.appendChild(elem)

        podiumList.appendChild(div)
    })
})
