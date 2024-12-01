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
            chrome.storage.local.get(`ref_checkbox_${url.hostname}`, function (result) {
            const refCheckBoxIsChecked = result[`ref_checkbox_${url.hostname}`];
            if (refCheckBoxIsChecked !== null){
                const refCheckBox = document.getElementById('ref-checkbox');
                console.log(typeof refCheckBoxIsChecked);
                refCheckBox.checked = refCheckBoxIsChecked;
            }
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
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "content-to-popup") {
        port.onMessage.addListener((message) => {
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
    chrome.storage.local.set({ [`ref_checkbox_${url.hostname}`]: refCheckBox.checked }, function () {
        console.log('Checkbox state saved');
    });
});




// On DOM content load, display all parameters
document.addEventListener('DOMContentLoaded', () => displayParams('all'));
