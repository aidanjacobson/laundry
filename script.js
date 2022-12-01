/*
    config: {
        loads: [{
            started: timestamp
            duration: millis
            location: number
              0: washer
              1: dryer
            machineNumber: String
        }]
    }
*/
async function main() {
    mainPage = document.querySelector("#mainPage");
    moreInfo = document.querySelector("#moreInfo");
    doAccessCheck();
    await parseLaundries();
}

window.addEventListener("load", main);

async function startLaundry() {
    var time = Date.now();
    config.loads.push({
        started: time,
        duration: 30*60*1000,
        location: 0,
        machineNumber: ""
    });
    await saveConfig();
    await parseLaundries();
}

async function parseLaundries() {
    await updateConfig();
    loads.innerHTML = "";
    for (var i = 0; i < config.loads.length; i++) {
        var load = config.loads[i];
        var loadElement = document.createElement("div");
        loadElement.classList.add("load");
        var locationString = load.location == 0 ? "Washer" : "Dryer";
        if (load.machineNumber && load.machineNumber != "") {
            locationString += " " + load.machineNumber;
        }
        locationString += " (tap to change)"
        if (load.location == 0) {
            loadElement.classList.add("wash");
        } else {
            loadElement.classList.add("dry");
        }
        if (Date.now() > load.started+load.duration) loadElement.classList.add("done");
        loadElement.setAttribute("data-index", i);

        var timeElement = document.createElement("p");
        var locationElement = document.createElement("p");
        locationElement.innerText = `${locationString}`;
        loadElement.appendChild(timeElement);
        loadElement.appendChild(locationElement);
        loadElement.addEventListener("click", doLoadClickHandle, true)
        loads.appendChild(loadElement);
    }
}

setInterval(updateLaundryTexts, 50)

function updateLaundryTexts() {
    for (var i = 0; i < loads.children.length; i++) {
        var loadElement = loads.children[i];
        var load = config.loads[i];
        var finishingTime = new Date(load.started+load.duration);
        var finishingString = finishingTime.toLocaleString("en-US", {hour: "numeric", minute: "2-digit"});
        var remaining = load.started+load.duration-Date.now(); // millis
        var minutes = Math.floor(remaining/1000/60);
        remaining -= minutes*1000*60;
        var seconds = Math.floor(remaining/1000).toString().padStart(2, "0");
        if (Date.now() > load.started+load.duration) {
            loadElement.children[0].innerText = `Finished at ${finishingString}`;
        } else {
            loadElement.children[0].innerText = `${finishingString} - ${minutes}:${seconds} remaining`;
        }
    }
}

function doLoadClickHandle(event) {
    var index = +event.target.getAttribute("data-index");
    console.log(event.target);
    moreInfoFor(index);
}
var mainPage;
var moreInfo;
var lastIndex;
function moreInfoFor(index) {
    console.log(index);
    lastIndex = index;
    mainPage.hide();
    moreInfo.show();
    miStart.innerText = new Date(config.loads[lastIndex].started).toLocaleString("en-US", {hour: "numeric", minute: "2-digit"});
    miEnd.innerText = new Date(config.loads[lastIndex].started+config.loads[lastIndex].duration).toLocaleString("en-US", {hour: "numeric", minute: "2-digit"});
    miLoc.innerText = config.loads[lastIndex].location == 0 ? "Washer" : "Dryer";
    miNum.innerText = config.loads[lastIndex].machineNumber=="" ? "Click to Set" : config.loads[lastIndex].machineNumber;
    actionBtn.innerText = "Click to Move to Dryer";
    if (config.loads[lastIndex].location == 1) {
        actionBtn.innerText = "Click to Delete";
    }
}

HTMLElement.prototype.hide = function() {
    this.hidden = true;
}
HTMLElement.prototype.show = function() {
    this.removeAttribute("hidden");
}

async function miSet() {
    var newMi = prompt("Enter Machine Number", config.loads[lastIndex].machineNumber)
    if (newMi) {
        config.loads[lastIndex].machineNumber = newMi;
    }
    miNum.innerText = newMi;
    await saveConfig();
    moreInfoFor(lastIndex);
}

function backToMain() {
    moreInfo.hide();
    mainPage.show();
    parseLaundries();
}

async function actionBtnClick() {
    if (config.loads[lastIndex].location == 0) {
        config.loads[lastIndex].location = 1;
        config.loads[lastIndex].machineNumber = "";
        config.loads[lastIndex].started = Date.now();
        config.loads[lastIndex].duration = 50*60*1000;
    } else {
        config.loads.splice(lastIndex, 1);
    }
    await saveConfig();
    backToMain();
}