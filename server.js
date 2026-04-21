const express = require('express')
const { Pool } = require('pg')

require('fs').existsSync('.env') && require('fs').readFileSync('.env', 'utf8')
  .split('\n')
  .forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length) process.env[key.trim()] = val.join('=').trim()
  })

const app = express()
const PORT = process.env.PORT || 3000

// Conecta via DATABASE_URL injetada pelo Mimesis
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

// Mostra qual banco está conectado
app.get('/', async (req, res) => {
  try {
    const db = await pool.query('SELECT current_database() as db, version() as version')
    const users = await pool.query('SELECT COUNT(*) as total FROM users')
    const orders = await pool.query('SELECT COUNT(*) as total FROM orders')

    res.json({
      environment: process.env.NODE_ENV || 'unknown',
      database: {
        name: db.rows[0].db,
        version: db.rows[0].version,
      },
      counts: {
        users: parseInt(users.rows[0].total),
        orders: parseInt(orders.rows[0].total),
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Lista usuários — aqui vai ser possível ver se os dados foram anonimizados
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, cpf, phone FROM users ORDER BY id'
    )
    res.json({ users: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Lista pedidos
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, total, status, created_at FROM orders ORDER BY id'
    )
    res.json({ orders: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`demo-app running on port ${PORT}`)
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`)
})