// Saves the config to the server
async function saveConfig() {
    server.config = config;
    await server.uploadConfig();
}

function promptForPassword() {
    localStorage.dkey = prompt("Please Enter Decryption Key");
    location.reload();
}

var server;
const store = "laundry"; // storage bin name
var securityKey;

// Check if password has been provided, and if it's valid
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

// download config from server;
async function updateConfig() {
    config = await server.downloadConfig();
    return config;
}

var config = {};