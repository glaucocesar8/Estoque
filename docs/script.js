function showMessage(message, isSuccess) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = isSuccess ? 'success' : 'error';
    messageDiv.classList.remove('hidden');
}

function clearMessage() {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = 'hidden';
}

function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('https://glaucocesar8.github.io/Estoque/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login successful') {
            window.location.href = 'dashboard.html';
        } else {
            showMessage(data.message, false);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Ocorreu um erro ao tentar fazer login.', false);
    });
}

function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    })
    .then(response => response.json())
    .then(data => {
        showMessage(data.message, data.message === 'User registered successfully');
        if (data.message === 'User registered successfully') {
            window.location.href = 'index.html';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Ocorreu um erro ao tentar se cadastrar.', false);
    });
}

function resetPassword() {
    const email = document.getElementById('reset-email').value;
    alert(`Email para recuperação: ${email}`);
    // Implementar lógica de recuperação de senha aqui
}

function logout() {
    window.location.href = 'index.html';
}

function createEditableCell(value) {
    const cell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    cell.appendChild(input);
    return cell;
}

async function saveItemEdits(row) {
    const itemId = row.dataset.id;
    const itemnum = row.querySelector('.itemnum input').value;
    const description = row.querySelector('.description input').value;
    const binnum = row.querySelector('.binnum input').value;
    const binnum1 = row.querySelector('.binnum1 input').value;
    const curbal = row.querySelector('.curbal input').value;
    const status = row.querySelector('.status input').value;
    const avgcost = row.querySelector('.avgcost input').value;
    const avgcost2 = row.querySelector('.avgcost2 input').value;
    const lastissuedate = row.querySelector('.lastissuedate input').value;

    const updatedItem = {
        itemnum,
        description,
        binnum,
        binnum1,
        curbal,
        status,
        avgcost,
        avgcost2,
        lastissuedate
    };

    try {
        const response = await fetch(`/api/items/${itemnum}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedItem)
        });

        const result = await response.json();
        showMessage(result.message, response.ok);
        
        if (response.ok) {
            loadItems();
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showMessage('Erro ao salvar item', false);
    }
}

function enableEditing(row) {
    row.querySelectorAll('td').forEach((cell, index) => {
        if (index < 9) { // exclude the action buttons
            const value = cell.textContent;
            cell.classList.add(cell.dataset.type);
            cell.innerHTML = '';
            cell.appendChild(createEditableCell(value));
        }
    });

    const actionCell = row.querySelector('.actions');
    actionCell.innerHTML = `<button class="save-btn">Salvar</button>`;

    row.querySelector('.save-btn').addEventListener('click', () => saveItemEdits(row));
}

async function loadItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        const tbody = document.getElementById('items-table').querySelector('tbody');
        tbody.innerHTML = '';
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.dataset.itemnum = item.itemnum;
            tr.innerHTML = `
                <td class="itemnum">${item.itemnum}</td>
                <td class="description">${item.description}</td>
                <td class="binnum">${item.binnum}</td>
                <td class="binnum1">${item.binnum1}</td>
                <td class="curbal">${item.curbal}</td>
                <td class="status">${item.status}</td>
                <td class="avgcost">${item.avgcost}</td>
                <td class="avgcost2">${item.avgcost2}</td>
                <td class="lastissuedate">${item.lastissuedate}</td>
                <td class="actions">
                    <button class="edit-btn">Editar</button>
                    <button class="delete-btn">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
            tr.querySelector('.edit-btn').addEventListener('click', () => enableEditing(tr));
            tr.querySelector('.delete-btn').addEventListener('click', () => handleDelete(tr.dataset.itemnum));
        });
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

async function handleDelete(itemnum) {
    try {
        const response = await fetch(`/api/items/${itemnum}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            console.log('Item excluído com sucesso');
            loadItems();
        } else {
            console.error('Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

document.querySelector('#item-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const itemnum = document.querySelector('#item-form').dataset.itemnum;
    const newItem = {
        itemnum: document.querySelector('#itemnum').value,
        description: document.querySelector('#description').value,
        binnum: document.querySelector('#binnum').value,
        binnum1: document.querySelector('#binnum1').value,
        curbal: document.querySelector('#curbal').value,
        status: document.querySelector('#status').value,
        avgcost: document.querySelector('#avgcost').value,
        avgcost2: document.querySelector('#avgcost2').value,
        lastissuedate: document.querySelector('#lastissuedate').value
    };

    try {
        const response = await fetch(itemnum ? `/api/items/${itemnum}` : '/api/saveItem', {
            method: itemnum ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newItem)
        });

        const result = await response.json();
        showMessage(result.message, response.ok);
        
        if (response.ok) {
            loadItems();
            document.querySelector('#item-form').reset();
            document.querySelector('#item-form').dataset.itemnum = '';
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showMessage('Erro ao salvar item', false);
    }
});

document.addEventListener('DOMContentLoaded', loadItems);

document.getElementById('search-button').addEventListener('click', searchItems);

async function searchItems() {
    const query = document.getElementById('search-query').value;
    try {
        const response = await fetch(`/api/searchItems?query=${query}`);
        const items = await response.json();
        const tbody = document.getElementById('items-table').querySelector('tbody');
        tbody.innerHTML = '';
        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.itemnum}</td>
                <td>${item.description}</td>
                <td>${item.binnum}</td>
                <td>${item.binnum1}</td>
                <td>${item.curbal}</td>
                <td>${item.status}</td>
                <td>${item.avgcost}</td>
                <td>${item.avgcost2}</td>
                <td>${item.lastissuedate}</td>
                <td>
                    <button class="edit-btn" data-id="${item.itemnum}">Editar</button>
                    <button class="delete-btn" data-id="${item.itemnum}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
            tr.querySelector('.edit-btn').addEventListener('click', () => enableEditing(tr));
            tr.querySelector('.delete-btn').addEventListener('click', () => handleDelete(tr.dataset.itemnum));
        });
        
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}
