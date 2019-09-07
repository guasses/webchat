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
    let user_id = req.body.user_id;
    //console.log(req.file.originalname);
    fs.rename(req.file.path,"./public/image/upload/" + req.body.user_id,function(err){
        if(err){
            throw err;
        }
        baseModel.modify('users',{id:user_id},{head_name:"image/upload/"+user_id},(result)=>{
            if(result){
                console.log("修改头像成功！");
            }
        });
        res.end("image/upload/" + req.body.user_id);
    });
});
app.post('/select-head',urlencodedParser,(req,res,next)=>{
    let user_id = req.body.user_id;
    baseModel.modify('users',{id:user_id},{head_name:req.body.select_head_name},(result)=>{
        if(result){
            console.log('修改头像成功！');
        }
    });
    res.end(req.body.select_head_name);
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
                //console.log(result);
                socket.emit('login state',{
                    login_state:'success',
                    user_id:result[0]['id'],
                    head_name:result[0]['head_name']
                });
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
        },{'key':'message_id','type':'desc'},[0,10],[],(result)=>{
            //console.log(result);
            socket.emit('group histroy messages',result);
        });
    });
    socket.on('head name',(data)=>{
        //console.log(data);
        socket.emit('head name',{head_name:data['head_name']});
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