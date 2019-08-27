var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(8080,()=>{
    console.log('端口8080已运行web服务!');
});
app.use(express.static('public'));

var numUsers = 0;

io.on('connect',(socket)=>{
    var addedUser = false;
    socket.on('new message',(data)=>{
        socket.broadcast.emit('new message',{
            username:socket.username,
            message:data
        });
    });

    socket.on('add user',(username)=>{
        if(addedUser) return;
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login',{
            numUsers:numUsers
        });
    });

    socket.on('typing',()=>{
        socket.broadcast.emit('typing',{
            username:socket.username
        });
    });
    socket.on('stop typing',()=>{
        socket.broadcast.emit('stop typing',{
            username:socket.username
        });
    });
    socket.on('disconnect',()=>{
        if(addedUser){
            --numUsers;
            socket.broadcast.emit('user left',{
                username:socket.username,
                numUsers:numUsers
            })
        }
    })
})