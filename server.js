const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('docs'));

// Path to users.json
const usersFilePath = path.join(__dirname, 'data', 'users.json');

// SQLite database path
const dbPath = path.join(__dirname, 'data', 'data.db');

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

// Function to create tables if they don't exist
const createTables = () => {
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemnum TEXT NOT NULL,
        description TEXT NOT NULL,
        binnum TEXT NOT NULL,
        binnum1 TEXT NOT NULL,
        curbal INTEGER NOT NULL,
        status TEXT NOT NULL,
        avgcost REAL NOT NULL,
        avgcost2 REAL NOT NULL,
        lastissuedate TEXT NOT NULL
    )`);
};

// Function to read users from users.json
const readUsers = () => {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const usersData = fs.readFileSync(usersFilePath);
    return JSON.parse(usersData);
};

// Function to write users to users.json
const writeUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Endpoint for user registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    const users = readUsers();
    const userExists = users.some(user => user.username === username || user.email === email);

    if (userExists) {
        return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, email, password: hashedPassword };
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ message: 'User registered successfully' });
});

// Endpoint for user login
app.post('https://glaucocesar8.github.io/Estoque/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const users = readUsers();
    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid username or password' });
    }

    res.status(200).json({ message: 'Login successful' });
});

// Endpoint to save item to SQLite database
app.post('/api/saveItem', (req, res) => {
    console.log(req.body); // Adicione esta linha para logar o corpo da solicitação
    const { itemnum, description, binnum, binnum1, curbal, status, avgcost, avgcost2, lastissuedate } = req.body;

    db.run(`INSERT INTO items (itemnum, description, binnum, binnum1, curbal, status, avgcost, avgcost2, lastissuedate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemnum, description, binnum, binnum1, curbal, status, avgcost, avgcost2, lastissuedate], function(err) {
            if (err) {
                return res.status(400).json({ message: 'Error saving item' });
            }
            res.status(201).json({ message: 'Item saved successfully' });
        });
});



// Endpoint to get all items from SQLite database
app.get('/api/items', (req, res) => {
    db.all(`SELECT * FROM items`, (err, rows) => {
        if (err) {
            return res.status(400).json({ message: 'Error retrieving items' });
        }
        res.status(200).json(rows);
    });
});

// Rota para obter todos os itens
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar itens.' });
        }
        res.status(200).json(rows);
    });
});

// Rota para obter um item específico
app.get('/api/items/:itemnum', (req, res) => {
    const itemnum = req.params.id;
    db.get('SELECT * FROM items WHERE itemnum = ?', [itemnum], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar item.' });
        }
        res.status(200).json(row);
    });
});

// Rota para atualizar um item
app.put('/api/items/:itemnum', (req, res) => {
    const { description, binnum, binnum1, curbal, status, avgcost, avgcost2, lastissuedate } = req.body;
    const itemnum = req.params.itemnum;

    // Construir a consulta SQL dinamicamente
    let fields = [];
    let values = [];

    if (description !== undefined) {
        fields.push('description = ?');
        values.push(description);
    }
    if (binnum !== undefined) {
        fields.push('binnum = ?');
        values.push(binnum);
    }
    if (binnum1 !== undefined) {
        fields.push('binnum1 = ?');
        values.push(binnum1);
    }
    if (curbal !== undefined) {
        fields.push('curbal = ?');
        values.push(curbal);
    }
    if (status !== undefined) {
        fields.push('status = ?');
        values.push(status);
    }
    if (avgcost !== undefined) {
        fields.push('avgcost = ?');
        values.push(avgcost);
    }
    if (avgcost2 !== undefined) {
        fields.push('avgcost2 = ?');
        values.push(avgcost2);
    }
    if (lastissuedate !== undefined) {
        fields.push('lastissuedate = ?');
        values.push(lastissuedate);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo fornecido para atualização.' });
    }

    values.push(itemnum);

    const sql = `UPDATE items SET ${fields.join(', ')} WHERE itemnum = ?`;

    db.run(sql, values, function (err) {
        if (err) {
            console.error("DB Error:", err.message);
            return res.status(500).json({ message: 'Erro ao atualizar item.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        res.status(200).json({ message: 'Item atualizado com sucesso.' });
    });
});


// Rota para excluir um item
app.delete('/api/items/:itemnum', (req, res) => {
    const itemnum = req.params.itemnum;
    db.run('DELETE FROM items WHERE itemnum = ?', [itemnum], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao excluir item.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        res.status(200).json({ message: 'Item excluído com sucesso.' });
    });
});

// Endpoint para pesquisar itens por nome
app.get('/api/searchItems', (req, res) => {
    const { query } = req.query;
    const sql = `SELECT * FROM items WHERE description LIKE ?`;
    const params = [`%${query}%`];
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar itens.' });
        }
        res.status(200).json(rows);
    });
});


app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
