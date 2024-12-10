// popup.js

// Get Browser API (Chrome or Firefox)
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

/**
 * Displays the parameters or reflections in the popup.
 * @param {string} state - The state ('all' for all parameters, 'refs' for reflections).
 */
async function displayParams(state) {
    try {
        // Get the current active tab's URL
        const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
        const url = new URL(tabs[0].url); // Extract the current tab's URL
        const key = `${url.hostname}_${state}`;

        // Retrieve stored parameters from local storage
        setTimeout(async () => {
            const result = await browserAPI.storage.local.get(key);
            const params = result[key]; // Extract the parameters from the result

            const list = document.getElementById('matches-list');
            list.innerHTML = ''; // Clear any existing list items

            // Display parameters or reflections based on the retrieved data
            if (Array.isArray(params) && params.length > 0) {
                // If params is an array and has elements
                params.forEach(param => {
                    const listItem = document.createElement('li');
                    listItem.textContent = param;
                    list.appendChild(listItem);
                });
            } else if (typeof params === 'object' && Object.keys(params).length > 0) {
                // If params is an object and has keys
                for (const key in params) {
                    if (params.hasOwnProperty(key)) {
                        const listItem = document.createElement('li');
                        listItem.textContent = `${key}: ${params[key]}`;
                        list.appendChild(listItem);
                    }
                }
            } else {
                // If no parameters are found, show a message
                const listItem = document.createElement('li');
                listItem.textContent = 'No Parameter Found In This Page';
                listItem.classList.add('empty');
                list.appendChild(listItem);
            }

            // Save and restore scroll position
            scrollSave();
            restoreScrollPosition();

            // Restore Reflection Checkbox State
            browserAPI.storage.local.get(`ref_checkbox_${url.hostname}`, function (result) {
            const refCheckBoxIsChecked = result[`ref_checkbox_${url.hostname}`];
            if (refCheckBoxIsChecked !== null){
                const refCheckBox = document.getElementById('ref-checkbox');
                refCheckBox.checked = refCheckBoxIsChecked;
            }
            });

            // Restore Regex Checkbox State
            browserAPI.storage.local.get(`regex_checkbox_${url.hostname}`, async function (result) {
            const regexCheckBoxIsChecked = result[`regex_checkbox_${url.hostname}`];
            if (regexCheckBoxIsChecked !== null){
                const regexCheckBox = document.getElementById('regex-checkbox');
                regexCheckBox.checked = regexCheckBoxIsChecked;
                const regexPatternBox = document.getElementById('regex-box');

                // Only get the pattern if the checkbox is checked
                if(regexCheckBoxIsChecked === true){

                    // Get the regex pattern
                    await browserAPI.storage.local.get(`regex_pattern_${url.hostname}`, (result) => {
                        const regexPattern = result[`regex_pattern_${url.hostname}`];
                        if(regexPattern !== null){
                            regexPatternBox.value = regexPattern;
                    } else {
                        // If empty, to avoid 'undefined'
                        regexPatternBox.value = '';
                    }
                    });
                    regexPatternBox.style.display = 'block';
                } else {
                    regexPatternBox.style.display = 'none';
                }
            }
            });

            // Restore passive logging checkbox state
            browserAPI.storage.local.get(`log_checkbox_${url.hostname}`, async function(result){
                const logCheckBoxIsChecked = result[`log_checkbox_${url.hostname}`];
                const passiveLogCheckbox = document.getElementById('log-checkbox');

                if(logCheckBoxIsChecked !== null){
                    passiveLogCheckbox.checked = logCheckBoxIsChecked;

                    const downloadButton = document.getElementById('log-button');

                    // Show download button if checked
                    if(logCheckBoxIsChecked === true){
                        downloadButton.style.display = 'block';
                    } else{
                        downloadButton.style.display = 'none';
                    }
                }
            });

            // Download file when the download button is clicked
            const downloadButton = document.getElementById('log-button');
            downloadButton.addEventListener('click', async function(){
                saveParamsToFile();
            });

        }, 0);
    } catch (error) {
        console.error('Error retrieving parameters:', error);
    }
}

/**
 * Checks if reflections exist for the current page.
 * @returns {Promise<boolean>} - Returns true if reflections exist, otherwise false.
 */
async function doesRefsExist() {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url); // Get the current tab's URL
    const key = `${url.hostname}_refs`;

    const result = await browserAPI.storage.local.get(key);
    const params = result[key];

    return params ? true : false; // Return true if reflections exist
}

/**
 * Restores the scroll position of the matches list when the popup is opened.
 */
async function restoreScrollPosition() {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url); // Get the current tab's URL
    const key = `${url.hostname}`;
    const scrollKey = `${key}_scrollPosition`;

    const list = document.getElementById('matches-list');

    setTimeout(() => {
        const savedScrollPosition = localStorage.getItem(scrollKey);
        if (savedScrollPosition) {
            list.scrollTop = savedScrollPosition; // Restore the scroll position
        }
    }, 0);
}

/**
 * Saves the scroll position of the matches list whenever the user scrolls.
 */
async function scrollSave() {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url); // Get the current tab's URL
    const key = `${url.hostname}`;
    const scrollKey = `${key}_scrollPosition`;

    const list = document.getElementById('matches-list');

    list.addEventListener("scroll", () => {
        const scrollPosition = list.scrollTop;
        localStorage.setItem(scrollKey, scrollPosition); // Save the scroll position
    });
}

// Save all params into a json file
async function saveParamsToFile(){
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url);

    await browserAPI.storage.local.get(`logged_params_${url.hostname}`, function(result){
        let loggedParams = result[`logged_params_${url.hostname}`];
        const jsonData = JSON.stringify(loggedParams, null, 2); // Pretty-printed JSON

        const blob = new Blob([jsonData], { type: 'application/json' });

        // Create an anchor element to trigger the download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob); // Create an object URL for the Blob
        link.download = 'items.json'; // Set the filename for the download
        // Trigger the download by simulating a click
        link.click();
    });
}

// Handle the button click to toggle between viewing reflections or parameters
document.getElementById('check-button').addEventListener('click', async function () {
    const button = document.getElementById('check-button');
    const title = document.getElementById('list-title');

    if (button.innerHTML === 'Check Reflections') {
        const exists = await doesRefsExist(); // Check if reflections exist

        if (exists) {
            button.innerHTML = 'All Parameters';
            title.innerHTML = 'Reflections';
            await displayParams('refs'); // Display reflections
        } else {
            // If no reflections exist, request content script to check
            const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
            await browserAPI.tabs.sendMessage(tabs[0].id, { type: 'sendMessageToContent', message: 'check' });

            button.innerHTML = 'Checking';
            title.innerHTML = 'Waiting';
        }
    } else {
        button.innerHTML = 'Check Reflections';
        title.innerHTML = 'Parameters';
        await displayParams('all'); // Display all parameters
    }
});

// Listen for a connection from the content script
browserAPI.runtime.onConnect.addListener(async (port) => {
    if (port.name === "content-to-popup") {
        port.onMessage.addListener(async (message) => {
            if (message.state === 'checked') {
                // Once the content script finishes checking, display reflections
                const button = document.getElementById('check-button');
                const title = document.getElementById('list-title');
                displayParams('refs');
                button.innerHTML = 'All Parameters';
                title.innerHTML = 'Reflections';
            }
        });
    }
});

// Show Settings Menu
document.addEventListener('click', function(event) {
    // Check if the clicked element is the gearIcon or inside it
    const gearIcon = document.getElementById('gearIcon');
    if (event.target.closest('#gearIcon')) {
        const settingsContainer = document.getElementById('settingsContainer');
        const listContainer = document.getElementById('listContainer');

        // Show/Hide settings menu
        if (listContainer.style.display === 'block') {
            listContainer.style.display = 'none';
            settingsContainer.style.display = 'block';
        } else {
            listContainer.style.display = 'block';
            settingsContainer.style.display = 'none';
        }
    }
});


// Back to Parameters List
const backButton = document.getElementById('back-button');
backButton.addEventListener('click', function(){
    const settingsContainer = document.getElementById('settingsContainer');
    const listContainer = document.getElementById('listContainer');

    // Show/Hide settings menu
    if (listContainer.style.display === 'block') {
        listContainer.style.display = 'none';
        settingsContainer.style.display = 'block';
    } else {
        listContainer.style.display = 'block';
        settingsContainer.style.display = 'none';
    }
});


// Passive Reflection Checking
const refCheckBox = document.getElementById('ref-checkbox');
refCheckBox.addEventListener('change', async function () {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url);
    
    // Save the checkbox state in chrome.storage.local
    await browserAPI.storage.local.set({ [`ref_checkbox_${url.hostname}`]: refCheckBox.checked }, function () {
    });
});


// Regex Match checkbox toggle action
const regexCheckBox = document.getElementById('regex-checkbox');
regexCheckBox.addEventListener('change', async function() {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const regexPatternBox = document.getElementById('regex-box');
    const url = new URL(tabs[0].url);

    // Show/Hide regex pattern box
    if(regexCheckBox.checked === true){
        regexPatternBox.style.display = 'block';
        await browserAPI.storage.local.get(`regex_pattern_${url.hostname}`, (result) => {
            const regexPattern = result[`regex_pattern_${url.hostname}`];
            if(regexPattern !== null){
                regexPatternBox.value = regexPattern; 
        } else {
            regexPatternBox.value = '';
        }
    });
    } else {
        regexPatternBox.style.display = 'none';
    }
    
    // Save the checkbox state in chrome.storage.local
    await browserAPI.storage.local.set({ [`regex_checkbox_${url.hostname}`]: regexCheckBox.checked });
});

// Save the pattern to the storage
const regexPatternBox = document.getElementById('regex-box');
regexPatternBox.addEventListener('input', async function(){
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url);

    await browserAPI.storage.local.set({ [`regex_pattern_${url.hostname}`]: regexPatternBox.value });
});

// Passive Logging State
const passiveLogCheckbox = document.getElementById('log-checkbox');
passiveLogCheckbox.addEventListener('change', async function(){
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tabs[0].url);

    // Show Download Button
    const downloadButton = document.getElementById('log-button');

    if(passiveLogCheckbox.checked === true){
        downloadButton.style.display = 'block'
    } else{

        await browserAPI.storage.local.remove([`logged_params_${url.hostname}`]);
        downloadButton.style.display = 'none';
    }

    // Save checkbox state in storage
    await browserAPI.storage.local.set({[`log_checkbox_${url.hostname}`]: passiveLogCheckbox.checked});
});

// On DOM content load, display all parameters
document.addEventListener('DOMContentLoaded', () => displayParams('all'));
