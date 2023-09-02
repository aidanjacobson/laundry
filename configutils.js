/*function saveConfig() {
    var url = `https://aidanjacobson.duckdns.org:8123/api/states/input_text.laundry_json`;
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${access_token}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({state: JSON.stringify(config)}));
    return new Promise(function(resolve) {
        xhr.onload = function() {
            resolve();
        }
    });
}
*/

async function saveConfig() {
    server.config = config;
    await server.uploadConfig();
}

function promptForPassword() {
    localStorage.dkey = prompt("Please Enter Decryption Key");
    location.reload();
}

var server;
const store = "laundry";
var securityKey;

async function doAccessCheck() {
    if (localStorage.dkey) {
        securityKey = localStorage.dkey;
        server = new ConfigLoader({store, securityKey});
        if (!(await server.validate())) {
            promptForPassword();
        }
    } else {
        promptForPassword();
    }
}


//var encrypted_access_token = "U2FsdGVkX1+BS7W57qcuksbGeOhMELdKhPGdFruceXcLa74zjeuaGq1ELrfEpq+GjaeCRQiAA2OaUJY0rfXil0NB/VlMeqHNTxo69hBYu3eQcGHhKSrQGY0hn6obMS3w5nagv1Q+kM6OcoRjewNBgAvEK97AcVapxiusHjPlbpUEfllwb5TgiznJouFPYaUj3hwKq6Km3vVy+cbTIoZxMryMuEPXcvAybrhwrJtsidyWy0Z7VWyDg949CULWnaseJtPR+EGMaOtAP5tXwmmV6A==";

/*
function retrieveConfig() {
    return new Promise(function(resolve) {
        var url = `https://aidanjacobson.duckdns.org:8123/api/states/input_text.laundry_json`;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.setRequestHeader("Authorization", `Bearer ${access_token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function() {
            resolve(JSON.parse(JSON.parse(xhr.responseText).state));
        }
        xhr.send();
    })
}
*/

async function retrieveConfig() {
    config = await server.downloadConfig();
    return config;
}

var updateConfig = retrieveConfig;

var config = {};