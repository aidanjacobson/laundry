/*
options {
    securityKey: String,
    store: String
}
*/

function ConfigLoader(options) {
    var endpoint = "https://aidanjacobson.duckdns.org:42069";
    var storageEndpoint, validateEndpoint, pingEndpoint;
    var setEndpoints = function() {
        storageEndpoint = endpoint + "/store/" + options.store;
        validateEndpoint = endpoint + "/validate/" + options.securityKey;
        pingEndpoint = endpoint + "/ping";
    }
    setEndpoints();
    var _this = this;
    _this.config = {};
    _this.validate = async function() {
        await _this.ping();
        validateEndpoint = endpoint + "/validate/" + options.securityKey;
        var response = await xhrGet(validateEndpoint);
        return response.valid;
    }
    var xhrGet = function(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.crossorigin = "";
            xhr.open("GET", url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Security-key", options.securityKey);
            xhr.send();
            xhr.onload = function() {
                resolve(JSON.parse(xhr.responseText));
            }
            xhr.onerror = function() {
                reject();
            }
        });
    }
    var xhrPost = function(url, data) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.crossorigin = "";
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Security-key", options.securityKey);
            xhr.send(JSON.stringify(data));
            xhr.onload = function() {
                resolve(JSON.parse(xhr.responseText));
            }
        });
    }
    _this.downloadConfig = async function() {
        _this.config = await xhrGet(storageEndpoint);
        return _this.config;
    }
    _this.uploadConfig = async function() {
        await xhrPost(storageEndpoint, _this.config);
    }

    _this.ping = async function() {
        try {
            await xhrGet(pingEndpoint);
            return true;
        } catch(e) {
            endpoint = "https://homeassistant.local:42069";
            console.log("Switching to local");
            setEndpoints();
            try {
                await xhrGet(pingEndpoint);
                return true;
            } catch (e2) {
                return false;
            }
        }
    }
}