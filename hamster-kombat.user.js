// ==UserScript==
// @name         Hamster Kombat Web
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Запуск Hamster Kombat в браузере
// @author       mudachyo
// @match        *://*.hamsterkombat.io/*
// @match        *://*.hamsterkombatgame.io/*
// @match        https://web.telegram.org/*/*
// @grant        none
// @icon         https://hamsterkombatgame.io/images/icons/hamster-coin.png
// @downloadURL  https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-kombat.user.js
// @updateURL    https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-kombat.user.js
// @homepage     https://github.com/mudachyo/Hamster-Kombat
// ==/UserScript==

(function() {
    'use strict';


    function getRandomiOSUserAgent() {
        const iOSVersions = ['14_0', '14_1', '14_2', '14_3', '14_4', '14_5', '14_6', '14_7', '14_8',
                             '15_0', '15_1', '15_2', '15_3', '15_4', '15_5', '15_6', '15_7',
                             '16_0', '16_1', '16_2', '16_3', '16_4', '16_5', '16_6', '16_7',
                             '17_0', '17_1', '17_2', '17_3', '17_4', '17_5'];
        const iPhoneModels = ['iPhone11,2', 'iPhone11,4', 'iPhone11,6', 'iPhone11,8', 'iPhone12,1',
                              'iPhone12,3', 'iPhone12,5', 'iPhone13,1', 'iPhone13,2', 'iPhone13,3',
                              'iPhone13,4', 'iPhone14,2', 'iPhone14,3', 'iPhone14,4', 'iPhone14,5'];
        const randomVersion = iOSVersions[Math.floor(Math.random() * iOSVersions.length)];
        const randomModel = iPhoneModels[Math.floor(Math.random() * iPhoneModels.length)];
        return `Mozilla/5.0 (${randomModel}; CPU iPhone OS ${randomVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1`;
    }

    const newUserAgent = getRandomiOSUserAgent();

    // Функция для замены URL скрипта
    function replaceScriptUrl() {
        // Список URL-адресов для замены
        const urlsToReplace = [
            'https://hamsterkombat.io/js/telegram-web-app.js',
            'https://app.hamsterkombat.io/js/telegram-web-app.js',
            'https://hamsterkombat.io/js/telegram-web-app.js?v=7.6',
            'https://hamsterkombatgame.io/js/telegram-web-app.js?v=7.6',
			'https://app.hamsterkombatgame.io/js/telegram-web-app.js?v=7.6'
        ];
        const newUrl = 'https://mudachyo.codes/hamsterkombat/telegram-web-app.js';

        // Получаем все теги <script> на странице
        const scripts = document.getElementsByTagName('script');
        for (let script of scripts) {
            // Проверяем, содержит ли src один из URL-адресов для замены
            if (urlsToReplace.includes(script.src)) {
                // Создаем новый тег <script> с новым URL
                const newScript = document.createElement('script');
                newScript.src = newUrl;
                newScript.type = 'text/javascript';

                // Заменяем старый тег на новый
                script.parentNode.replaceChild(newScript, script);
                console.log('Script URL replaced:', newScript.src);
            }
        }
    }

    Object.defineProperty(navigator, 'userAgent', {
        get: function() { return newUserAgent; }
    });
    Object.defineProperty(navigator, 'platform', {
        get: function() { return 'iPhone'; }
    });
    Object.defineProperty(navigator, 'vendor', {
        get: function() { return 'Apple Computer, Inc.'; }
    });
    Object.defineProperty(navigator, 'deviceMemory', {
        get: function() { return undefined; }
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
        get: function() { return 5; }
    });

    // Наблюдатель за изменениями в DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                replaceScriptUrl();
            }
        });
    });

    // Настройки наблюдателя
    const config = {
        childList: true,
        subtree: true
    };

    function createButton() {
        if (document.getElementById('iframe-open-button')) return; 

        const button = document.createElement('button');
        button.id = 'iframe-open-button';
        button.textContent = 'Open in a new tab';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.padding = '10px';
        button.style.backgroundColor = '#007bff';
        button.style.color = '#ffffff';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '9999'; 

        button.addEventListener('click', function() {
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.src) {
                window.open(iframe.src, '_blank');
            } else {
                alert('Iframe not found.');
            }
        });

        document.body.appendChild(button);
    }

    function checkForIframe() {
        const currentUrl = window.location.href;
        if (currentUrl.includes('web.telegram.org')) {
            const iframe = document.querySelector('iframe');
            if (iframe && iframe.src.includes('hamsterkombat')) {
                createButton();
            } else {
                removeButton();
            }
        } else {
            removeButton();
        }
    }

    function removeButton() {
        const button = document.getElementById('iframe-open-button');
        if (button) {
            button.remove();
        }
    }

    // Запускаем проверку каждую секунду
    setInterval(checkForIframe, 1000);

    // Обрабатываем изменения хэша в URL
    window.addEventListener('hashchange', checkForIframe);

    // Начальная проверка при загрузке скрипта
    checkForIframe();

    // Начинаем наблюдение за изменениями в DOM
    observer.observe(document.body, config);

    // Первоначальный запуск замены URL
    replaceScriptUrl();
})();