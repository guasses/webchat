var person = {};
$(function(){
    var socket = io();
    var connected = false;

    $("button[type='submit']").click(()=>{
        let username = $("input[type='username']").val();
        if(username != ""){
            socket.emit('add user',username);
            person.username = username;
        }else if(username == ""){
            return true;
        }
        return false;
    });
    $("#send-message").click((e)=>{
        sendMessage(socket);
        if(connected){
            //displayMyMessage()
            var $content = $('#content');
            var $right = $('<div></div>').addClass('right');
            var temp = new Date();
            var time = temp.toLocaleDateString() + " " + temp.toLocaleTimeString();
            var $time = $('<div></div>').text(time + person.username);
            var $message = $('<p></p>').text(person.message);
            console.log(person.message);
            var $clearfix1 = $('<div></div>').addClass('clearfix');
            var $clearfix2 = $('<div></div>').addClass('clearfix');
            $time.addClass('pull-right');
            $message.addClass('pull-right');
            $right.append($time).append($clearfix1).append($message).append($clearfix2);
            $content.append($right);
        }
    });
    socket.on('login',(data)=>{
        connected = true;
        let $loginPage = $('#login-page');
        let $chatPage = $('#chat-page');
        $loginPage.hide();
        $chatPage.show();
        var message = `欢迎${person.username}来到webchat`;
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
        if(username){
            socket.emit('add user',username);
        }
    });
    socket.on('reconnect_error',()=>{
        console.log('重新连接失败！');
    });

});
function sendMessage(socket){
    var $inputMessage = $('#input-message');
    var inputMessage = $inputMessage.val();
    //console.log(inputMessage);
    $inputMessage.val('');
    person.message = inputMessage;
    socket.emit('new message',inputMessage);
}
function displayMessage(data){
    var $content = $('#content');
    var $left = $('<div></div>').addClass('left');
    var temp = new Date();
    var time = temp.toLocaleDateString() + " " + temp.toLocaleTimeString();
    var $time = $('<div></div>').text(time + data['username']);
    var $message = $('<p></p>').text(data['message']);
    $left.append($time).append($message);
    $content.append($left);
}

/*var socket = io('/http://localhost:8080');

$(function(){
    createSocket(socket);
    $("#send-message").click(sendMessage);
    $('#input-message').keyup(onInputKeyDown);
});

function displayMessage(data){
    var $left = $('<div></div>').addClass('left');
    //var temp = new Date();
    //var time = temp.toLocaleDateString() + " " + temp.toLocaleTimeString();
    var $time = $('<div></div>').text(data['time']);
    var $message = $('<p></p>').text(data['content']);
    $left.append($time).append($message);
    $content.append($left);
}
function sendMessage(event){
    var $inputMessage = $('#input-message');
    var inputMessage = $inputMessage.val();
    //console.log(inputMessage);
    $inputMessage.val('');
}*/
