// API endpoints
const API_URL = 'http://localhost:3000/api';

// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
    
    if (document.getElementById('itemsTable')) {
        loadItems();
    }
    if (document.getElementById('itemForm')) {
        document.getElementById('itemForm').addEventListener('submit', addItem);
    }
    if (document.getElementById('searchInput')) {
        document.getElementById('searchInput').addEventListener('input', filterItems);
    }
    if (document.getElementById('editForm')) {
        document.getElementById('editForm').addEventListener('submit', updateItem);
    }
    if (document.querySelector('.close')) {
        document.querySelector('.close').addEventListener('click', closeModal);
    }
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

// Initialize animations
function initAnimations() {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach(el => {
        observer.observe(el);
    });
}

// Load all items
async function loadItems() {
    try {
        const response = await fetch(`${API_URL}/items`);
        const items = await response.json();
        displayItems(items);
    } catch (error) {
        console.error('Error loading items:', error);
        showNotification('Error loading items', 'error');
    }
}

// Display items in table
function displayItems(items) {
    const tbody = document.getElementById('itemsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    let totalItems = 0;
    let totalValue = 0;
    let lowStock = 0;

    items.forEach(item => {
        const row = document.createElement('tr');
        const totalItemValue = (item.quantity * item.price);
        totalValue += totalItemValue;
        totalItems++;
        if (item.quantity < 10) lowStock++;
        
        // Determine stock status
        let stockStatus = '';
        if (item.quantity === 0) {
            stockStatus = '<span class="status-tag out-of-stock">Out of Stock</span>';
        } else if (item.quantity < 10) {
            stockStatus = '<span class="status-tag low-stock">Low Stock</span>';
        } else {
            stockStatus = '<span class="status-tag in-stock">In Stock</span>';
        }

        const imageHtml = item.image ? `<img src="${item.image}" alt="${item.name}" class="product-image">` : '<div class="product-image" style="background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #94a3b8;">No Img</div>';

        // Column structure: Image, Name, Category, Quantity, Price, Status, Actions
        row.innerHTML = `
            <td>${imageHtml}</td>
            <td style="font-weight: 600;">${item.name}</td>
            <td>${item.category || 'Uncategorized'}</td>
            <td>${item.quantity}</td>
            <td style="font-weight: 500;">₹${parseFloat(item.price).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
            <td>${stockStatus}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="action-btn edit-btn" onclick="editItem(${item.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteItem(${item.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Update dashboard stats
    if (document.getElementById('totalItems')) {
        document.getElementById('totalItems').textContent = totalItems.toLocaleString();
        document.getElementById('totalValue').textContent = `₹${totalValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
        document.getElementById('lowStock').textContent = lowStock.toLocaleString();
    }
}

// Add new item
async function addItem(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('quantity', document.getElementById('quantity').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);
    
    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            document.getElementById('itemForm').reset();
            // If we are on add-item.html, maybe redirect or just show success
            showNotification('Item added successfully', 'success');
            if (window.location.pathname.includes('index.html')) {
                await loadItems();
            }
        } else {
            showNotification('Error adding item', 'error');
        }
    } catch (error) {
        console.error('Error adding item:', error);
        showNotification('Error adding item', 'error');
    }
}

// Edit item
async function editItem(id) {
    try {
        const response = await fetch(`${API_URL}/items/${id}`);
        const item = await response.json();

        if (document.getElementById('editModal')) {
            document.getElementById('editId').value = item.id;
            document.getElementById('editName').value = item.name;
            document.getElementById('editQuantity').value = item.quantity;
            document.getElementById('editPrice').value = item.price;
            document.getElementById('editCategory').value = item.category || '';
            document.getElementById('editDescription').value = item.description || '';

            document.getElementById('editModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading item for edit:', error);
        showNotification('Error loading item', 'error');
    }
}

// Update item
async function updateItem(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('editName').value);
    formData.append('quantity', document.getElementById('editQuantity').value);
    formData.append('price', document.getElementById('editPrice').value);
    formData.append('category', document.getElementById('editCategory').value);
    formData.append('description', document.getElementById('editDescription').value);
    
    const imageFile = document.getElementById('editImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            closeModal();
            await loadItems();
            showNotification('Item updated successfully', 'success');
        } else {
            showNotification('Error updating item', 'error');
        }
    } catch (error) {
        console.error('Error updating item:', error);
        showNotification('Error updating item', 'error');
    }
}

// Delete item
async function deleteItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        try {
            const response = await fetch(`${API_URL}/items/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadItems();
                showNotification('Item deleted successfully', 'success');
            } else {
                showNotification('Error deleting item', 'error');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showNotification('Error deleting item', 'error');
        }
    }
}

// Filter items based on search
function filterItems(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.getElementById('itemsBody').getElementsByTagName('tr');

    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Close modal
function closeModal() {
    if (document.getElementById('editModal')) {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('editForm').reset();
    }
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? 'var(--primary)' : '#ef4444'};
        color: white;
        border-radius: 16px;
        z-index: 3000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        font-weight: 600;
        animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        notification.style.transition = 'all 0.4s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 400);
    }, 3000);
}

// Add notification animation
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes slideUp {
        from { transform: translateY(100%) scale(0.8); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
    }
`;
document.head.appendChild(animationStyle);