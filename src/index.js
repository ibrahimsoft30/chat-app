const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage , generateLocationMessage} = require('./utils/messages');
const { addUser,getUser,removeUser,getUsersInRoom } = require('./utils/users');

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, '../public');

const app = express();
const server = http.createServer(app); 
const io = socketio(server);

io.on('connection',(socket)=>{
    console.log('new connection');

    socket.on('sendMessage', (message,callback) => {
        const filter = new Filter();
        if(filter.isProfane(message)){
            return callback('Profane Words Not Allowed');
        }
        const user = getUser(socket.id);
        io.to(user.room).emit('message',generateMessage(message,user.username));
        callback();
    });

    socket.on('join',({username,room},callback) => {
        const { error , user } = addUser({id:socket.id, username , room});
        if(error){
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Welcome!','Admin'));
        socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined!`,'Admin'));
        io.to(user.room).emit('roomData',{
            room:user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });
    socket.on('sendLocation', (position,callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${position.lat},${position.lng}`,user.username));

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',generateMessage(`${user.username} has left!`,'Admin'));
            io.to(user.room).emit('roomData',{
                room:user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});

app.use(express.static(publicDirectory));

server.listen(port,console.log(`running on port ${port}`));