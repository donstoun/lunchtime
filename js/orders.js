// js/orders.js
(function() {
    const { BASE_API_URL, showNotification } = window.menuExports || {};
    
    if (!document.getElementById('ordersTableBody')) return;

    const ORDERS_API_URL = `https://68f8fef9deff18f212b85464.mockapi.io/orders`;
    const ordersTableBody = document.getElementById('ordersTableBody');
    const noOrdersMessage = document.getElementById('noOrdersMessage');
    
    let allOrders = [];

    // --- Загрузка заказов с MockAPI ---
    async function loadOrders() {
        ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Загрузка заказов...</td></tr>';
        noOrdersMessage.classList.add('hidden');
        
        try {
            const response = await fetch(ORDERS_API_URL);
            
            if (!response.ok) {
                throw new Error(`Ошибка загрузки заказов: ${response.status}`);
            }
            
            const orders = await response.json();
            allOrders = orders;
            
            // Сортировка по убыванию даты (новые сверху)
            allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            renderOrders(allOrders);

        } catch (error) {
            console.error('Ошибка при загрузке заказов:', error);
            ordersTableBody.innerHTML = '';
            showNotification('error', 'Ошибка загрузки', `Не удалось загрузить заказы. ${error.message}`);
            noOrdersMessage.classList.remove('hidden');
            noOrdersMessage.textContent = 'Не удалось загрузить заказы. Проверьте подключение к интернету.';
        }
    }

    // --- Рендеринг таблицы заказов ---
    function renderOrders(orders) {
        ordersTableBody.innerHTML = '';
        
        if (orders.length === 0) {
            noOrdersMessage.classList.remove('hidden');
            noOrdersMessage.textContent = 'У вас пока нет оформленных заказов.';
            return;
        }

        noOrdersMessage.classList.add('hidden');

        orders.forEach((order, index) => {
            const row = document.createElement('tr');
            
            // Форматирование даты
            const date = new Date(order.date);
            const formattedDate = date.toLocaleDateString('ru-RU', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            row.innerHTML = `
                <td>${order.id}</td>
                <td>${formattedDate}</td>
                <td>${order.customerName}</td>
                <td>${order.deliveryAddress}</td>
                <td>${order.total} ₽</td>
                <td>${order.deliveryTime}</td>
                <td class="action-buttons">
                    <button class="details-btn" data-id="${order.id}" title="Подробнее">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="delete-btn" data-id="${order.id}" title="Удалить">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            ordersTableBody.appendChild(row);
        });

        // Добавление обработчиков событий
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', showOrderDetails);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteOrder);
        });
    }

    // --- Показать детали заказа ---
    function showOrderDetails(e) {
        const orderId = e.currentTarget.dataset.id;
        const order = allOrders.find(o => o.id === orderId);
        
        if (!order) return;

        const date = new Date(order.date).toLocaleString('ru-RU');

        showNotification('info', `Заказ №${order.id}`, 
            `<div style="text-align: left;">
                <p><strong>Дата:</strong> ${date}</p>
                <p><strong>Клиент:</strong> ${order.customerName}</p>
                <p><strong>Телефон:</strong> ${order.customerPhone}</p>
                <p><strong>Адрес:</strong> ${order.deliveryAddress}</p>
                <p><strong>Время доставки:</strong> ${order.deliveryTime}</p>
                <p><strong>Стоимость:</strong> ${order.total} ₽</p>
            </div>`
        );
    }

    // --- Удаление заказа ---
    async function deleteOrder(e) {
        const orderId = e.currentTarget.dataset.id;
        
        if (!confirm(`Вы уверены, что хотите удалить заказ №${orderId}?`)) {
            return;
        }

        try {
            const response = await fetch(`${ORDERS_API_URL}/${orderId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Ошибка удаления: ${response.status}`);
            }

            showNotification('success', 'Заказ удалён', `Заказ №${orderId} успешно удалён.`);
            await loadOrders(); // Перезагрузка списка

        } catch (error) {
            console.error('Ошибка при удалении заказа:', error);
            showNotification('error', 'Ошибка удаления', `Не удалось удалить заказ. ${error.message}`);
        }
    }

    // --- Инициализация ---
    document.addEventListener('DOMContentLoaded', loadOrders);

})();