// ==UserScript==
// @name         Hamster Kombat Autoclicker
// @namespace    Violentmonkey Scripts
// @match        *://*.hamsterkombat.io/*
// @version      1.2
// @description  12.06.2024, 21:43:52
// @grant        none
// @icon         https://hamsterkombat.io/images/icons/hamster-coin.png
// @downloadURL  https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Hamster-Kombat
// ==/UserScript==

(function () {
    // Конфигурация стилей для логов
    const styles = {
        success: 'background: #28a745; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
        starting: 'background: #8640ff; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
        error: 'background: #dc3545; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
        info: 'background: #007bff; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    };
    const logPrefix = '%c[HamsterKombatBot] ';

    // Перезапись функции console.log для добавления префикса и стилей
    const originalLog = console.log;
    console.log = function () {
        if (typeof arguments[0] === 'string' && arguments[0].includes('[HamsterKombatBot]')) {
            originalLog.apply(console, arguments);
        }
    };

    // Отключение остальных методов консоли для чистоты вывода
    console.error = console.warn = console.info = console.debug = () => { };

    // Очистка консоли и стартовые сообщения
    console.clear();
    console.log(`${logPrefix}Starting`, styles.starting);
    console.log(`${logPrefix}Created by https://t.me/mudachyo`, styles.starting);
    console.log(`${logPrefix}Github https://github.com/mudachyo/Hamster-Kombat`, styles.starting);

    // Настройки скрипта
    const settings = {
        minEnergy: 25, // Минимальная энергия, необходимая для нажатия на монету
        minInterval: 30, // Минимальный интервал между кликами в миллисекундах
        maxInterval: 100, // Максимальный интервал между кликами в миллисекундах
        minEnergyRefillDelay: 60000, // Минимальная задержка в миллисекундах для пополнения энергии (60 секунд)
        maxEnergyRefillDelay: 180000, // Максимальная задержка в миллисекундах для пополнения энергии (180 секунд)
        maxRetries: 5 // Максимальное количество попыток перед перезагрузкой страницы
    };

    let retryCount = 0;

    // Функция для получения местоположения элемента
    function getElementPosition(element) {
        let current_element = element;
        let top = 0, left = 0;
        do {
            top += current_element.offsetTop || 0;
            left += current_element.offsetLeft || 0;
            current_element = current_element.offsetParent;
        } while (current_element);
        return { top, left };
    }

    // Функция для генерации случайного числа в диапазоне
    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Функция для выполнения клика с рандомными координатами
    function performRandomClick() {
        const energyElement = document.getElementsByClassName("user-tap-energy")[0];
        const buttonElement = document.getElementsByClassName('user-tap-button')[0];

        if (!energyElement || !buttonElement) {
            // Элемент не найден, попытка перезапустить скрипт
            console.log(`${logPrefix}Element not found, retrying...`, styles.error);

            retryCount++;
            if (retryCount >= settings.maxRetries) {
                console.log(`${logPrefix}Max retries reached, reloading page...`, styles.error);
                location.reload();
            } else {
                // Добавляем задержку в 2 секунды перед следующей попыткой
                setTimeout(() => {
                    setTimeout(performRandomClick, getRandomNumber(settings.minInterval, settings.maxInterval));
                }, 2000);
            }
            return;
        }

        retryCount = 0; // Сбросить счетчик попыток при успешном обнаружении элементов

        const energy = parseInt(energyElement.getElementsByTagName("p")[0].textContent.split(" / ")[0]);
        if (energy > settings.minEnergy) {
            // Генерация случайных координат, с учетом местоположения и размера кнопки
            let { top, left } = getElementPosition(buttonElement);
            const randomX = Math.floor(left + Math.random() * buttonElement.offsetWidth);
            const randomY = Math.floor(top + Math.random() * buttonElement.offsetHeight);
            // Создание событий клика в указанных координатах
            const pointerDownEvent = new PointerEvent('pointerdown', { clientX: randomX, clientY: randomY });
            const pointerUpEvent = new PointerEvent('pointerup', { clientX: randomX, clientY: randomY });
            // Выполнение клика
            buttonElement.dispatchEvent(pointerDownEvent);
            buttonElement.dispatchEvent(pointerUpEvent);

            console.log(`${logPrefix}Button clicked at (${randomX}, ${randomY})`, styles.success);
        } else {
            // Вывод сообщения о недостаточном уровне энергии в консоль
            console.log(`${logPrefix}Insufficient energy, pausing script for energy refill.`, styles.info);

            // Генерация случайного значения задержки для пополнения энергии
            const randomEnergyRefillDelay = getRandomNumber(settings.minEnergyRefillDelay, settings.maxEnergyRefillDelay);
            const delayInSeconds = randomEnergyRefillDelay / 1000;

            // Вывод информации о времени до следующего запуска в консоль
            console.log(`${logPrefix}Energy refill delay set to: ${delayInSeconds} seconds.`, styles.info);

            // Установка задержки перед следующей проверкой энергии
            setTimeout(performRandomClick, randomEnergyRefillDelay);
            return;
        }
        // Генерация следующего клика с рандомным интервалом
        const randomInterval = getRandomNumber(settings.minInterval, settings.maxInterval);
        setTimeout(performRandomClick, randomInterval);
    }

    // Функция для нажатия на кнопку "Thank you, Bybit"
    function clickThankYouBybitButton() {
        const thankYouButton = document.querySelector('.bottom-sheet-button.button.button-primary.button-large');
        if (thankYouButton) {
            thankYouButton.click();
            console.log(`${logPrefix}'Thank you' button clicked.`, styles.success);
        }
    }

    // Запуск выполнения кликов с задержкой 5 секунд
    setTimeout(() => {
        console.log(`${logPrefix}Script starting after 5 seconds delay...`, styles.starting);
        clickThankYouBybitButton();
        performRandomClick();
    }, 5000); // Задержка 5 секунд
})();
