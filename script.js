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
        nextFinish: timestamp,
        lastFinish: timestamp
    }
*/

const washer_mins = 38;
const dryer_mins = 50;

async function main() {
    mainPage = document.querySelector("#mainPage");
    moreInfo = document.querySelector("#moreInfo");
    await doAccessCheck();
    await parseLaundries();
}

window.addEventListener("load", main);

async function startLaundry() {
    var time = Date.now();
    config.loads.push({
        started: time,
        duration: washer_mins*60*1000,
        location: 0,
        machineNumber: ""
    });
    calculateFirstAndLastFinish();
    await saveConfig();
    await parseLaundries();
}

function calculateFirstAndLastFinish() {
    var firstFinish = -1;
    var lastFinish = -1;
    for (var i = 0; i < config.loads.length; i++) {
        if ((config.loads[i].started+config.loads[i].duration < firstFinish || firstFinish == -1) && config.loads[i].started+config.loads[i].duration > Date.now()) {
            firstFinish = config.loads[i].started+config.loads[i].duration;
        }
        if (config.loads[i].started+config.loads[i].duration > lastFinish || lastFinish == -1) {
            lastFinish = config.loads[i].started+config.loads[i].duration;
        }
    }
    config.nextFinish = firstFinish;
    config.lastFinish = lastFinish;
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
        loadElement.addEventListener("click", doLoadClickHandle, true);
        loadElement.children[0].setAttribute("data-index", i);
        loadElement.children[1].setAttribute("data-index", i);
        loads.appendChild(loadElement);
    }
}

setInterval(updateLaundryTexts, 50)

function updateLaundryTexts() {
    for (var i = 0; i < loads.children.length; i++) {
        var loadElement = loads.children[i];
        if (!loadElement) continue;
        var load = config.loads[i];
        var finishingTime = new Date(load.started+load.duration);
        var finishingString = finishingTime.toLocaleString("en-US", {hour: "numeric", minute: "2-digit"});
        var remaining = load.started+load.duration-Date.now(); // millis
        var minutes = Math.floor(remaining/1000/60);
        remaining -= minutes*1000*60;
        var seconds = Math.floor(remaining/1000).toString().padStart(2, "0");
        if (Date.now() > load.started+load.duration) {
            loadElement.children[0].innerText = `Finished at ${finishingString}`;
            loadElement.classList.add("done");
        } else {
            loadElement.children[0].innerText = `${finishingString} - ${minutes}:${seconds} remaining`;
        }
    }
}

function doLoadClickHandle(event) {
    event.stopPropagation();
    var index = +event.target.getAttribute("data-index");
    moreInfoFor(index);
}
var mainPage;
var moreInfo;
var lastIndex;
function moreInfoFor(index) {
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
        config.loads[lastIndex].duration = dryer_mins*60*1000;
    } else {
        config.loads.splice(lastIndex, 1);
    }
    calculateFirstAndLastFinish();
    await saveConfig();
    backToMain();
}

async function setStartTime() {
    var currentTime = new Date(config.loads[lastIndex].started).toLocaleString("en-US", {hour: "numeric", minute: "2-digit"});
    var newStart = prompt("Enter new start time", currentTime);
    var newDate = new Date(getTripleDate() + " " + newStart);
    if (isNaN(newDate)) {
        alert("Invalid start time! Make sure to include either AM or PM with a space before.");
        return;
    }
    config.loads[lastIndex].started = newDate.getTime();
    calculateFirstAndLastFinish();
    await saveConfig();
    moreInfoFor(lastIndex);
}

function getTripleDate() {
    var d = new Date();
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
}