<%@ Page Title="Home Page" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true"
    CodeBehind="Default.aspx.cs" Inherits="Html5Test._Default" %>

<asp:Content runat="server" ID="AdditionalPageHead" ContentPlaceHolderID="HeadContent">
    <title>Web Socket Chat</title>
    <script src="Scripts/jquery-1.7.1.js"></script>
    <script type="text/javascript">
        var ws;
        var server = "ws://localhost:8181/chat"
        $(document).ready(function () {

            // test if the browser supports web sockets
            if ("WebSocket" in window) {
                debug("Browser supports web sockets!", 'success');
            } else {
                debug("Browser does not support web sockets", 'error');
            };

            // function to send data on the web socket
            function ws_send(str) {
                try {
                    ws.send(str);
                } catch (err) {
                    debug(err, 'error');
                }
            }

            // connect to the specified host
            function connect(host, userName) {

                debug("Connecting to " + host + " ...");
                try {
                    ws = new WebSocket(host); // create the web socket
                } catch (err) {
                    debug(err, 'error');
                }
                $('#host_connect').attr('disabled', true); // disable the 'reconnect' button

                ws.onopen = function () {
                    debug("connected... ", 'success'); // we are in! :D
                    ws.send("name:" + userName);
                };

                ws.onmessage = function (evt) {
                    debug(evt.data, 'response'); // we got some data - show it omg!!
                    message = evt.data.split(':');
                    if (message.length > 1) {
                        switch (message[0].toLowerCase()) {
                            case "new user":
                                addNewUser(message[1], message[2]);
                                break;
                            case "username change":
                                changeUserName(message[1], message[2]);
                                break;
                            case "disconnect":
                                disconnectUser(message[1]);
                                break;
                            case "users":
                                json = evt.data.substring(evt.data.indexOf(":") + 1);
                                var userList = JSON.parse(json);
                                generateUserList(userList);
                        }

                    }
                };

                ws.onclose = function () {
                    debug("Socket closed!", 'error'); // the socket was closed (this could be an error or simply that there is no server)
                    $('#host_connect').attr('disabled', false); // re-enable the 'reconnect button
                };
            };
            function generateUserList(users) {
                for (var i = 0; i < users.length; i++) {
                    addNewUser(users[i].userId.trim(), users[i].Name.trim());
                }
            }

            function addNewUser(id, name) {
                $("#opponentSelect").append($("<option></option>")
                    .attr("value", id.trim())
                    .text(name.trim()));
            }
            function changeUserName(id, newName) {
                var option = $('#opponentSelect>[value="' + id.trim() + '"]')
                option.html(newName.trim());
            }

            function disconnectUser(id) {
                var option = $('#opponentSelect>[value="' + id.trim() + '"]').remove();
            }

            // function to display stuff, the second parameter is the class of the <p> (used for styling)
            function debug(msg, type) {
                console.log(msg);
                //$("#console").append('<p class="' + (type || '') + '">' + msg + '</p>');
            };

            // the user clicked to 'reconnect' button
            $('#host_connect').click(function () {
                debug("\n");
                connect(server, $('#userName').val());
            });

            // the user clicked the send button
            $('#console_send').click(function () {
                ws_send("invite:" + $('#opponentSelect').val());
                //ws_send($('#console_input').val());
            });

            $('#console_input').keyup(function (e) {
                if (e.keyCode == 13) // enter is pressed
                    ws_send($('#console_input').val());
            });

        });
    </script>

    <style type="text/css">
        .error
        {
            color: red;
        }

        .success
        {
            color: green;
        }

        #console_wrapper
        {
            background-color: black;
            color: white;
            padding: 5px;
        }

        #console p
        {
            padding: 0;
            margin: 0;
        }
    </style>
</asp:Content>
<asp:Content runat="server" ID="FeaturedContent" ContentPlaceHolderID="FeaturedContent">

</asp:Content>
<asp:Content runat="server" ID="BodyContent" ContentPlaceHolderID="MainContent">
    <h1>Web Socket Chat</h1>
    <div id="server_wrapper">
        <p>
            Join the Lobby: 
		    <input type="text" name="userName" id="userName" value="" />
            <input type="button" name="host_connect" id="host_connect" value="Connect!" />
        </p>
    </div>

    <div id="console_wrapper">
        <select multiple="multiple" id="opponentSelect">

        </select>
        <pre id="console"></pre>
        <%--<input type="text" name="console_input" id="console_input" value="" />--%>
        <input type="button" name="console_send" id="console_send" value="Send Invitation" />
    </div>
</asp:Content>
