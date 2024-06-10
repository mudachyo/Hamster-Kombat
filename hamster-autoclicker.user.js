// ==UserScript==
// @name         Auto-Click hamster kombat
// @namespace    Violentmonkey Scripts
// @match        *://*.hamsterkombat.io/*
// @version      1.0
// @author       mudachyo
// @description  07.06.2024, 22:25:34
// @icon         https://cdn.bulbapp.io/frontend/images/57256c0d-2a05-4b4f-acb6-5bc8e29ce13c/1
// @grant        none
// @downloadURL  https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Hamster-Kombat
// ==/UserScript==

(function () {
    // Настройки скрипта
    const settings = {
        minEnergy: 25, // Минимальная энергия, необходимая для нажатия на монету
        minInterval: 50, // Минимальный интервал между кликами в миллисекундах
        maxInterval: 200, // Максимальный интервал между кликами в миллисекундах
        minEnergyRefillDelay: 60000, // Минимальная задержка в миллисекундах для пополнения энергии (60 секунд)
        maxEnergyRefillDelay: 180000, // Максимальная задержка в миллисекундах для пополнения энергии (180 секунд)
        maxRetries: 5 // Максимальное количество попыток перед перезагрузкой страницы
    };

    let retryCount = 0;

    // Функция для получения метоположения элемента
    function getElementPosition(element) {
      let current_element = element;
      let top = 0, left = 0;
      do {
          top += current_element.offsetTop  || 0;
          left += current_element.offsetLeft || 0;
          current_element = current_element.offsetParent;
      } while(current_element);
      return {top, left};
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
            console.log("%c[Hamster Kombat Auto-Click]", "background: #483d8b; color: #fff; padding: 5px;");
            console.log("%cElement not found, retrying...", "background: #483d8b; color: #fff; padding: 5px;");

            retryCount++;
            if (retryCount >= settings.maxRetries) {
                console.log("%cMax retries reached, reloading page...", "background: #483d8b; color: #fff; padding: 5px;");
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
            let {top, left} = getElementPosition(buttonElement);
            const randomX = Math.floor(left + Math.random() * buttonElement.offsetWidth);
            const randomY = Math.floor(top + Math.random() * buttonElement.offsetHeight);
            // Создание событий клика в указанных координатах
            const pointerDownEvent = new PointerEvent('pointerdown', { clientX: randomX, clientY: randomY });
            const pointerUpEvent = new PointerEvent('pointerup', { clientX: randomX, clientY: randomY });
            // Выполнение клика
            buttonElement.dispatchEvent(pointerDownEvent);
            buttonElement.dispatchEvent(pointerUpEvent);
        } else {
            // Вывод сообщения о недостаточном уровне энергии в консоль
            console.log("%c[Hamster Kombat Auto-Click]", "background: #483d8b; color: #fff; padding: 5px;");
            console.log("%cInsufficient energy, pausing script for energy refill.", "background: #483d8b; color: #fff; padding: 5px;");

            // Генерация случайного значения задержки для пополнения энергии
            const randomEnergyRefillDelay = getRandomNumber(settings.minEnergyRefillDelay, settings.maxEnergyRefillDelay);
            const delayInSeconds = randomEnergyRefillDelay / 1000;

            // Вывод информации о времени до следующего запуска в консоль
            console.log(`%cEnergy refill delay set to: ${delayInSeconds} seconds.`, "background: #483d8b; color: #fff; padding: 5px;");

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
            console.log("%c[Hamster Kombat Auto-Click]", "background: #483d8b; color: #fff; padding: 5px;");
            console.log("%c'Thank you' button clicked.", "background: #483d8b; color: #fff; padding: 5px;");
        }
    }

    // Запуск выполнения кликов с задержкой 5 секунд
    setTimeout(() => {
        console.log("%c[Hamster Kombat Auto-Click]", "background: #483d8b; color: #fff; padding: 5px;");
        console.log("%cScript starting after 5 seconds delay...", "background: #483d8b; color: #fff; padding: 5px;");
        clickThankYouBybitButton();
        performRandomClick();
    }, 5000); // Задержка 5 секунд
})();
