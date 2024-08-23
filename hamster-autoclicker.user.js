// ==UserScript==
// @name         Hamster Kombat Autoclicker
// @namespace    Violentmonkey Scripts
// @match        *://*.hamsterkombat.io/*
// @match        *://*.hamsterkombatgame.io/*
// @exclude      https://hamsterkombatgame.io/games/UnblockPuzzle/*
// @version      2.2
// @description  17.08.2024
// @grant        none
// @icon         https://hamsterkombatgame.io/images/icons/hamster-coin.png
// @downloadURL  https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-autoclicker.user.js
// @updateURL    https://github.com/mudachyo/Hamster-Kombat/raw/main/hamster-autoclicker.user.js
// @homepage     https://github.com/mudachyo/Hamster-Kombat
// ==/UserScript==

(function() {
	const styles = {
		success: 'background: #28a745; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
		starting: 'background: #8640ff; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
		error: 'background: #dc3545; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
		info: 'background: #007bff; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
	};
	const logPrefix = '%c[HamsterKombatBot] ';

	const originalLog = console.log;
	console.log = function() {
		if (typeof arguments[0] === 'string' && arguments[0].includes('[HamsterKombatBot]')) {
			originalLog.apply(console, arguments);
		}
	};

	console.error = console.warn = console.info = console.debug = () => {};

	console.clear();
	console.log(`${logPrefix}Starting`, styles.starting);
	console.log(`${logPrefix}Created by https://t.me/mudachyo`, styles.starting);
	console.log(`${logPrefix}Github https://github.com/mudachyo/Hamster-Kombat`, styles.starting);

	let settings = {
		minEnergy: 25, // Минимальная энергия, необходимая для нажатия на монету
		minInterval: 30, // Минимальный интервал между кликами в миллисекундах
		maxInterval: 100, // Максимальный интервал между кликами в миллисекундах
		minEnergyRefillDelay: 60000, // Минимальная задержка в миллисекундах для пополнения энергии (60 секунд)
		maxEnergyRefillDelay: 180000, // Максимальная задержка в миллисекундах для пополнения энергии (180 секунд)
		maxRetries: 5, // Максимальное количество попыток перед перезагрузкой страницы
		autoBuyEnabled: false, // Автопокупка по умолчанию выключена
		maxPaybackHours: 672, // Максимальное время окупаемости в часах для автопокупки (4 недели)
		isPaused: false
	};
	
	const pauseDelay = 2000; 
	const dotDelay = 1;
	const dashDelay = 750;
	const multiplyTap = 16;

	let isScriptPaused = false;
	let retryCount = 0;

	function getElementPosition(element) {
		let current_element = element;
		let top = 0,
			left = 0;
		do {
			top += current_element.offsetTop || 0;
			left += current_element.offsetLeft || 0;
			current_element = current_element.offsetParent;
		} while (current_element);
		return {
			top,
			left
		};
	}

	function getRandomNumber(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	
	async function sendMorseCode(text) {
		const morseString = textToMorse(text);
		console.log('Converted Morse Code:', morseString);
		await textToTap(morseString);
	}
	
	function textToMorse(text) {
		const morseCodeMap = {
			'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
			'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
			'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
			'Y': '-.--', 'Z': '--..', ' ': ' ',
			'0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', 
			'5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
		};
	
		return text.toUpperCase().split('').map(char => {
			if (char in morseCodeMap) {
				return morseCodeMap[char];
			} else if (char === ' ') {
				return ' ';
			}
			return '';
		}).join(' ');
	}

    async function dotTap(button) {
        if (energyLevel() > 100) {
            await simulateTap(button, dotDelay);
        }
    }

	function findTapButton() {
		return document.querySelector('.user-tap-button');
	}
    async function dashTap(button) {
        if (energyLevel() > 100) {
            await simulateTap(button, dashDelay);
        }
    }

    function pauseBetweenLetters() {
        return new Promise(resolve => setTimeout(resolve, pauseDelay));
    }

	async function textToTap(morseString) {
		const button = findTapButton();
		if (!button) {
			console.log('Button not found');
			return;
		}

		let clickWord = 0;
		let clickTime = 0;

		for (const char of morseString) {
			switch (char) {
				case '.':
					await dotTap(button);
					clickWord++;
					clickTime += dotDelay;
					break;
				case '-':
					await dashTap(button);
					clickWord++;
					clickTime += dashDelay;
					break;
				case ' ':
					await pauseBetweenLetters();
					break;
			}

			const energyNow = energyLevel();
			const waitTime = actionCanProceed(energyNow, clickWord, clickTime, multiplyTap);
			if (waitTime > 0) {
				console.log(`Not enough energy, waiting for ${waitTime} seconds...`);
				await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
			}
		}

		await pauseBetweenLetters();
	}

	function checkEnergyAndClick() {
			if (!isClicking) return;

			const button = findTapButton();
			if (!button) {
				console.log('Button not found');
				return;
			}

			const energy = energyLevel();
			if (energy > 100) {
				simulateTap(button, dotDelay);
			}

			requestAnimationFrame(checkEnergyAndClick);
		}
	
	function energyLevel() {
        const energyElement = document.querySelector(".user-tap-energy p");
        if (energyElement) {
            return parseInt(energyElement.textContent.split(" / ")[0], 10);
        }
        return 0;
    }
	
	async function simulateTap(button, delay) {
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const centerY = rect.top + (rect.height / 2);

        const downEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            clientX: centerX,
            clientY: centerY
        });

        const upEvent = new PointerEvent('pointerup', {
            bubbles: true,
            clientX: centerX,
            clientY: centerY
        });

        button.dispatchEvent(downEvent);
        await new Promise(resolve => setTimeout(resolve, delay));
        button.dispatchEvent(upEvent);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

	function createResetButton() {
	  const resetButton = document.createElement('button');
	  resetButton.className = 'reset-timer-button';
	  resetButton.textContent = '⏱️';
	  resetButton.style.display = 'none';
	  resetButton.onclick = showInstructionAndResetTimer;
	  document.body.appendChild(resetButton);

	  const style = document.createElement('style');
	  style.textContent = `
		.reset-timer-button {
		  position: fixed;
		  bottom: 120px;
		  right: 20px;
		  background-color: rgba(36, 146, 255, 0.8);
		  color: #fff;
		  border: none;
		  border-radius: 50%;
		  width: 40px;
		  height: 40px;
		  font-size: 18px;
		  cursor: pointer;
		  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		  z-index: 9999;
		}
	  `;
	  document.head.appendChild(style);
	}

	function showInstructionAndResetTimer() {
	  const instruction = `
	EN: First, accept the YouTube tasks. Then click this button to reset the timer. You won't need to wait an hour for the tasks to be verified, and you can claim the reward immediately.

	RU: Сначала примите задания YouTube. Затем нажмите эту кнопку, чтобы сбросить таймер. Вам не нужно будет ждать час, пока задания проверятся, и вы сможете сразу забрать награду.
	  `;

	  alert(instruction);

	  for (let i = 0; i < localStorage.length; i++) {
		let key = localStorage.key(i);

		if (key.startsWith("hamster_youtube_")) {
		  let unixTime = parseInt(localStorage.getItem(key), 10);

		  if (!isNaN(unixTime)) {
			let newUnixTime = unixTime - 3660;

			localStorage.setItem(key, newUnixTime.toString());
		  }
		}
	  }

	  alert("EN: The YouTube quest timer has been successfully reset! If you have already accepted the quests, you can collect the reward for them.\n\nRU: Таймер YouTube-заданий успешно сброшен! Если вы уже приняли задания, вы можете забрать за них награду.");
	}

	function checkForEarnMoreCoins() {
	  const earnMoreCoinsElement = document.querySelector('div.earn-top-title[style*="opacity: 1"]');
	  const resetButton = document.querySelector('.reset-timer-button');

	  if (earnMoreCoinsElement) {
		resetButton.style.display = 'block';
	  } else {
		resetButton.style.display = 'none';
	  }
	}
	
    function actionCanProceed(energyNow, clickWord, clickTime, multiplyTap) {
        let energyCost = Math.ceil((clickWord * multiplyTap) - ((clickTime / 1000) * 3));
        let waitUntilEnergy = 0;

        if (energyCost > energyNow) {
            waitUntilEnergy = Math.ceil((energyCost - energyNow) / 3 + 3);
        }

        return waitUntilEnergy;
    }

	function performRandomClick() {
		if (settings.isPaused) {
			setTimeout(performRandomClick, 1000);
			return;
		}

		const earnMoreCoinsElement = document.querySelector('div.earn-top-title[style*="opacity: 1"]');
		if (earnMoreCoinsElement && earnMoreCoinsElement.textContent.trim() === "Earn more coins") {
			console.log(`${logPrefix}Earn more coins element found, pausing autoclicker...`, styles.info);
			setTimeout(performRandomClick, 5000);
			return;
		}

		const energyElement = document.getElementsByClassName("user-tap-energy")[0];
		const buttonElement = document.getElementsByClassName('user-tap-button')[0];

		if (!energyElement || !buttonElement) {
			console.log(`${logPrefix}Element not found, retrying...`, styles.error);

			retryCount++;
			if (retryCount >= settings.maxRetries) {
				console.log(`${logPrefix}Max retries reached, but Earn more coins element is not present. Reloading page...`, styles.error);
				location.reload();
			} else {
				setTimeout(() => {
					setTimeout(performRandomClick, getRandomNumber(settings.minInterval, settings.maxInterval));
				}, 2000);
			}
			return;
		}

		retryCount = 0;

		const energy = parseInt(energyElement.getElementsByTagName("p")[0].textContent.split(" / ")[0]);
		if (energy > settings.minEnergy) {
			let {
				top,
				left
			} = getElementPosition(buttonElement);
			const randomX = Math.floor(left + Math.random() * buttonElement.offsetWidth);
			const randomY = Math.floor(top + Math.random() * buttonElement.offsetHeight);
			const pointerDownEvent = new PointerEvent('pointerdown', {
				clientX: randomX,
				clientY: randomY
			});
			const pointerUpEvent = new PointerEvent('pointerup', {
				clientX: randomX,
				clientY: randomY
			});
			buttonElement.dispatchEvent(pointerDownEvent);
			buttonElement.dispatchEvent(pointerUpEvent);

		} else {
			console.log(`${logPrefix}Insufficient energy, pausing script for energy refill.`, styles.info);

			const randomEnergyRefillDelay = getRandomNumber(settings.minEnergyRefillDelay, settings.maxEnergyRefillDelay);
			const delayInSeconds = randomEnergyRefillDelay / 1000;

			console.log(`${logPrefix}Energy refill delay set to: ${delayInSeconds} seconds.`, styles.info);

			setTimeout(performRandomClick, randomEnergyRefillDelay);
			return;
		}
		const randomInterval = getRandomNumber(settings.minInterval, settings.maxInterval);
		setTimeout(performRandomClick, randomInterval);
	}

	function clickThankYouBybitButton() {
		const thankYouButton = document.querySelector('.bottom-sheet-button.button.button-primary.button-large');
		if (thankYouButton) {
			thankYouButton.click();
			console.log(`${logPrefix}'Thank you' button clicked.`, styles.success);
		}
	}

    function clickCloseButton() {
        const closeButton = document.querySelector('.bottom-sheet-button.button.button-primary.button-large');
        if (closeButton) {
            closeButton.click();
            console.log(`${logPrefix}'Close' button clicked.`, styles.success);
        }
    }

	// thx for *clqkx
	async function autoBuy() {
		if (!settings.autoBuyEnabled) {
			return;
		}
	
		try {
			const { balance } = await updateClickerData();
			const upgradesForBuy = window.useNuxtApp().$pinia._s.get('upgrade').upgradesForBuy;
	
			const sortedData = upgradesForBuy
				.filter(item => {
					const paybackHours = item.price / item.profitPerHourDelta;
					return item.isAvailable && !item.cooldownSeconds && !item.isExpired && paybackHours <= settings.maxPaybackHours;
				})
				.map(item => ({
					...item,
					paybackTime: item.price / item.profitPerHourDelta
				}))
				.sort((a, b) => a.paybackTime - b.paybackTime);
	
			if (sortedData.length > 0) {
				const bestCard = sortedData[0];
	
				if (balance < bestCard.price) {
					console.log(`${logPrefix}Waiting for sufficient balance to buy (${bestCard.name})`, styles.info);
					setTimeout(autoBuy, getRandomNumber(3000, 3500));
					return;
				}
	
				try {
					const delay = getRandomNumber(5000, 10000);
					console.log(`${logPrefix}Waiting for ${delay / 1000} seconds before buying (${bestCard.name})`, styles.info);
					await new Promise(resolve => setTimeout(resolve, delay));
	
					await window.useNuxtApp().$pinia._s.get('upgrade').postBuyUpgrade(bestCard.id);
					console.log(`${logPrefix}Success buy (${bestCard.name})`, styles.success);
				} catch (e) {
					console.log(`${logPrefix}Error buying upgrade: ${e.message}`, styles.error);
				}
			}
		} catch (e) {
			console.log(`${logPrefix}Error in autoBuy function: ${e.message}`, styles.error);
		}
	
		if (settings.autoBuyEnabled) {
			setTimeout(autoBuy, getRandomNumber(3000, 3500));
		}
	}

	function displayUpgradesData() {
		try {
			const upgradeStore = window.useNuxtApp().$pinia._s.get('upgrade');
			if (!upgradeStore || !upgradeStore.upgradesForBuy) {
				throw new Error('Upgrade data not available');
			}
	
			let upgradesForBuy = upgradeStore.upgradesForBuy;
			
			upgradesForBuy.sort((a, b) => {
				const paybackTimeA = a.profitPerHourDelta ? (a.price / a.profitPerHourDelta) : Infinity;
				const paybackTimeB = b.profitPerHourDelta ? (b.price / b.profitPerHourDelta) : Infinity;
				return paybackTimeA - paybackTimeB;
			});
	
			let tableContent = `
			<style>
				body { 
					font-family: Arial, sans-serif; 
					background-color: #1e1e1e; 
					color: #e0e0e0;
					margin: 0;
					padding: 20px;
				}
				.header-container {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 20px;
					flex-wrap: wrap;
				}
				h1 { 
					color: #61afef; 
					margin: 0;
					margin-right: 20px;
				}
				.button-container {
					display: flex;
					gap: 10px;
					flex-wrap: wrap;
				}
				.button {
					padding: 10px;
					background-color: #61afef;
					color: #282c34;
					border: none;
					cursor: pointer;
					font-weight: bold;
					text-decoration: none;
					display: inline-block;
				}
				.button:hover {
					background-color: #528bbd;
				}
				#toggleButton {
					background-color: #98c379;
				}
				#donateButton {
					background-color: #e5c07b;
				}
				table { 
					border-collapse: collapse; 
					width: 100%; 
					background-color: #2d2d2d; 
					margin-top: 20px;
				}
				th, td { 
					border: 1px solid #4a4a4a; 
					padding: 12px; 
					text-align: left; 
				}
				th { 
					background-color: #383838; 
					color: #61afef; 
				}
				tr:nth-child(even) { background-color: #333333; }
				tr:hover { background-color: #3a3a3a; }
				.payback-good { color: #98c379; }
				.payback-bad { color: #e06c75; }
				.availability-icon {
					font-size: 18px;
					width: 24px;
					text-align: center;
				}
				.hidden {
					display: none;
				}
			</style>
			<table id="upgradesTable">
				<tr>
					<th>Available</th>
					<th>Name</th>
					<th>Category</th>
					<th>Level</th>
					<th>Price</th>
					<th>Profit per Hour</th>
					<th>Payback Time (hours)</th>
				</tr>`;
	
			upgradesForBuy.forEach(item => {
				const paybackTime = item.profitPerHourDelta ? (item.price / item.profitPerHourDelta) : Infinity;
				const paybackClass = paybackTime <= 672 ? 'payback-good' : 'payback-bad';
				const isAvailable = item.isAvailable && !item.isExpired;
				const availabilityIcon = isAvailable ? '✅' : '❌';
				tableContent += `
				<tr class="${isAvailable ? 'available' : 'unavailable'}">
					<td class="availability-icon">${availabilityIcon}</td>
					<td>${item.name}</td>
					<td>${item.section || 'N/A'}</td>
					<td>${item.level || 'N/A'}</td>
					<td>${item.price.toLocaleString()}</td>
					<td>${item.profitPerHourDelta.toLocaleString()}</td>
					<td class="${paybackClass}">${paybackTime !== Infinity ? paybackTime.toFixed(2) : 'N/A'}</td>
				</tr>`;
			});
	
			tableContent += '</table>';
	
			const newWindow = window.open('', '_blank');
			newWindow.document.write(`
			<html>
				<head>
					<title>Hamster Kombat Upgrades</title>
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
				</head>
				<body>
					<div class="header-container">
						<h1>Hamster Kombat Upgrades</h1>
						<div class="button-container">
							<button id="toggleButton" class="button">Hide Unavailable</button>
							<a href="https://github.com/mudachyo/Hamster-Kombat" target="_blank" class="button">Github</a>
							<a href="https://t.me/shopalenka" target="_blank" class="button">Telegram Channel</a>
							<a href="https://t.me/tribute/app?startapp=d55x" target="_blank" id="donateButton" class="button">Donate</a>
						</div>
					</div>
					${tableContent}
					<script>
						let showUnavailable = true;
						const toggleButton = document.getElementById('toggleButton');
						const table = document.getElementById('upgradesTable');
						toggleButton.addEventListener('click', () => {
							showUnavailable = !showUnavailable;
							toggleButton.textContent = showUnavailable ? 'Hide Unavailable' : 'Show All';
							const rows = table.getElementsByTagName('tr');
							for (let i = 1; i < rows.length; i++) {
								if (rows[i].classList.contains('unavailable')) {
									rows[i].classList.toggle('hidden', !showUnavailable);
								}
							}
						});
					</script>
				</body>
			</html>`);
			newWindow.document.close();
	
			console.log(`${logPrefix}Upgrades data displayed in new window`, styles.success);
		} catch (error) {
			console.log(`${logPrefix}Error displaying upgrades: ${error.message}`, styles.error);
			alert(`Error displaying upgrades: ${error.message}. Please check the console for more details.`);
		}
	}

	async function updateClickerData() {
		const clickerStore = window.useNuxtApp().$pinia._s.get('clicker');
		const boostStore = window.useNuxtApp().$pinia._s.get('boost');
		const balance = clickerStore.balanceCoins;
		const availableTaps = clickerStore.availableTaps;
		const fullEnergySecondsCountdown = boostStore.fullEnergySecondsCountdown;
		return {
			balance,
			availableTaps,
			fullEnergySecondsCountdown
		};
	}

	function createPromoCodeButton() {
	  const promoCodeButton = document.createElement('button');
	  promoCodeButton.className = 'promo-code-button';
	  promoCodeButton.textContent = '🔑';
	  promoCodeButton.style.display = 'none';
	  promoCodeButton.onclick = openPromoCodeWindow;
	  document.body.appendChild(promoCodeButton);
	}
	
	function checkPromoCodeInput() {
	  const promoCodeInput = document.querySelector('.promocode-input-container');
	  const promoCodeButton = document.querySelector('.promo-code-button');
	  const morseButton = document.querySelector('.morse-button');
	  
	  if (promoCodeInput && promoCodeButton) {
		promoCodeButton.style.display = 'block';
		if (morseButton && morseButton.style.display !== 'none') {
		  promoCodeButton.style.bottom = '120px';
		} else {
		  promoCodeButton.style.bottom = '70px';
		}
	  } else if (promoCodeButton) {
		promoCodeButton.style.display = 'none';
	  }
	}
	
	let promoCodeWindow = null;

	function openPromoCodeWindow() {
	  if (promoCodeWindow) {
		document.body.removeChild(promoCodeWindow);
		promoCodeWindow = null;
		return;
	  }

	  promoCodeWindow = document.createElement('div');
	  promoCodeWindow.className = 'promo-code-window';
	  promoCodeWindow.innerHTML = `
		<div class="promo-code-header">
		  <h3>Enter Promo Codes</h3>
		  <button class="close-button">×</button>
		</div>
		<textarea id="promoCodeInput" rows="10" cols="30" placeholder="Enter one promo code per line"></textarea>
		<button id="startPromoCodeButton">Start</button>
		<div id="promoCodeStats"></div>
	  `;
	  document.body.appendChild(promoCodeWindow);
	  
	  document.getElementById('startPromoCodeButton').onclick = startPromoCodeEntry;
	  document.querySelector('.promo-code-window .close-button').onclick = () => {
		document.body.removeChild(promoCodeWindow);
		promoCodeWindow = null;
	  };
	}
	
	async function startPromoCodeEntry() {
	  const promoCodes = document.getElementById('promoCodeInput').value.split('\n');
	  const inputField = document.querySelector('.promocode-input-container input');
	  const redeemButton = document.querySelector('.promocode-input-container button');
	  let successCount = 0;
	  let errorCount = 0;
	  let remainingCount = promoCodes.length;

	  for (const code of promoCodes) {
		if (code.trim() === '') {
		  remainingCount--;
		  continue;
		}

		const cleanCode = code.trim().replace(/\s/g, '');
		inputField.value = cleanCode;
		inputField.dispatchEvent(new Event('input', { bubbles: true }));
		
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		redeemButton.click();
		
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		const result = await waitForPromoCodeResult();
		if (result === 'success') {
		  successCount++;
		} else if (result === 'error') {
		  errorCount++;
		}
		remainingCount--;

		updatePromoCodeStats(successCount, errorCount, remainingCount);
		
		await new Promise(resolve => setTimeout(resolve, Math.random() * 8000 + 7000));
	  }
	}

	async function waitForPromoCodeResult() {
	  return new Promise(resolve => {
		const checkResult = () => {
		  const successElement = document.querySelector('.promocode-text-success');
		  const errorElement = document.querySelector('.promocode-text-error');
		  
		  if (successElement && successElement.style.display !== 'none') {
			resolve('success');
		  } else if (errorElement && errorElement.style.display !== 'none') {
			resolve('error');
		  } else {
			setTimeout(checkResult, 100);
		  }
		};
		checkResult();
	  });
	}

	function updatePromoCodeStats(success, error, remaining) {
	  const statsElement = document.getElementById('promoCodeStats');
	  statsElement.innerHTML = `
		Success: <span class="success-count">${success}</span> | 
		Error: <span class="error-count">${error}</span> | 
		Remaining: <span class="remaining-count">${remaining}</span>
	  `;
	}
	
	const promoCodeStyles = `
	  .promo-code-button {
		position: fixed;
		right: 20px;
		background-color: rgba(36, 146, 255, 0.8);
		color: #fff;
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		font-size: 18px;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		z-index: 9999;
	  }
	  .promo-code-window {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: rgba(40, 44, 52, 0.95);
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
		color: #abb2bf;
		font-family: 'Arial', sans-serif;
		z-index: 10001;
		padding: 20px;
		width: 300px;
	  }
	  .promo-code-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
	  }
	  .promo-code-header h3 {
		margin: 0;
		color: #61afef;
		white-space: nowrap;
	  }
	  .close-button {
		background: none;
		border: none;
		color: #e06c75;
		font-size: 20px;
		cursor: pointer;
		padding: 0;
	  }
	  #promoCodeInput {
		width: 100%;
		margin-bottom: 15px;
		background-color: #282c34;
		color: #abb2bf;
		border: 1px solid #4b5263;
		border-radius: 4px;
		padding: 8px;
	  }
	  #startPromoCodeButton {
		width: 100%;
		padding: 8px;
		background-color: #98c379;
		color: #282c34;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		margin-bottom: 10px;
	  }
	  #promoCodeStats {
		text-align: center;
		font-size: 14px;
		color: #abb2bf;
	  }
	  #promoCodeStats .success-count {
		color: #98c379;
		font-weight: bold;
	  }
	  #promoCodeStats .error-count {
		color: #e06c75;
		font-weight: bold;
	  }
	  #promoCodeStats .remaining-count {
		color: #61afef;
		font-weight: bold;
	  }
	`;
	document.head.appendChild(document.createElement('style')).textContent += promoCodeStyles;

	const morseButton = document.createElement('button');
	morseButton.className = 'morse-button';
	morseButton.textContent = '🅰';
	morseButton.style.display = 'none';
	morseButton.onclick = () => {
		const text = prompt("Enter text for Morse code:");
		if (text) {
			sendMorseCode(text);
		}
	};
	document.body.appendChild(morseButton);

	function checkMorseMode() {
		const morseModeButton = document.querySelector('.user-tap-button.is-morse-mode');
		morseButton.style.display = morseModeButton ? 'block' : 'none';
	}

	setInterval(checkMorseMode, 1000);

	createSettingsMenu();

	function createSettingsMenu() {
		const settingsMenu = document.createElement('div');
		settingsMenu.className = 'settings-menu';
		settingsMenu.style.display = 'none';

		const menuTitle = document.createElement('h3');
		menuTitle.className = 'settings-title';
		menuTitle.textContent = 'HK Autoclicker';

		const closeButton = document.createElement('button');
		closeButton.className = 'settings-close-button';
		closeButton.textContent = '×';
		closeButton.onclick = () => {
			settingsMenu.style.display = 'none';
		};

		menuTitle.appendChild(closeButton);
		settingsMenu.appendChild(menuTitle);

		settingsMenu.appendChild(createSettingElement('Min Energy', 'minEnergy', 'range', 5, 6000, 5,
			'EN: Minimum energy required to click.<br>' +
			'RU: Минимальная энергия, необходимая для клика.'));
		settingsMenu.appendChild(createSettingElement('Min Interval (ms)', 'minInterval', 'range', 10, 1000, 10,
			'EN: Minimum interval between clicks.<br>' +
			'RU: Минимальный интервал между кликами.'));
		settingsMenu.appendChild(createSettingElement('Max Interval (ms)', 'maxInterval', 'range', 10, 10000, 10,
			'EN: Maximum interval between clicks.<br>' +
			'RU: Максимальный интервал между кликами.'));
		settingsMenu.appendChild(createSettingElement('Min Refill Delay (ms)', 'minEnergyRefillDelay', 'range', 10, 1200000, 10,
			'EN: Minimum energy refill delay in seconds.<br>' +
			'RU: Минимальная задержка пополнения энергии.'));
		settingsMenu.appendChild(createSettingElement('Max Refill Delay (ms)', 'maxEnergyRefillDelay', 'range', 10, 1200000, 10,
			'EN: Maximum energy refill delay in seconds.<br>' +
			'RU: Максимальная задержка пополнения энергии.'));

		const autoBuyContainer = document.createElement('div');
		autoBuyContainer.className = 'setting-item auto-buy-container';
	
		const autoBuyCheckbox = createSettingElement('Auto Buy', 'autoBuyEnabled', 'checkbox', null, null, null,
			'EN: Automatically buy the most profitable upgrade.<br>' +
			'RU: Автоматически покупать самое выгодное улучшение.');
	
		const maxPaybackHoursInput = createSettingElement('Max Payback Hours', 'maxPaybackHours', 'number', 1, 1000, 1,
			'EN: Maximum payback time in hours for auto-buy.<br>' +
			'RU: Максимальное время окупаемости в часах для автопокупки.');
	
		autoBuyContainer.appendChild(autoBuyCheckbox);
		autoBuyContainer.appendChild(maxPaybackHoursInput);
	
		settingsMenu.appendChild(autoBuyContainer);

		const pauseResumeButton = document.createElement('button');
		pauseResumeButton.textContent = 'Pause';
		pauseResumeButton.className = 'pause-resume-btn';
		pauseResumeButton.onclick = toggleScriptPause;
		settingsMenu.appendChild(pauseResumeButton);

		const displayButton = document.createElement('button');
		displayButton.textContent = 'View Upgrades Table';
		displayButton.className = 'display-data-btn';
		displayButton.onclick = () => {
			console.log(`${logPrefix}Display button clicked`, styles.info);
			displayUpgradesData();
		};
		settingsMenu.appendChild(displayButton);

		const socialButtons = document.createElement('div');
		socialButtons.className = 'social-buttons';

		const githubButton = document.createElement('a');
		githubButton.href = 'https://github.com/mudachyo/Hamster-Kombat';
		githubButton.target = '_blank';
		githubButton.className = 'social-button';
		githubButton.innerHTML = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADtklEQVR4nO2ZSWgVQRCGP2OCS3CJYoy7uCtiDi6o8aAIikvQi4oGvCiiRo2E6FXJQdxQg4LgUTx4cyPuHhVRD0bcsyDu4IJrTNTnSEMNPOfNm1czb2YSJD8UDNNT1fV3V1dX90AH/l8UAEuBfUAt8Bj4CLSKmOdH0ma+WQL0pp2gC1AGXAJ+A5ZPMToXgFViK3Z0AyqBVwGcTycvga1A17hILAAaQiTglHpgfpQEzNTXREjAKcdl5kNFf+BOjCQskVtAYVgkhst0W20kT8WHrNBP0qjVxtIAFAUl0bWNwsnyCLNAKfpoO3DecsjhICnWy+B2CbspwA7gWRbOmd1+G1As1cGBDN/P05LoptgnBruEoSH0A7gKVACzgNFAvsgYebcROAN8BTYDnR22ihWLXxVilYpRTLf75mlHy+PbAYr+zUB5oouy7Ah9o0pCkaL/F5lmpUwZ1+MiJFKi9GGll5FLSiPLIyRSrvThfDoDBT5K8eoIiRxT+vAL6OlmYKnSwGdZkFFhPPBT6Uupm4H9SmWT56PGSaUve92Ua5XK02Igskzpy1k35afKuMyNgchYJRFT0KbgvULRfBMHhiiJvHNTblUomm86xUBkoiMKPor8cfjT4qZsZ4rZUu+MAPoAA+XZljiIJCNXtoYC6dtUFYOSBjYFn6TxJnAXaJRQeiPPtqwgehz2iIrvScvAzFIKnkjjNUmxWyRPm4p1khw37VGJGjnS11BggmTKRVI575a7MPsIkIKL0rhLqsuDwCngOlAns/FBpnN1xLPRIqPdBDwAbgPngCNyFtrvVaZUKzOFkW8yU2FjncuC9pKdbkbm+jBgpBlYE1KomZJ8j08SRua4GeuuTMFOuSFryXnS0yBfBqMxQL8tXucie504xZxT1soGlM7wW+AEsEFGaiTQK8l2XznHmOvQKikvvgYgYImYkiotSj1SXomcwd8qw65KbihtFMq75iyct5JkYaa015RGsU7apwJfMpAwpNOhJAQy9eKLJyo8DJhcbpcQFyU07J84z4ErwOJMHQDrsyRSrr3duBckLn0gx6MPK4Pc9VOBzwQSLkYSIe4fGwKQSADT/XZ0JI2xT3KxNlgTpx4YFYBITZCO8qTu8tNRZ5/2/di+7PMC8B/09BnLfqG1+yCMP8DDgIdtSOS+nBhDQQ+pNOMmciWKf/F5UmInYiCSAA5FfdExWc4HURGpA2YQE3IlBTc4fvj7xeskfWNrU0zXTSnIkbLldFL54gelorswyz2pAx0gIvwFLXDNiM6zHVAAAAAASUVORK5CYII=">GitHub';
		socialButtons.appendChild(githubButton);

		const telegramButton = document.createElement('a');
		telegramButton.href = 'https://t.me/shopalenka';
		telegramButton.target = '_blank';
		telegramButton.className = 'social-button';
		telegramButton.innerHTML = '<img src="data:image/png;base64,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">Telegram Channel';
		socialButtons.appendChild(telegramButton);

		settingsMenu.appendChild(socialButtons);

		document.body.appendChild(settingsMenu);

		function updateSettingsMenu() {
			document.getElementById('minEnergy').value = settings.minEnergy;
			document.getElementById('minEnergyDisplay').textContent = settings.minEnergy;
			document.getElementById('minInterval').value = settings.minInterval;
			document.getElementById('minIntervalDisplay').textContent = settings.minInterval;
			document.getElementById('maxInterval').value = settings.maxInterval;
			document.getElementById('maxIntervalDisplay').textContent = settings.maxInterval;
			document.getElementById('minEnergyRefillDelay').value = settings.minEnergyRefillDelay;
			document.getElementById('minEnergyRefillDelayDisplay').textContent = settings.minEnergyRefillDelay;
			document.getElementById('maxEnergyRefillDelay').value = settings.maxEnergyRefillDelay;
			document.getElementById('maxEnergyRefillDelayDisplay').textContent = settings.maxEnergyRefillDelay;
			document.getElementById('autoBuyEnabled').checked = settings.autoBuyEnabled;
    		document.getElementById('maxPaybackHours').value = settings.maxPaybackHours
			document.getElementById('maxPaybackHoursDisplay').textContent = settings.maxPaybackHours;
			updatePauseButtonState();
		}

		const settingsButton = document.createElement('button');
		settingsButton.className = 'settings-button';
		settingsButton.textContent = '⚙️';
		settingsButton.onclick = () => {
			settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
		};
		document.body.appendChild(settingsButton);

		const style = document.createElement('style');
		style.textContent = `
		.settings-menu {
		  position: fixed;
		  top: 50%;
		  left: 50%;
		  transform: translate(-50%, -50%);
		  background-color: rgba(40, 44, 52, 0.95);
		  border-radius: 8px;
		  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
		  color: #abb2bf;
		  font-family: 'Arial', sans-serif;
		  z-index: 10000;
		  padding: 20px;
		  width: 300px;
		}
		.settings-title {
		  color: #61afef;
		  font-size: 18px;
		  font-weight: bold;
		  margin-bottom: 15px;
		  display: flex;
		  align-items: center;
		  justify-content: space-between;
		  white-space: nowrap; /* Добавьте эту строку */
		  width: 100%; /* Добавьте эту строку */
		}
		.settings-close-button {
		  background: none;
		  border: none;
		  color: #e06c75;
		  font-size: 20px;
		  cursor: pointer;
		  padding: 0;
		}
        .setting-item {
          margin-bottom: 12px;
        }
        .setting-label {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        .setting-label-text {
          color: #e5c07b;
          margin-right: 5px;
        }
        .help-icon {
          cursor: help;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: #61afef;
          color: #282c34;
          font-size: 10px;
          font-weight: bold;
        }
        .setting-input {
          display: flex;
          align-items: center;
        }
        .setting-slider {
          flex-grow: 1;
          margin-right: 8px;
        }
        .setting-value {
          min-width: 30px;
          text-align: right;
          font-size: 11px;
        }
        .tooltip {
          position: relative;
        }
		.tooltip .tooltiptext {
		  visibility: hidden;
		  width: 200px;
		  background-color: #4b5263;
		  color: #fff;
		  text-align: center;
		  border-radius: 6px;
		  padding: 5px;
		  position: absolute;
		  z-index: 1;
		  bottom: 125%;
		  left: 50%;
		  margin-left: -100px;
		  opacity: 0;
		  transition: opacity 0.3s;
		  font-size: 11px;
		  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
		}
        .tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }
        .pause-resume-btn {
          display: block;
          width: calc(100% - 10px);
          padding: 8px;
          margin: 15px 5px;
          background-color: #98c379;
          color: #282c34;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          font-size: 14px;
          transition: background-color 0.3s;
        }
        .pause-resume-btn:hover {
          background-color: #7cb668;
        }
        .settings-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: rgba(36, 146, 255, 0.8);
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 18px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 9999;
        }
        .social-buttons {
		  margin-top: 15px;
		  display: flex;
		  justify-content: space-around;
		  white-space: nowrap;
		}
		.social-button {
		  display: inline-flex;
		  align-items: center;
		  padding: 5px 8px;
		  border-radius: 4px;
		  background-color: #282c34;
		  color: #abb2bf;
		  text-decoration: none;
		  font-size: 12px;
		  transition: background-color 0.3s;
		}
		.social-button:hover {
		  background-color: #4b5263;
		}
		.social-button img {
		  width: 16px;
		  height: 16px;
		  margin-right: 5px;
		}
		.display-data-btn {
			display: block;
			width: calc(100% - 10px);
			padding: 8px;
			margin: 10px 5px;
			background-color: #61afef;
			color: #282c34;
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-weight: bold;
			font-size: 14px;
			transition: background-color 0.3s;
		}
		  .display-data-btn:hover {
			background-color: #4d8dcb;
		}
		  .auto-buy-container {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
		.auto-buy-container .setting-item {
			margin-bottom: 0;
			margin-right: 10px;
		}
		#morseInputField {
		width: 100%;
		padding: 5px;
		margin-bottom: 10px;
		}
		button {
		width: 100%;
		padding: 8px;
		margin-bottom: 10px;
		background-color: #61afef;
		color: #282c34;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: bold;
		}
		.morse-button {
		position: fixed;
		bottom: 70px;
		right: 20px;
		background-color: rgba(36, 146, 255, 0.8);
		color: #fff;
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		font-size: 18px;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		z-index: 9999;
		}
      `;
		document.head.appendChild(style);

		function createSettingElement(label, id, type, min, max, step, tooltipText) {
			const container = document.createElement('div');
			container.className = 'setting-item';

			const labelContainer = document.createElement('div');
			labelContainer.className = 'setting-label';

			const labelElement = document.createElement('span');
			labelElement.className = 'setting-label-text';
			labelElement.textContent = label;

			const helpIcon = document.createElement('span');
			helpIcon.textContent = '?';
			helpIcon.className = 'help-icon tooltip';

			const tooltipSpan = document.createElement('span');
			tooltipSpan.className = 'tooltiptext';
			tooltipSpan.innerHTML = tooltipText;
			helpIcon.appendChild(tooltipSpan);

			labelContainer.appendChild(labelElement);
			labelContainer.appendChild(helpIcon);

			const inputContainer = document.createElement('div');
			inputContainer.className = 'setting-input';

			let input;
			if (type === 'checkbox') {
				input = document.createElement('input');
				input.type = 'checkbox';
				input.id = id;
				input.checked = settings[id];
				input.addEventListener('change', (e) => {
					settings[id] = e.target.checked;
					saveSettings();
					if (settings.autoBuyEnabled) {
						autoBuy();
					}
				});
				inputContainer.appendChild(input);
			} else {
				input = document.createElement('input');
				input.type = type;
				input.id = id;
				input.min = min;
				input.max = max;
				input.step = step;
				input.value = settings[id];
				input.className = 'setting-slider';

				const valueDisplay = document.createElement('span');
				valueDisplay.id = `${id}Display`;
				valueDisplay.textContent = settings[id];
				valueDisplay.className = 'setting-value';

				input.addEventListener('input', (e) => {
					settings[id] = parseFloat(e.target.value);
					valueDisplay.textContent = e.target.value;
					saveSettings();
				});

				inputContainer.appendChild(input);
				inputContainer.appendChild(valueDisplay);
			}

			container.appendChild(labelContainer);
			container.appendChild(inputContainer);
			return container;
		}
		
		function updatePauseButtonState() {
		  const pauseResumeButton = document.querySelector('.pause-resume-btn');
		  if (pauseResumeButton) {
			pauseResumeButton.textContent = settings.isPaused ? 'Resume' : 'Pause';
			pauseResumeButton.style.backgroundColor = settings.isPaused ? '#e5c07b' : '#98c379';
		  }
		}

		function saveSettings() {
			localStorage.setItem('HamsterKombatAutoclickerSettings', JSON.stringify(settings));
		}

		function loadSettings() {
			const savedSettings = localStorage.getItem('HamsterKombatAutoclickerSettings');
			if (savedSettings) {
				const parsedSettings = JSON.parse(savedSettings);
				settings = {
				...settings,
				...parsedSettings
				};
				isScriptPaused = settings.isPaused;
				updatePauseButtonState();
			}
			}

		loadSettings();
		updateSettingsMenu();
		createPromoCodeButton();
		setInterval(checkPromoCodeInput, 1000);
		createResetButton();
		setInterval(checkForEarnMoreCoins, 1000);

		function toggleScriptPause() {
		  settings.isPaused = !settings.isPaused;
		  isScriptPaused = settings.isPaused;
		  pauseResumeButton.textContent = settings.isPaused ? 'Resume' : 'Pause';
		  pauseResumeButton.style.backgroundColor = settings.isPaused ? '#e5c07b' : '#98c379';
		  saveSettings();
		}
	}

	setTimeout(() => {
		console.log(`${logPrefix}Script starting after 5 seconds delay...`, styles.starting);
		clickThankYouBybitButton();
		performRandomClick();
		autoBuy();
	}, 5000);
})();