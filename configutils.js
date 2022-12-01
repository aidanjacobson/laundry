function saveConfig() {
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
function promptForPassword() {
    localStorage.dkey = prompt("Please Enter Decryption Key");
    location.reload();
}
function doAccessCheck() {
    if (localStorage.dkey) {
        access_token = CryptoJS.AES.decrypt(encrypted_access_token, localStorage.dkey).toString(CryptoJS.enc.Utf8);
        if (access_token == "") {
            promptForPassword();
        }
    } else {
        promptForPassword();
    }
}
var encrypted_access_token = "U2FsdGVkX1+BS7W57qcuksbGeOhMELdKhPGdFruceXcLa74zjeuaGq1ELrfEpq+GjaeCRQiAA2OaUJY0rfXil0NB/VlMeqHNTxo69hBYu3eQcGHhKSrQGY0hn6obMS3w5nagv1Q+kM6OcoRjewNBgAvEK97AcVapxiusHjPlbpUEfllwb5TgiznJouFPYaUj3hwKq6Km3vVy+cbTIoZxMryMuEPXcvAybrhwrJtsidyWy0Z7VWyDg949CULWnaseJtPR+EGMaOtAP5tXwmmV6A==";
var access_token = "";
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

var config = {};
async function updateConfig() {
    config = await retrieveConfig();
}