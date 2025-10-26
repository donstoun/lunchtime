// js/menu.js
(function () {
   
    const BASE_API_URL = "https://68f8fef9deff18f212b85464.mockapi.io";
    const DISHES_API_URL = `${BASE_API_URL}/dishes`;
    const COMBO_DISCOUNT = 50;
    
    const orderLocalStorageKey = 'lunchtimeSelectedDishes';
    const dishesDataKey = 'lunchtimeDishesData'; // Ключ для данных блюд
    const menuDishes = {}; 
    const requiredCategories = ['soup', 'main', 'salad']; 
    const autoComboCategories = ['soup', 'main', 'salad', 'drink'];
    
    const categoryContainers = {};
    document.querySelectorAll('.dishes').forEach(div => {
        const cat = div.dataset.category;
        if (cat) categoryContainers[cat] = div;
    });

    let selectedDishes = JSON.parse(localStorage.getItem(orderLocalStorageKey)) || {
        soup: null, main: null, salad: null, drink: null, dessert: null
    };

    // --- Утилиты ---

    function showNotification(type, title, message) {
        const modal = document.getElementById('notificationModal');
        if (!modal) return console.log(`${title}: ${message}`);
        
        const iconClass = {
            success: 'fa-check-circle', warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle', info: 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        modal.className = `notification-modal visible ${type}`;
        modal.innerHTML = `
            <div class="notification-card">
                <i class="fas ${iconClass} notification-icon"></i>
                <h3>${title}</h3>
                <p>${message}</p>
                <button class="ok-btn" onclick="document.getElementById('notificationModal').classList.remove('visible')">OK</button>
            </div>
        `;
        setTimeout(() => modal.classList.remove('visible'), 5000);
    }
    
    function createDishCard(dish) {
        const card = document.createElement('div');
        card.className = 'dish-card';
        card.setAttribute('data-dish-keyword', dish.keyword);
        card.setAttribute('data-category', dish.category);
        card.setAttribute('data-kind', dish.kind);
        
        if (selectedDishes[dish.category] === dish.keyword) {
            card.classList.add('selected');
        }
        
        const imageUrl = dish.image || 'images/menu/default.jpg'; 

        card.innerHTML = `
            <img src="${imageUrl}" alt="${dish.name}">
            <div class="dish-content">
                <div class="name">${dish.name}</div> 
                <div class="count">${dish.count || '300 г'}</div> 
                <div class="price">${dish.price} ₽</div>
            </div>
        `;

        card.addEventListener('click', () => handleDishSelection(dish, card));
        return card;
    }

    function handleDishSelection(dish, cardElement) {
        const category = dish.category;
        const keyword = dish.keyword;

        if (selectedDishes[category]) {
            const prevKeyword = selectedDishes[category];
            if (prevKeyword === keyword) {
                selectedDishes[category] = null;
                cardElement.classList.remove('selected');
                updateOrderSummary();
                return;
            } else {
                const prevCard = document.querySelector(`.dish-card[data-dish-keyword="${prevKeyword}"]`);
                if (prevCard) {
                    prevCard.classList.remove('selected');
                }
            }
        }
        
        selectedDishes[category] = keyword;
        document.querySelectorAll(`.dish-card[data-category="${category}"]`).forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');
        
        validateCombo(dish, true);
        updateOrderSummary();
    }
    
    function validateCombo(dish, isSelected) {
        if (isSelected) {
            const currentSelection = { ...selectedDishes, [dish.category]: dish.keyword };
            const selectedRequiredDishes = requiredCategories
                .map(cat => currentSelection[cat])
                .filter(Boolean)
                .map(keyword => menuDishes[keyword]);

            if (selectedRequiredDishes.length >= 2) {
                const isVegetarianConflict = selectedRequiredDishes.some(d => d.kind === 'veg') && 
                                             selectedRequiredDishes.some(d => d.kind !== 'veg');
                
                if (isVegetarianConflict) {
                    showNotification('warning', 'Конфликт комбо-ланча', `Выберите блюда одного типа.`);
                }
            }
        }
        
        const isFullCombo = requiredCategories.every(cat => selectedDishes[cat]);
        if (isFullCombo && isSelected) {
             showNotification('success', 'Комбо-ланч собран!', `Вы получили скидку ${COMBO_DISCOUNT} ₽!`);
        }
    }

    function updateOrderSummary() {
        // Сохраняем в localStorage
        localStorage.setItem(orderLocalStorageKey, JSON.stringify(selectedDishes));

        const panel = document.getElementById('orderSummaryPanel');
        const itemsDiv = document.getElementById('orderSummaryItems');
        const totalEl = document.getElementById('orderTotal');
        const checkoutLink = document.getElementById('goToCheckoutLink');
        
        if (!panel || !itemsDiv || !totalEl || !checkoutLink) return;

        let total = 0;
        let selectedCount = 0;
        let html = '';

        for (const cat in selectedDishes) {
            const keyword = selectedDishes[cat];
            if (keyword && menuDishes[keyword]) {
                const dish = menuDishes[keyword];
                html += `<h3><p>${dish.name} — ${dish.price} ₽</p><h3>`;
                total += dish.price;
                selectedCount++;
            }
        }
        
        let finalTotal = total;
        let discount = 0;
        
        const isFullCombo = requiredCategories.every(cat => selectedDishes[cat]);
        
        if (isFullCombo) {
            discount = COMBO_DISCOUNT;
            finalTotal = total - discount;
            
            html += `<hr style="margin: 5px 0; border-color: #eee;">`;
            html += `<p class="discount-message" style="color: #28a745; font-weight: 600;">✅ Скидка за Комбо-ланч: -${discount} ₽</p>`;
        }

        itemsDiv.innerHTML = html || '<p class="empty-message">Пока ничего не выбрано.</p>';
        totalEl.textContent = `${finalTotal} ₽`; 

        panel.classList.toggle('hidden', selectedCount === 0);
        
        if (selectedCount > 0) {
            checkoutLink.classList.remove('disabled');
            checkoutLink.setAttribute('href', 'order.html'); 
        } else {
            checkoutLink.classList.add('disabled');
            checkoutLink.removeAttribute('href'); 
        }
        
        console.log('Заказ обновлен:', selectedDishes);
    }
    
    function resetOrder() {
        selectedDishes = {
            soup: null, main: null, salad: null, drink: null, dessert: null
        };
        localStorage.removeItem(orderLocalStorageKey);
        document.querySelectorAll('.dish-card.selected').forEach(card => card.classList.remove('selected'));
        updateOrderSummary();
        showNotification('info', 'Заказ очищен', 'Ваш текущий выбор блюд был сброшен.');
    }
    
    function getDishesByCategory() {
        return Object.values(menuDishes).reduce((acc, dish) => {
            if (!acc[dish.category]) acc[dish.category] = [];
            acc[dish.category].push(dish);
            return acc;
        }, {});
    }

    function autoSelectCombo() {
        const dishesByCategory = getDishesByCategory();
        let comboCount = 0;
        
        resetOrder(); 

        autoComboCategories.forEach(cat => {
            const availableDishes = dishesByCategory[cat];
            
            if (availableDishes && availableDishes.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableDishes.length);
                const dishToSelect = availableDishes[randomIndex]; 

                const keyword = dishToSelect.keyword;

                selectedDishes[cat] = keyword;
                const card = document.querySelector(`.dish-card[data-dish-keyword="${keyword}"]`);
                if (card) {
                    document.querySelectorAll(`.dish-card[data-category="${cat}"]`).forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    comboCount++;
                }
            }
        });
        
        if (comboCount >= requiredCategories.length) {
            updateOrderSummary();
            showNotification('success', 'Комбо-ланч собран!', `Автоматически выбран полный комбо-ланч со скидкой ${COMBO_DISCOUNT} ₽.`);
        } else if (comboCount > 0) {
            updateOrderSummary();
            showNotification('info', 'Выбор произведен', 'Автоматически выбраны доступные блюда.');
        } else {
            updateOrderSummary();
            showNotification('error', 'Ошибка комбо', 'Не удалось собрать комбо.');
        }
    }
    
    // --- API ---

    async function fetchMenu() {
        const statusEl = document.getElementById('apiStatusMessage');

        if (BASE_API_URL.includes('YOUR_MOCKAPI_BASE_URL')) {
             statusEl.textContent = 'ОШИБКА: Замените YOUR_MOCKAPI_BASE_URL!';
             statusEl.style.color = '#dc3545';
             return;
        }

        statusEl.textContent = 'Загрузка меню с API...';

        try {
            const response = await fetch(DISHES_API_URL);

            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status}`);
            }
            const data = await response.json();
            
            statusEl.textContent = 'Меню успешно загружено.';
            statusEl.style.color = '#28a745';
            statusEl.style.display = 'none';
            renderMenu(data);

        } catch (error) {
            console.error('Ошибка загрузки меню:', error);
            statusEl.textContent = `Ошибка загрузки меню: ${error.message}`;
            statusEl.style.color = '#dc3545';
        }
    }

    function renderMenu(dishes) {
        Object.values(categoryContainers).forEach(container => container.innerHTML = '');

        const groupedDishes = dishes.reduce((acc, dish) => {
            if (!dish.category || dish.price === 0) return acc; 
            
            dish.price = parseInt(dish.price) || 0; 
            menuDishes[dish.keyword] = dish; 
            
            if (!acc[dish.category]) {
                acc[dish.category] = [];
            }
            acc[dish.category].push(dish);
            return acc;
        }, {});

        for (const category in groupedDishes) {
            const container = categoryContainers[category];
            if (container) {
                groupedDishes[category]
                    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                    .forEach(dish => {
                        container.appendChild(createDishCard(dish));
                    });
            }
        }
        
        // ВАЖНО: Сохраняем данные блюд в localStorage
        localStorage.setItem(dishesDataKey, JSON.stringify(menuDishes));
        console.log('Данные блюд сохранены в localStorage:', Object.keys(menuDishes).length);
        
        updateOrderSummary();
    }
    
    // --- Инициализация ---

    document.addEventListener('DOMContentLoaded', () => {
        const resetBtn = document.getElementById('resetOrderBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetOrder);
        }
        
        const autoComboBtn = document.getElementById('autoSelectComboBtn');
        if (autoComboBtn) {
            autoComboBtn.addEventListener('click', autoSelectCombo);
        }
        
        fetchMenu();
        
        // Логика фильтров
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const kind = e.target.dataset.kind;
                const section = e.target.closest('section');
                const category = section.querySelector('.dishes').dataset.category;
                const currentKind = section.dataset.activeKind;

                if (currentKind === kind) {
                    section.dataset.activeKind = '';
                    e.target.classList.remove('active');
                    document.querySelectorAll(`.dish-card[data-category="${category}"]`).forEach(card => card.style.display = 'block');
                } else {
                    section.dataset.activeKind = kind;
                    section.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    document.querySelectorAll(`.dish-card[data-category="${category}"]`).forEach(card => {
                        card.style.display = (card.dataset.kind === kind) ? 'block' : 'none';
                    });
                }
            });
        });
    });

    // Экспорт для совместимости
    window.menuExports = {
        BASE_API_URL, 
        menuDishes,
        orderLocalStorageKey,
        selectedDishes,
        showNotification,
        updateOrderSummary,
        resetOrder,
        COMBO_DISCOUNT
    };

})();