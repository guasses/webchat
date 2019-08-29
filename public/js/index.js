$(function(){
    var socket = io();
    var connected = false;
    var prePerson = "";
    var $content = $('#content');
    var $inputMessage = $('#input-message');
    if(localStorage.username != undefined){
        socket.emit('add user',localStorage.username);
    }
    $("button[type='submit']").click(()=>{
        let username = $("input[type='username']").val();
        if(username != ""){
            socket.emit('add user',username);
            localStorage.setItem("username",username);
        }else if(username == ""){
            return true;
        }
        return false;
    });
    $("#send-message").click((e)=>{
        let message = sendMessage(socket);
        if(connected){
            displayMessage(message);
        }
    });
    $inputMessage.keyup((e)=>{
        if(e.keyCode == 13){
            let message = sendMessage(socket);
            if(connected){
                displayMessage(message);
            }
        }
    });
    socket.on('login',(data)=>{
        connected = true;
        let $loginPage = $('#login-page');
        let $chatPage = $('#chat-page');
        $loginPage.hide();
        $chatPage.show();
        var message = `欢迎${localStorage.username}来到webchat`;
        console.log(message);
    });
    socket.on('new message',(data)=>{
        displayMessage(data);
        console.log(data);
    });
    socket.on('user joined',(data)=>{
        console.log(data.username + '加入');
    });
    socket.on('user left',(data)=>{
        console.log(data.username + '离开');
    });
    socket.on('typing',(data)=>{

    });
    socket.on('stop typing',()=>{

    });
    socket.on('disconnect',()=>{
        connected = false;
        console.log('断开连接');
    });
    socket.on('reconnect',()=>{
        console.log('重新连接');
        if(localStorage.username != undefined){
            socket.emit('add user',username);
        }
    });
    socket.on('reconnect_error',()=>{
        console.log('重新连接失败！');
    });

    function sendMessage(socket){
        var inputMessage = $inputMessage.val();
        //console.log(inputMessage);
        $inputMessage.val('');
        localStorage.message = inputMessage;
        socket.emit('new message',inputMessage);
        return inputMessage;
    }
    function displayMessage(data){
        var $container = $('<div></div>');
        var username,message = "";
        if(typeof data == "string"){
            $container.removeClass().addClass('mime');
            username = localStorage.username;
            message = localStorage.message;
        }else{
            $container.removeClass().addClass('other');
            username = data['username'];
            message = data['message'];
        }
        var $message = $('<p></p>').text("·"+message);
        if(prePerson == username){
            $container.append($message);
        }else{
            var time = new Date().toLocaleString();
            var $time = $('<div></div>').text(time + " " + username);
            $container.append($time).append($message);
            messageTmp['time'] = time;
        }
        $content.append($container);
        //让滚动条保持在最下方
        $content[0].scrollTop = $content[0].scrollHeight;
        prePerson = username;
    }
});