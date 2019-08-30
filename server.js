var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const BaseModel = require('./js/base_model.js');

server.listen(8080,()=>{
    console.log('端口8080已运行web服务!');
});
app.use(express.static('public'));

var numUsers = 0;
var baseModel = new BaseModel();

io.on('connect',(socket)=>{
    var addedUser = false;
    socket.on('new message',(data)=>{
        socket.broadcast.emit('new message',{
            username:data['username'],
            message:data['message']
        });
        var date = new Date();
        baseModel.insert("group_histroy_messages",{
            id:data['id'],
            time:date,
            username:data['username'],
            message:data['message']
        },function(result){
            console.log(result);
            console.log("添加消息记录到数据库成功");
        });
    });
    socket.on('add user',(data)=>{
        baseModel.findOneById("users",{'username':data['username']},function(result){
            if(result){
                socket.emit('add user state',"failure");
            }else{
                let date = new Date();
                baseModel.insert("users",{
                    username:data['username'],
                    password:data['password'],
                    create_time:date
                },function(result){
                    if(result){
                        console.log("添加用户成功！");
                        socket.emit('add user state',"success");
                    }
                });
            }
        });
    });
    socket.on('login',(data)=>{
        var whereJson = {
            'and':[{'key':'username','opts':'=','value':`"${data['username']}"`},
            {'key':'password','opts':'=','value':`"${data['password']}"`}],
            'or':[]
        }
        baseModel.find('users',whereJson,{'key':'id','type':'desc'},[],[],function(result){
            if(result.length>0){
                socket.emit('login state','success');
                ++numUsers;
            }else{
                socket.emit('login state','failure');
            }
        });
    })
    socket.on('group histroy messages',(data)=>{
        baseModel.find('group_histroy_messages',{
            'and':[],
            'or':[]
        },{'key':'time','type':'desc'},[0,10],[],(result)=>{
            socket.emit('group histroy messages',result);
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
            });
        }
    });
})