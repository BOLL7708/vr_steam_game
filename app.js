let _ws;
let _appId;
let _connected = false;
let _ignoreIds = [400040,689580,908520,1068820]; // Add applications that should not be displayed here
let _currentId = -1;
let _loadingId = -1;

function init() {
    openSocket();
    setInterval(openSocket, 5000); // Will try to reconnect if disconnected
}

function openSocket() {
    if(_connected) return;
    _ws = new WebSocket("ws://localhost:7708");
    _ws.onopen = function(ev) {
        _connected = true;
        console.log("Connected!");
    }
    _ws.onclose = function(ev) {
        console.log("Disconnected!");
        _connected = false;
    }
    _ws.onmessage = function(ev) {
        let payload = JSON.parse(ev.data);
        switch(payload.key) {
            case "ApplicationInfo":
                let appId = payload.data.id;
                if (appId.length == 0) return; // Empty ID
                console.log("Incoming application id: "+appId);
                let appIdParts = appId.split('.');
                if (appIdParts.length < 3) return; // Faulty ID format
                let id = appIdParts.pop();
                if(_currentId == id) return; // Same game as before
                let type = appIdParts.pop();
                let system = appIdParts.pop();
                let platform = appIdParts.length != 0 ? appIdParts.pop() : "";
                if(system != "steam") return; // Not a Steam game
                if(_ignoreIds.indexOf(id) >= 0) return; // It's an ignored ID
                console.log("Application id updated: "+id);

                // Load store data
                if(_loadingId == id) return; // Already loading data for this ID
                _loadingId = id;
                let url = "proxy.php?url=https://store.steampowered.com/api/appdetails?appids="+id;
                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        _loadingId = -1;
                        let game = data[id];
                        if(typeof game !== "undefined") {
                            _currentId = id;
                            updateGUI(game.data);
                        }
                    });
                break;
        }
    }
    _ws.onerror = function(ev) {
        console.log("Error!");
        _ws = null;
        _connected = false;
    }
}

function updateGUI(data) {
    // Currency symbols (add more if needed)
    let currencyTable = {
        "EUR": "€",
        "USD": "$",
        "GBP": "£"
    };

    // Get price values
    let price = data.is_free ? 0 : data?.price_overview?.final ?? -1;
    let currency = data.is_free ? "" : data?.price_overview?.currency ?? "";
    let discount = data.is_free ? 0 : data?.price_overview?.discount_percent ?? 0;
    
    // Build price text
    let priceText = "N/A";
    let discountText = discount > 0 ? ` (-${discount}%)` : "";
    if(price < 0) priceText = "Price not set";
    else if(price == 0) priceText = "Free";
    else priceText = currencyTable[currency] + (price / 100) + discountText;

    // Update interface elements
    let bannerDiv = document.querySelector(".banner");
    let titleDiv = document.querySelector(".title");
    let priceDiv = document.querySelector(".price");
    bannerDiv.innerHTML = `<img src="${data.header_image}"/>`;
    titleDiv.innerHTML = `<p>${data.name}</p>`;
    priceDiv.innerHTML = `<p>${priceText}</p>`;
}