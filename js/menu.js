// js/menu.js
(function () {
    const categoryContainers = {};
    document.querySelectorAll('.dishes').forEach(div => {
        const cat = div.dataset.category;
        if (cat) categoryContainers[cat] = div;
    });

    const categories = ["soup", "main", "salad", "drink", "dessert"];

    // Группируем и сортируем
    const grouped = {};
    categories.forEach(c => grouped[c] = []);
    window.dishes.forEach(d => {
        if (grouped[d.category]) {
            grouped[d.category].push(d);
        }
    });
    
    Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    });

    // Активные фильтры для каждой категории
    const activeFilters = {
        soup: null,
        main: null,
        salad: null,
        drink: null,
        dessert: null
    };

    // Создание карточки
    function createDishCard(dish) {
        const card = document.createElement('div');
        card.className = 'dish';
        card.setAttribute('data-dish', dish.keyword);
        card.setAttribute('data-kind', dish.kind);
        card.innerHTML = `
            <img src="${dish.image}" alt="${dish.name}">
            <div class="dish-content">
                <div class="name">${dish.name}</div>
                <div class="count">${dish.count}</div>
                <div class="price">${dish.price} ₽</div>
                <button class="add-btn" type="button">Добавить</button>
            </div>
        `;
        return card;
    }

    // Рендерим карточки
    function renderDishes(category, filterKind = null) {
        const container = categoryContainers[category];
        if (!container) return;
        
        container.innerHTML = '';
        const dishes = filterKind 
            ? grouped[category].filter(d => d.kind === filterKind)
            : grouped[category];
        
        dishes.forEach(dish => {
            container.appendChild(createDishCard(dish));
        });
    }

    // Инициализация: показываем все блюда
    Object.keys(grouped).forEach(cat => renderDishes(cat));

    // Обработчик фильтров
    document.addEventListener('click', function (e) {
        if (e.target.matches('.filter-btn')) {
            const btn = e.target;
            const section = btn.closest('.menu-section');
            const category = section.querySelector('.dishes').dataset.category;
            const kind = btn.dataset.kind;

            // Если фильтр уже активен - снимаем его
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                activeFilters[category] = null;
                renderDishes(category);
            } else {
                // Снимаем active со всех кнопок в этой секции
                section.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // Активируем текущую
                btn.classList.add('active');
                activeFilters[category] = kind;
                renderDishes(category, kind);
            }
        }
    });

    // Состояние выбранных блюд
    const selected = {
        soup: null,
        main: null,
        salad: null,
        drink: null,
        dessert: null
    };

    function findDishByKeyword(keyword) {
        return window.dishes.find(d => d.keyword === keyword);
    }

    // Клик на кнопку "Добавить"
    document.addEventListener('click', function (e) {
        if (e.target.matches('.add-btn')) {
            const card = e.target.closest('.dish');
            const keyword = card.getAttribute('data-dish');
            const dish = findDishByKeyword(keyword);
            if (!dish) return;

            selected[dish.category] = dish.keyword;

            // Снимаем выделение со всех карточек в категории (даже скрытых)
            document.querySelectorAll(`.dish[data-dish]`).forEach(d => {
                const dishData = findDishByKeyword(d.getAttribute('data-dish'));
                if (dishData && dishData.category === dish.category) {
                    d.classList.remove('selected');
                }
            });
            
            card.classList.add('selected');
            renderOrderSection();
        }
    });

    const nothingSelectedEl = document.getElementById('nothingSelected');
    const orderCategoriesEl = document.getElementById('orderCategories');
    const orderSummaryEl = document.getElementById('orderSummary');
    const orderTotalEl = document.getElementById('orderTotal');

    function renderOrderSection() {
        const anySelected = Object.values(selected).some(v => v !== null);

        if (!anySelected) {
            nothingSelectedEl.classList.remove('hidden');
            orderCategoriesEl.classList.add('hidden');
            orderSummaryEl.classList.add('hidden');
            removeHiddenInputs();
            return;
        }

        nothingSelectedEl.classList.add('hidden');
        orderCategoriesEl.classList.remove('hidden');

        categories.forEach(cat => {
            const content = document.querySelector(`[data-order-content="${cat}"]`);
            if (!content) return;
            
            content.innerHTML = '';
            const keyword = selected[cat];
            
            if (!keyword) {
                const span = document.createElement('span');
                span.className = 'order-empty';
                if (cat === 'drink') span.innerText = 'Напиток не выбран';
                else if (cat === 'dessert') span.innerText = 'Десерт не выбран';
                else span.innerText = 'Блюдо не выбрано';
                content.appendChild(span);
            } else {
                const dish = findDishByKeyword(keyword);
                if (dish) {
                    const nameDiv = document.createElement('div');
                    nameDiv.innerText = dish.name;
                    nameDiv.style.fontWeight = '600';
                    const priceDiv = document.createElement('div');
                    priceDiv.innerText = `${dish.price} ₽`;
                    priceDiv.style.color = '#667eea';
                    priceDiv.style.fontWeight = '700';
                    content.appendChild(nameDiv);
                    content.appendChild(priceDiv);
                }
            }
        });

        let total = 0;
        Object.values(selected).forEach(kw => {
            if (kw) {
                const d = findDishByKeyword(kw);
                if (d) total += d.price;
            }
        });
        orderTotalEl.innerText = `${total} ₽`;
        orderSummaryEl.classList.remove('hidden');

        updateHiddenInputs();
    }

    function updateHiddenInputs() {
        const form = document.getElementById('orderForm');
        if (!form) return;

        removeHiddenInputs();

        Object.entries(selected).forEach(([cat, kw]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = cat;
            input.value = kw || '';
            input.dataset.hiddenField = 'true';
            form.appendChild(input);
        });
    }

    function removeHiddenInputs() {
        const form = document.getElementById('orderForm');
        if (!form) return;
        Array.from(form.querySelectorAll('input[data-hidden-field="true"]')).forEach(inp => inp.remove());
    }

    // Показ/скрытие поля времени
    document.querySelectorAll('input[name="deliveryTime"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const timeInput = document.getElementById('specificTime');
            if (this.value === 'specific') {
                timeInput.classList.remove('hidden');
                timeInput.required = true;
            } else {
                timeInput.classList.add('hidden');
                timeInput.required = false;
            }
        });
    });

    // Сброс
    document.getElementById('resetOrder').addEventListener('click', () => {
        document.querySelectorAll('.dish.selected').forEach(d => d.classList.remove('selected'));
        Object.keys(selected).forEach(k => selected[k] = null);
        renderOrderSection();
    });

    // Отправка
    document.getElementById('orderForm').addEventListener('submit', function (e) {
        e.preventDefault();
        
        const anySelected = Object.values(selected).some(v => v !== null);
        if (!anySelected) {
            alert('Пожалуйста, выберите хотя бы одно блюдо!');
            return;
        }

        const deliveryTimeType = document.querySelector('input[name="deliveryTime"]:checked').value;
        const specificTime = deliveryTimeType === 'specific' ? document.getElementById('specificTime').value : null;

        const payload = {
            customerName: this.customerName.value,
            customerPhone: this.customerPhone.value,
            deliveryAddress: this.deliveryAddress.value,
            deliveryTime: deliveryTimeType === 'asap' ? 'Как можно скорее' : `К ${specificTime}`,
            items: {},
            total: orderTotalEl.innerText
        };
        
        Object.entries(selected).forEach(([cat, kw]) => {
            if (kw) {
                const dish = findDishByKeyword(kw);
                payload.items[cat] = {
                    keyword: kw,
                    name: dish.name,
                    price: dish.price
                };
            }
        });

        alert('Заказ успешно оформлен!\n\n' + JSON.stringify(payload, null, 2));

        document.querySelectorAll('.dish.selected').forEach(d => d.classList.remove('selected'));
        Object.keys(selected).forEach(k => selected[k] = null);
        this.reset();
        document.getElementById('specificTime').classList.add('hidden');
        renderOrderSection();
    });

    renderOrderSection();
})();