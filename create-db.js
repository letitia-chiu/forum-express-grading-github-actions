// *** User Settings *** //

// Please modify "hostname", "user", "password" to match your MySQL server connection settings in /config/config.json
// You can also change the "database" name if it already exists.

const { development: UserSetting } = require('./config/config')

const mysql = require('mysql2')

// Create connection
const connection = mysql.createConnection({
  host: UserSetting.host,
  user: UserSetting.username,
  password: UserSetting.password
})

// Connect to MySQL server
connection.connect(err => {
  if (err) throw err
  console.log('Connected to MySQL server.')

  // Create database
  connection.query('USE ' + UserSetting.database, (err, result) => {
    if (err) {
      connection.query(`CREATE DATABASE IF NOT EXISTS ${UserSetting.database}`, (err, result) => {
        if (err) throw err
        console.log('Database created.')
        process.exit()
      })
    } else {
      console.log('Database already exists.')
      process.exit()
    }
  })
})
