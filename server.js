const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const BaseModel = require('./js/base_model.js');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

server.listen(8080,()=>{
    console.log('端口8080已运行web服务!');
});
app.use(express.static('public'));
var upload = multer({
    dest:"./public/image/upload"
});

var numUsers = 0;
var baseModel = new BaseModel();

app.post('/upload',upload.single('picture'),(req,res,next)=>{
    console.log(req.body);
    fs.rename(req.file.path,"./public/image/upload/" + req.file.originalname,function(err){
        if(err){
            throw err;
        }
        console.log("头像上传成功！");
    });
    res.end("1");
});
app.post('/select-head',urlencodedParser,(req,res,next)=>{
    console.log(req.body.select_head_name);
    res.end("1");
});

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