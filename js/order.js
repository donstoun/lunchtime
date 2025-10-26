// js/order.js
(function () {
    const BASE_API_URL = "https://68f8fef9deff18f212b85464.mockapi.io";
    const DISHES_API_URL = `${BASE_API_URL}/dishes`;
    const ORDERS_API_URL = `${BASE_API_URL}/orders`;
    const COMBO_DISCOUNT = 50;
    
    const orderLocalStorageKey = 'lunchtimeSelectedDishes';
    const dishesDataKey = 'lunchtimeDishesData'; // Новый ключ для хранения данных блюд
    
    let selectedDishes = {};
    let dishesData = {};
    
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;
    
    const orderItemsList = document.getElementById('orderItemsList');
    const orderTotalEl = document.getElementById('orderTotal');
    const submitOrderBtn = document.getElementById('submitOrderBtn');
    const specificTimeGroup = document.getElementById('specificTimeGroup');
    const emptyMessage = document.querySelector('.empty-order-message');

    // --- Функция уведомлений ---
    function showNotification(type, title, message) {
        const modal = document.getElementById('notificationModal');
        if (!modal) {
            alert(`${title}: ${message}`);
            return;
        }
        
        const iconClass = {
            success: 'fa-check-circle', 
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle', 
            info: 'fa-info-circle'
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

    // --- Загрузка данных ---
    function loadOrderData() {
        // Загружаем выбранные блюда
        const savedOrder = localStorage.getItem(orderLocalStorageKey);
        if (savedOrder) {
            selectedDishes = JSON.parse(savedOrder);
            console.log('Загружены выбранные блюда:', selectedDishes);
        }
        
        // Загружаем данные о блюдах
        const savedDishes = localStorage.getItem(dishesDataKey);
        if (savedDishes) {
            dishesData = JSON.parse(savedDishes);
            console.log('Загружены данные блюд:', dishesData);
        } else {
            // Если данных нет, загружаем с API
            loadDishesFromAPI();
        }
    }

    // --- Загрузка блюд с API ---
    async function loadDishesFromAPI() {
        try {
            const response = await fetch(DISHES_API_URL);
            if (!response.ok) throw new Error('Ошибка загрузки данных');
            
            const dishes = await response.json();
            dishes.forEach(dish => {
                if (dish.keyword) {
                    dish.price = parseInt(dish.price) || 0;
                    dishesData[dish.keyword] = dish;
                }
            });
            
            localStorage.setItem(dishesDataKey, JSON.stringify(dishesData));
            console.log('Блюда загружены с API:', dishesData);
            
        } catch (error) {
            console.error('Ошибка загрузки блюд:', error);
            showNotification('error', 'Ошибка', 'Не удалось загрузить данные блюд');
        }
    }

    // --- Получение названия категории ---
    function getCategoryName(cat) {
        const names = {
            'soup': 'Суп',
            'main': 'Главное блюдо',
            'salad': 'Салат',
            'drink': 'Напиток',
            'dessert': 'Десерт'
        };
        return names[cat] || cat;
    }

    // --- Рендеринг заказа ---
    function renderOrderItems() {
        let total = 0;
        let html = '';
        let hasItems = false;
        const requiredCategories = ['soup', 'main', 'salad'];
        
        console.log('Рендеринг заказа...');
        console.log('Выбранные блюда:', selectedDishes);
        console.log('Данные блюд:', dishesData);
        
        for (const cat in selectedDishes) {
            const keyword = selectedDishes[cat];
            if (keyword && dishesData[keyword]) {
                const dish = dishesData[keyword];
                hasItems = true;
                total += dish.price;
                
                html += `
                    <div class="order-item-card">
                        <img src="${dish.image || 'images/menu/default.jpg'}" alt="${dish.name}">
                        <div class="item-info">
                            <div class="item-name">${dish.name}</div>
                            <div class="item-category">Категория: ${getCategoryName(cat)}</div>
                        </div>
                        <div class="item-price">${dish.price} ₽</div>
                        <button type="button" class="delete-btn" data-keyword="${keyword}" data-category="${cat}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
            }
        }

        // Применяем скидку за комбо
        let finalTotal = total;
        const isFullCombo = requiredCategories.every(cat => selectedDishes[cat]);
        
        if (isFullCombo && hasItems) {
            finalTotal = total - COMBO_DISCOUNT;
            html += `<div class="discount-info">✅ Скидка за Комбо-ланч: -${COMBO_DISCOUNT} ₽</div>`;
        }

        if (hasItems) {
            orderItemsList.innerHTML = html;
            orderTotalEl.textContent = `${finalTotal} ₽`;
            
            if (emptyMessage) emptyMessage.classList.add('hidden');
            if (submitOrderBtn) submitOrderBtn.disabled = false;
            
            // Добавляем обработчики удаления
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    removeDish(this.dataset.category);
                });
            });
        } else {
            orderItemsList.innerHTML = '<p style="text-align: center; padding: 30px; color: #6b7280;">Список пуст</p>';
            orderTotalEl.textContent = '0 ₽';
            
            if (emptyMessage) emptyMessage.classList.remove('hidden');
            if (submitOrderBtn) submitOrderBtn.disabled = true;
        }
    }

    // --- Удаление блюда ---
    function removeDish(category) {
        selectedDishes[category] = null;
        localStorage.setItem(orderLocalStorageKey, JSON.stringify(selectedDishes));
        renderOrderItems();
        showNotification('info', 'Блюдо удалено', 'Блюдо удалено из заказа');
    }

    // --- Отправка заказа ---
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const requiredCategories = ['soup', 'main', 'salad'];
        const isMinComboPresent = requiredCategories.every(cat => selectedDishes[cat]);

        
        
        submitOrderBtn.disabled = true;
        submitOrderBtn.textContent = 'Отправка...';

        const formData = new FormData(this);
        let total = 0;
        
        // Считаем сумму
        Object.keys(selectedDishes).forEach(cat => {
            const keyword = selectedDishes[cat];
            if (keyword && dishesData[keyword]) {
                total += dishesData[keyword].price;
            }
        });
        
        // Применяем скидку
        const isFullCombo = requiredCategories.every(cat => selectedDishes[cat]);
        if (isFullCombo) {
            total -= COMBO_DISCOUNT;
        }
        
        // Формируем время доставки
        let deliveryTime;
        if (formData.get('delivery_type') === 'asap') {
            deliveryTime = 'Как можно скорее (с 7:00 до 23:00)';
        } else {
            deliveryTime = `К ${formData.get('delivery_time')}`;
        }
        
        const payload = {
            customerName: formData.get('full_name'),
            customerPhone: formData.get('phone'),
            deliveryAddress: formData.get('delivery_address'),
            deliveryTime: deliveryTime,
            total: total,
            date: new Date().toISOString()
        };

        try {
            const response = await fetch(ORDERS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }

            const result = await response.json();
            showNotification('success', 'Заказ оформлен!', `Ваш заказ №${result.id} успешно отправлен. Стоимость: ${total} ₽`);
            
            // Очищаем заказ
            localStorage.removeItem(orderLocalStorageKey);
            
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 2500);

        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('error', 'Ошибка отправки', error.message);
        } finally {
            submitOrderBtn.disabled = false;
            submitOrderBtn.textContent = 'Оформить заказ';
        }
    });

    // --- Логика времени доставки ---
    document.querySelectorAll('input[name="delivery_type"]').forEach(input => {
        input.addEventListener('change', (event) => {
            if (event.target.value === 'specific') {
                specificTimeGroup.classList.remove('hidden');
                document.getElementById('deliveryTime').setAttribute('required', 'required');
            } else {
                specificTimeGroup.classList.add('hidden');
                document.getElementById('deliveryTime').removeAttribute('required');
            }
        });
    });

    // --- ИНИЦИАЛИЗАЦИЯ ---
    loadOrderData();
    
    // Даем время на загрузку данных
    setTimeout(() => {
        renderOrderItems();
        
        // Проверяем наличие заказа
        const hasItems = Object.values(selectedDishes).some(dish => dish !== null);
        if (!hasItems) {
            showNotification('warning', 'Заказ пуст', 'Пожалуйста, вернитесь в меню и выберите блюда');
        }
    }, 500);

})();