const path = require('path');
const http = require('http'); // need this for websockets
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express();
const server = http.createServer(app); // needed to enable websockets
const io = socketio(server); // configure socketio -- must pass a raw http server as arg

const PORT = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

app.use(express.json()); // automatically parse incoming JSON into an object

io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  // listen for new users to join
  socket.on('join', (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options })

    if (error) {
      return callback(error)
    }

    socket.join(user.room);
    // socket.emit('message', generateMessage('Welcome!'));
    io.to(user.room).emit('message', generateMessage('Admin', 'Welcome!'))

    // io.to.emit   ||  socket.broadcast.to.emit
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`)) // sends to all users EXCEPT this connection
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  // listen for chat room messages
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)

    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed')
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    // this is the acknowledgement
    callback('Delivered')
  })

  // listen for location
  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));
    callback();
  })


  // run code when a socket is disconnected
  socket.on('disconnect', () => {
    const user = removeUser(socket.id)

    if (user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

// server.listen necessary for websockets
server.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`)
})