const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const path = require('path')

const app = express()
app.use(express.json())

const dataBasePath = path.join(__dirname, 'userData.db')

let dataBase = null

const startServerAndDatabase = async () => {
  try {
    dataBase = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    })
    console.log('Server Has initiated...!')
  } catch (error) {
    console.log(error.message)
    process.exit(1)
  }
}

startServerAndDatabase()

//POST API
app.post('/register', async (req, res) => {
  const {username, name, password, gender, location} = req.body
  const sqlQuery = `
  SELECT * FROM user WHERE username = '${username}';`
  const hashedPassword = await bcrypt.hash(password, 10)
  const sqlResponse = await dataBase.get(sqlQuery)
  const passLength = password.length
  if (sqlResponse === undefined) {
    if (passLength > 5) {
      const sqlQueryToAdd = `INSERT INTO user (username, name, password, gender, location)
      VALUES ('${username}', '${name}','${hashedPassword}','${gender}','${location}');`
      await dataBase.run(sqlQueryToAdd)
      res.status(200)
      res.send('User created successfully')
    } else {
      res.status(400)
      res.send('Password is too short')
    }
  } else {
    res.status(400)
    res.send('User already exists')
  }
})

//POST login API
app.post('/login', async (req, res) => {
  const {username, password} = req.body
  const sqlUeqryToCheck = `
  SELECT * FROM user WHERE username = '${username}';`
  const sqlResponse = await dataBase.get(sqlUeqryToCheck)
  if (sqlResponse === undefined) {
    res.status(400)
    res.send('Invalid user')
  } else {
    const isPasswordSame = await bcrypt.compare(password, sqlResponse.password)
    if (isPasswordSame) {
      res.status(200)
      res.send('Login success!')
    } else {
      res.status(400)
      res.send('Invalid password')
    }
  }
})

//PUT chagne user API
app.put('/change-password', async (req, res) => {
  const {username, oldPassword, newPassword} = req.body
  const sqlToCheckUser = `
  SELECT * FROM user WHERE username = '${username}';`
  const userCheckInDatabse = await dataBase.get(sqlToCheckUser)
  const oldPasswordCheck = await bcrypt.compare(
    oldPassword,
    userCheckInDatabse.password,
  )
  //console.log(oldPasswordCheck)
  if (oldPasswordCheck) {
    if (newPassword.length > 5) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)
      const sqlQueryTOUpdate = `UPDATE user SET password = '${hashedNewPassword}' WHERE username = '${username}';`
      const updated = await dataBase.run(sqlQueryTOUpdate)
      //console.log(updated.lastID)
      res.status(200)
      res.send('Password updated')
    } else {
      res.status(400)
      res.send('Password is too short')
    }
  } else {
    res.status(400)
    res.send('Invalid current password')
  }
})
app.listen(3000)

module.exports = app
