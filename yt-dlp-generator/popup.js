document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const elements = {
        commandOutput: document.getElementById('commandOutput'),
        copyButton: document.getElementById('copyButton'),
        resetButton: document.getElementById('resetButton'),
        // URL Source
        urlSourceRadios: document.querySelectorAll('input[name="urlSource"]'),
        scanOptions: document.getElementById('scanOptions'),
        scanTypeRadios: document.querySelectorAll('input[name="scanType"]'),
        scannedUrlsContainer: document.getElementById('scannedUrlsContainer'),
        customUrlOptions: document.getElementById('customUrlOptions'),
        customUrl: document.getElementById('customUrl'),
        // Link Type
        linkTypeRadios: document.querySelectorAll('input[name="linkType"]'),
        singleVideoOptions: document.getElementById('singleVideoOptions'),
        outputFileName: document.getElementById('outputFileName'),
        playlistOptions: document.getElementById('playlistOptions'),
        playlistRangeRadios: document.querySelectorAll('input[name="playlistRange"]'),
        playlistItems: document.getElementById('playlistItems'),
        // Download Type
        downloadTypeRadios: document.querySelectorAll('input[name="downloadType"]'),
        videoOptions: document.getElementById('videoOptions'),
        videoFormat: document.getElementById('videoFormat'),
        videoQuality: document.getElementById('videoQuality'),
        audioOptions: document.getElementById('audioOptions'),
        audioFormat: document.getElementById('audioFormat'),
        audioQuality: document.getElementById('audioQuality'),
        // Subtitles
        enableSubtitles: document.getElementById('enableSubtitles'),
        subtitleOptions: document.getElementById('subtitleOptions'),
        subTypeRadios: document.querySelectorAll('input[name="subType"]'),
        subtitleLang: document.getElementById('subtitleLang'),
        subtitleFormat: document.getElementById('subtitleFormat'),
        // Other Options
        noMtime: document.getElementById('noMtime'),
        embedThumbnail: document.getElementById('embedThumbnail'),
        writeThumbnail: document.getElementById('writeThumbnail'),
        noCacheDir: document.getElementById('noCacheDir'),
        rmCacheDir: document.getElementById('rmCacheDir'),
        // Download Path
        enableDownloadPath: document.getElementById('enableDownloadPath'),
        downloadPathOptions: document.getElementById('downloadPathOptions'),
        downloadPath: document.getElementById('downloadPath'),
        // Extra
        extraCommands: document.getElementById('extraCommands'),
    };

    let currentTabUrl = '';
    const defaultSettings = {
        urlSource: 'current', scanType: 'internal', customUrl: '', linkType: 'single', outputFileName: '',
        playlistRange: 'all', playlistItems: '', downloadType: 'video', videoFormat: 'mp4', videoQuality: '720p',
        audioFormat: 'mp3', audioQuality: '128k', enableSubtitles: true, subType: 'separate',
        subtitleLang: 'en', subtitleFormat: 'vtt', noMtime: true, embedThumbnail: false,
        writeThumbnail: false, noCacheDir: false, rmCacheDir: false, enableDownloadPath: true,
        downloadPath: 'C:\\Users\\xdev\\Downloads', extraCommands: ''
    };

    // --- MAIN LOGIC ---

    const generateCommand = () => {
        let command = ['yt-dlp'];
        let targetUrl = '';

        // 1. Determine Target URL
        const urlSource = getRadioValue('urlSource');
        if (urlSource === 'current') {
            targetUrl = currentTabUrl;
        } else if (urlSource === 'custom') {
            targetUrl = elements.customUrl.value.trim();
        } else if (urlSource === 'scan') {
            const selectedUrlRadio = elements.scannedUrlsContainer.querySelector('input[name="scannedUrl"]:checked');
            if (selectedUrlRadio) {
                targetUrl = selectedUrlRadio.value;
            }
        }
        
        // 2. Link Type
        const linkType = getRadioValue('linkType');
        if (linkType === 'playlist') {
            const playlistRange = getRadioValue('playlistRange');
            if (playlistRange === 'custom' && elements.playlistItems.value.trim()) {
                command.push('--playlist-items', elements.playlistItems.value.trim());
            }
        } else { // single video
             if (elements.outputFileName.value.trim()) {
                command.push('-o', `"${elements.outputFileName.value.trim()}"`);
            }
        }

        // 3. Download Type
        const downloadType = getRadioValue('downloadType');
        if (downloadType === 'video') {
            const quality = elements.videoQuality.value;
            if (quality !== 'best') {
                 command.push('-f', `"bestvideo[height<=${quality.replace('p','')}]+bestaudio[height<=${quality.replace('p','')}]/best[height<=${quality.replace('p','')}]"`); // Simplifed best video/audio under quality
            }
            const format = elements.videoFormat.value;
            if (format !== 'any') {
                command.push('--merge-output-format', format);
            }
        } else { // audio
            command.push('--extract-audio');
            command.push('--audio-format', elements.audioFormat.value);
            const quality = elements.audioQuality.value;
            if (quality !== 'best') {
                const qualityMap = { '320k': '0', '256k': '2', '128k': '5', '96k': '7' }; // yt-dlp quality scale
                command.push('--audio-quality', qualityMap[quality] || '5');
            }
        }

        // 4. Subtitles
        if (elements.enableSubtitles.checked) {
            const subType = getRadioValue('subType');
            command.push(subType === 'embed' ? '--embed-subs' : '--write-subs');
            if (elements.subtitleLang.value.trim()) {
                command.push('--sub-lang', elements.subtitleLang.value.trim());
            }
            command.push('--sub-format', elements.subtitleFormat.value);
        }

        // 5. Other Options
        if (elements.noMtime.checked) command.push('--no-mtime');
        if (elements.embedThumbnail.checked) command.push('--embed-thumbnail');
        if (elements.writeThumbnail.checked) command.push('--write-thumbnail');
        if (elements.noCacheDir.checked) command.push('--no-cache-dir');
        if (elements.rmCacheDir.checked) command.push('--rm-cache-dir');

        // 6. Download Path
        if (elements.enableDownloadPath.checked && elements.downloadPath.value.trim()) {
            command.push('-P', `"${elements.downloadPath.value.trim()}"`);
        }

        // 7. Extra Commands
        if (elements.extraCommands.value.trim()) {
            command.push(elements.extraCommands.value.trim());
        }

        // Final URL
        if (targetUrl) {
            command.push(`"${targetUrl}"`);
        }
        
        const finalCommand = command.join(' ');
        elements.commandOutput.value = finalCommand;
        autoExpandTextarea(elements.commandOutput);
    };

    // --- UI AND EVENT HANDLERS ---

    const setupEventListeners = () => {
        // Listen to all inputs for changes
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('input', () => {
                updateUiState();
                generateCommand();
                saveSettings();
            });
             el.addEventListener('change', () => { // For selects and radios
                updateUiState();
                generateCommand();
                saveSettings();
            });
        });

        elements.copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(elements.commandOutput.value).then(() => {
                elements.copyButton.textContent = 'Copied!';
                setTimeout(() => elements.copyButton.textContent = 'Copy Command', 1500);
            });
        });

        elements.resetButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all options to their defaults?')) {
                loadSettings(defaultSettings);
            }
        });
        
        elements.urlSourceRadios.forEach(radio => radio.addEventListener('change', scanUrlsIfNeeded));
        elements.scanTypeRadios.forEach(radio => radio.addEventListener('change', scanUrlsIfNeeded));
    };
    
    const updateUiState = () => {
        // URL Source toggles
        const urlSource = getRadioValue('urlSource');
        elements.scanOptions.classList.toggle('hidden', urlSource !== 'scan');
        elements.customUrlOptions.classList.toggle('hidden', urlSource !== 'custom');

        // Link Type toggles
        const linkType = getRadioValue('linkType');
        elements.singleVideoOptions.classList.toggle('hidden', linkType !== 'single');
        elements.playlistOptions.classList.toggle('hidden', linkType !== 'playlist');

        // Playlist custom range toggle
        const playlistRange = getRadioValue('playlistRange');
        elements.playlistItems.classList.toggle('hidden', playlistRange !== 'custom');
        
        // Download Type toggles
        const downloadType = getRadioValue('downloadType');
        elements.videoOptions.classList.toggle('hidden', downloadType !== 'video');
        elements.audioOptions.classList.toggle('hidden', downloadType !== 'audio');

        // Subtitle options toggle
        elements.subtitleOptions.classList.toggle('hidden', !elements.enableSubtitles.checked);

        // Download path toggle
        elements.downloadPathOptions.classList.toggle('hidden', !elements.enableDownloadPath.checked);
    };

    // --- SETTINGS PERSISTENCE ---

    const saveSettings = () => {
        const settings = {
            urlSource: getRadioValue('urlSource'),
            scanType: getRadioValue('scanType'),
            customUrl: elements.customUrl.value,
            linkType: getRadioValue('linkType'),
            outputFileName: elements.outputFileName.value,
            playlistRange: getRadioValue('playlistRange'),
            playlistItems: elements.playlistItems.value,
            downloadType: getRadioValue('downloadType'),
            videoFormat: elements.videoFormat.value,
            videoQuality: elements.videoQuality.value,
            audioFormat: elements.audioFormat.value,
            audioQuality: elements.audioQuality.value,
            enableSubtitles: elements.enableSubtitles.checked,
            subType: getRadioValue('subType'),
            subtitleLang: elements.subtitleLang.value,
            subtitleFormat: elements.subtitleFormat.value,
            noMtime: elements.noMtime.checked,
            embedThumbnail: elements.embedThumbnail.checked,
            writeThumbnail: elements.writeThumbnail.checked,
            noCacheDir: elements.noCacheDir.checked,
            rmCacheDir: elements.rmCacheDir.checked,
            enableDownloadPath: elements.enableDownloadPath.checked,
            downloadPath: elements.downloadPath.value,
            extraCommands: elements.extraCommands.value
        };
        // chrome.storage.sync.set({ ytdlpSettings: settings }); // to save your custom settings in chrome storage so they be reused
    };

    const loadSettings = (settings) => {
        setRadioValue('urlSource', settings.urlSource);
        setRadioValue('scanType', settings.scanType);
        elements.customUrl.value = settings.customUrl;
        setRadioValue('linkType', settings.linkType);
        elements.outputFileName.value = settings.outputFileName;
        setRadioValue('playlistRange', settings.playlistRange);
        elements.playlistItems.value = settings.playlistItems;
        setRadioValue('downloadType', settings.downloadType);
        elements.videoFormat.value = settings.videoFormat;
        elements.videoQuality.value = settings.videoQuality;
        elements.audioFormat.value = settings.audioFormat;
        elements.audioQuality.value = settings.audioQuality;
        elements.enableSubtitles.checked = settings.enableSubtitles;
        setRadioValue('subType', settings.subType);
        elements.subtitleLang.value = settings.subtitleLang;
        elements.subtitleFormat.value = settings.subtitleFormat;
        elements.noMtime.checked = settings.noMtime;
        elements.embedThumbnail.checked = settings.embedThumbnail;
        elements.writeThumbnail.checked = settings.writeThumbnail;
        elements.noCacheDir.checked = settings.noCacheDir;
        elements.rmCacheDir.checked = settings.rmCacheDir;
        elements.enableDownloadPath.checked = settings.enableDownloadPath;
        elements.downloadPath.value = settings.downloadPath;
        elements.extraCommands.value = settings.extraCommands;
        
        updateUiState();
        generateCommand();
    };

    // --- URL SCANNING ---
    
    function scanUrlsIfNeeded() {
        if (getRadioValue('urlSource') === 'scan') {
            scanCurrentTab();
        }
    }

    async function scanCurrentTab() {
        elements.scannedUrlsContainer.innerHTML = '<p>Scanning...</p>';
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url.startsWith('http')) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrapeLinks,
                args: [getRadioValue('scanType')]
            }, (injectionResults) => {
                if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
                     elements.scannedUrlsContainer.innerHTML = `<p>Error: Could not scan this page.</p>`;
                     return;
                }
                const urls = injectionResults[0].result;
                displayScannedUrls(urls);
                generateCommand();
            });
        } else {
            elements.scannedUrlsContainer.innerHTML = `<p>Cannot scan this page (e.g., new tab page).</p>`;
        }
    }

    function displayScannedUrls(urls) {
        elements.scannedUrlsContainer.innerHTML = '';
        if (urls.length === 0) {
            elements.scannedUrlsContainer.innerHTML = '<p>No matching URLs found.</p>';
            return;
        }
        urls.forEach((url, index) => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'scannedUrl';
            radio.value = url;
            if (index === 0) radio.checked = true;
            radio.addEventListener('change', generateCommand);

            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${url}`));
            elements.scannedUrlsContainer.appendChild(label);
        });
    }

    // This function is injected into the page
    function scrapeLinks(scanType) {
        const urls = new Set();
        const currentHostname = window.location.hostname;

        // Find standard links
        document.querySelectorAll('a[href]').forEach(a => {
            let href = a.href;
            if (!href) return;
            try {
                const url = new URL(href, document.baseURI);
                if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

                if (scanType === 'internal' && url.hostname === currentHostname) {
                    urls.add(url.href);
                } else if (scanType === 'external' && url.hostname !== currentHostname) {
                    urls.add(url.href);
                }
            } catch (e) { /* Ignore invalid URLs */ }
        });
        
        // Find embed/stream links
        if (scanType === 'embed') {
             // Look for iframes
            document.querySelectorAll('iframe[src]').forEach(iframe => urls.add(iframe.src));
            // Look for video tags with sources
            document.querySelectorAll('video > source[src]').forEach(source => urls.add(source.src));
            // Simple text search for m3u8/hls in the entire body
            const bodyText = document.body.innerText;
            const m3u8Regex = /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/gi;
            let match;
            while ((match = m3u8Regex.exec(bodyText)) !== null) {
                urls.add(match[0]);
            }
        }
        return Array.from(urls);
    }

    // --- UTILITY FUNCTIONS ---
    
    const getRadioValue = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
    const setRadioValue = (name, value) => {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) radio.checked = true;
    };
    const autoExpandTextarea = (textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    };

    // --- INITIALIZATION ---
    async function initialize() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTabUrl = (tab && tab.url.startsWith('http')) ? tab.url : '';
        
        loadSettings(defaultSettings);
        setupEventListeners();
        
    }

    initialize();
});



/* disable preference

----------- 1st change -----------

original line 239

saving enabled

        chrome.storage.sync.set({ ytdlpSettings: settings }); // to save your custom settings in chrome storage so they be reused

to diable saving change to-

currently enabled


        // chrome.storage.sync.set({ ytdlpSettings: settings }); // to save your custom settings in chrome storage so they be reused

-------------2nd change--------------


line 373 to 383

    // --- INITIALIZATION ---
    async function initialize() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTabUrl = (tab && tab.url.startsWith('http')) ? tab.url : '';
        
        chrome.storage.sync.get('ytdlpSettings', (data) => {
            const settings = data.ytdlpSettings || defaultSettings;
            loadSettings(settings);
            setupEventListeners();
        });
    }


change to- to disable

currently enabled


    // --- INITIALIZATION ---
    async function initialize() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTabUrl = (tab && tab.url.startsWith('http')) ? tab.url : '';
        
        loadSettings(defaultSettings);
        setupEventListeners();
        
    }

------------3rd change----------------

edit manifest.json

storage enabled

"permissions": [
    "activeTab",
    "scripting",
    "storage"



storage disabled

currently enabled


"permissions": [
    "activeTab",
    "scripting"

    */