var socket = io();
$(function(){
    var connected = false;
    var prePerson = "";
    var histroyPrePerson = "";
    var $content = $('#content');
    var $inputMessage = $('#input-message');
    var chatID = $(".list-group-item.active").attr("data-id");
    var $head_portrait = $('#head-portrait');
    var $pop_up_bar = $('.pop-up-bar');
    var head_name = "";
    if(localStorage.username != undefined && localStorage.password != undefined){
        socket.emit('login',{
            username:localStorage.username,
            password:localStorage.password
        });
    }
    $("#register").click(()=>{
        $('#login-page').hide();
        $('#signin-page').show();
    });
    $("#signin").click(()=>{
        $('#login-page').show();
        $('#signin-page').hide();
    });
    $("#login-submit").click(()=>{
        let username = $("#login-username").val();
        let password = $("#login-password").val();
        //console.log(username);
        if(username != "" && password != ""){
            socket.emit('login',{
                username:username,
                password:password
            });
            localStorage.username = username;
            localStorage.password = password;
        }else{
            return true;
        }
        return false;
    });
    $("#signin-submit").click(()=>{
        let username = $("#signin-username").val();
        let password = $("#signin-password").val();
        //console.log(username,password);
        if(username != "" && password != ""){
            socket.emit('add user',{
                username:username,
                password:password
            });
        }else{
            return true;
        }
        return false;
    });
    $head_portrait.click((e)=>{
        $pop_up_bar.toggle();
    });
    $("#send-message").click((e)=>{
        let message = sendMessage(socket);
        if(message && connected){
            displayMessage(message);
        }
    });
    $inputMessage.keyup((e)=>{
        if(e.keyCode == 13){
            let message = sendMessage(socket);
            if(message && connected){
                displayMessage(message);
            }
            $inputMessage.val("");
        }
    });
    socket.on('add user state',(data)=>{
        if(data=="success"){
            alert("注册成功，请登录！");
        }else if(data=="failure"){
            alert("用户名重复，请重新注册！");
        }
    });
    socket.on('login state',(data)=>{
        connected = true;
        if(data['login_state']=="success"){
            $('#login-page').hide();
            $('#chat-page').show();
            localStorage.user_id = data['user_id'];
            head_name = data['head_name'];
            $head_portrait.find('img').attr('src',head_name);
            var message = `欢迎${localStorage.username}来到webchat`;
            console.log(message);
            socket.emit("group histroy messages",{
                id:1
            });
        }else if(data=="failure"){
            alert("账户或密码错误，请重新输入！");
        }
    });
    socket.on('new message',(data)=>{
        displayMessage(data);
        console.log(data);
    });
    socket.on('group histroy messages',(data)=>{
        for(item of data){
            displayHistroyMessage(item);
        }
    });
    socket.on('head name',(data)=>{
        $head_portrait.find('img').attr('src',data['head_name']);
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
        var inputMessage = $inputMessage.val().replace('\n',"");
        if(inputMessage == ""){
            return false;
        }else{
            $inputMessage.val('');
            localStorage.message = inputMessage;
            socket.emit('new message',{
                id:1,
                username:localStorage.username,
                message:inputMessage
            });
            return inputMessage;
        }
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
        }
        $content.append($container);
        //让滚动条保持在最下方
        $content[0].scrollTop = $content[0].scrollHeight;
        prePerson = username;
    }
    function displayHistroyMessage(data){
        var $container = $('<div></div>');
        var username,message = "";
        if(data['username'] == localStorage.username){
            $container.removeClass().addClass('mime');
        }else{
            $container.removeClass().addClass('other');
        }
        username = data['username'];
        message = data['message'];
        var $message = $('<p></p>').text("·"+message);
        if(histroyPrePerson == username){
            $container.append($message);
        }else{
            var time = new Date(data['time']).toLocaleString();
            var $time = $('<div></div>').text(time + " " + username);
            $container.append($time).append($message);
        }
        $content.append($container);
        //让滚动条保持在最下方
        $content[0].scrollTop = $content[0].scrollHeight;
        histroyPrePerson = username;
    }

    $('#main-change-head').on('click',()=>{
        $("<link>")
        .attr({ rel: "stylesheet",
        type: "text/css",
        href: "css/cropper.min.css"
        }).appendTo("head");
        $.get('chage-avatar.html',(result)=>{ 
            $pop_up_bar.hide();
            $('body').append(result);
        });
    });
});