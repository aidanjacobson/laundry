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
        lastFinish: timestamp,
        settings: {
            notifs: String,
            loadTimes: {
                washer: Number,
                dryer: Number
            }
        }
    }
*/

// Window loaded
window.addEventListener("load", main);
async function main() {
    mainPage = document.querySelector("#mainPage");
    moreInfo = document.querySelector("#moreInfo");
    await doAccessCheck();
    await parseLaundries();
}

// Starts a new load of laundry in the washer;
async function startLaundry() {
    var time = Date.now();
    config.loads.push({
        started: time,
        duration: config.settings.loadTimes.washer*60*1000,
        location: 0,
        machineNumber: ""
    });
    await calculateFirstAndLastFinish();
    await saveConfig();
    await parseLaundries();
}

// calculate the time when the first load will be done, and when the last load (all loads) will be done
// used for quick information display in smart home
function calculateFirstAndLastFinish() {
    var firstFinish = -1;
    var lastFinish = -1;
    for (var i = 0; i < config.loads.length; i++) {
        if ((config.loads[i].started+config.loads[i].duration < firstFinish || firstFinish == -1)) { // found new first finisher that isn't already done
            firstFinish = config.loads[i].started+config.loads[i].duration;
        }
        if (config.loads[i].started+config.loads[i].duration > lastFinish || lastFinish == -1) { // found new last finisher
            lastFinish = config.loads[i].started+config.loads[i].duration;
        }
    }
    console.log(firstFinish, lastFinish);
    config.nextFinish = firstFinish;
    config.lastFinish = lastFinish;
    updateFinishBasedOnPrefs();
}

// read list of loads and populate display accordingly
async function parseLaundries() {
    await updateConfig();
    updateSelectedPrefs();
    updateLoadTimesFromConfig();
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

setInterval(updateLaundryTexts, 50) // update time remaining ~20 times / second

// update remaining time on existing laundry cards to avoid re-rendering all cards
function updateLaundryTexts() {
    if (!config.loads) {
        return;
    }
    if (loads.children.length != config.loads.length) {
        parseLaundries();
        return;
    }
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

// click handler for laundry card
function doLoadClickHandle(event) {
    event.stopPropagation();
    var index = +event.target.getAttribute("data-index");
    moreInfoFor(index);
}

var mainPage;
var moreInfo;
var lastIndex;
function moreInfoFor(index) { // show detailed view for load by load index
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

// element helper functions
HTMLElement.prototype.hide = function() {
    this.hidden = true;
}
HTMLElement.prototype.show = function() {
    this.removeAttribute("hidden");
}

// set machine number on more info page
async function miSet() {
    var newMi = prompt("Enter Machine Number", config.loads[lastIndex].machineNumber)
    if (newMi) {
        config.loads[lastIndex].machineNumber = newMi;
    }
    miNum.innerText = newMi;
    await saveConfig();
    moreInfoFor(lastIndex);
}

// back button on more info page click handler
function backToMain() {
    moreInfo.hide();
    mainPage.show();
    parseLaundries();
}

// "move to dryer" or "delete load" click
async function actionBtnClick() {
    if (config.loads[lastIndex].location == 0) { // load is in washer, move to dryer
        config.loads[lastIndex].location = 1;
        config.loads[lastIndex].machineNumber = "";
        config.loads[lastIndex].started = Date.now();
        config.loads[lastIndex].duration = config.settings.loadTimes.dryer*60*1000;
    } else { // load is in dryer, we can delete
        config.loads.splice(lastIndex, 1);
    }
    calculateFirstAndLastFinish();
    await saveConfig();
    backToMain();
}

// set new start time for laundry load
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

// helper function to return date in mm/dd/yyyy format
function getTripleDate() {
    var d = new Date();
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
}

function settingsClick() {
    mainPage.hide();
    settings.show();
}

async function doNotifPrefChange() {
    var selectedOption = document.querySelector('input[name="notif-pref"]:checked').value;
    config.settings.notifs = selectedOption;
    calculateFirstAndLastFinish();
    await saveConfig();
}

function updateFinishBasedOnPrefs() {
    if (config.settings.notifs == "alldone") {
        config.finish = config.lastFinish;
    } else {
        config.finish = config.nextFinish;
    }
}

function updateSelectedPrefs() {
    updateSelectedNotifPref();
}

function updateSelectedNotifPref() {
    var elements = document.getElementsByName("notif-pref");
    for (var i = 0; i < elements.length; i++) {
        elements[i].checked = false;
        if (config.settings.notifs == elements[i].value) {
            elements[i].checked = true;
        }
    }
}

function backFromSettings() {
    settings.hide();
    mainPage.show();
}

async function doWasherTimeChange() {
    config.settings.loadTimes.washer = +washerMins.value;    
    await saveConfig();
}

async function doDryerTimeChange() {
    config.settings.loadTimes.dryer = +dryerMins.value;
    await saveConfig();
}

function updateLoadTimesFromConfig() {
    washerMins.value = config.settings.loadTimes.washer;
    dryerMins.value = config.settings.loadTimes.dryer;
}