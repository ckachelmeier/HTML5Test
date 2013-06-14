<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Chess.aspx.cs" Inherits="Html5Test.Chess" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Chess</title>
    <script src="Scripts/jquery-1.7.1.js"></script>
    <script src="Scripts/Chess.js"></script>
    <script>
        function handleLogIn(userName, userList, gameList) {
            $("#lobbyJoin").hide("slow");
            $("#userChatDisplay").show("slow");
            $("welcomeMessage").html("Welcome " + userName + "!");
            $("#chatLog").html("");
            console.log(userList);
            console.log(gameList);
            handleUserListRefresh(userList);
            handleGameListRefresh(gameList);
        }

        function handleUserListRefresh(userList) {
            for (var i = 0; i < userList.length; i++) {
                console.log(userList[i]);
                var name = userList[i];
                $('<option/>').val(name).text(name).appendTo($('#users'));
            }
        }

        function handleGameListRefresh(gameList) {
            for (var i = 0; i < gameList.length; i++) {
                var name = gameList[i].name;
                id = gameList[i].id;
                $('<option/>').val(id).text(name).appendTo($('#openGames'));
            }
        }

        function handleLobbyMessage(userName, message) {
            $("#chatLog").append($("<div>").html(userName + ": " + message));
        }

        function handleNewUser(userName) {
            $('<option/>').val(userName).text(userName).appendTo($('#users'));
            $("#chatLog").append($("<div>").html(userName + " has joined the lobby"));
        }

        var lobbyClient;
        $(document).ready(function () {
            lobbyClient = new exports.Chess.LobbyClient();
            lobbyClient.onLoggedIn = handleLogIn;
            lobbyClient.onLobbyMessage = handleLobbyMessage;
            lobbyClient.onNewUser = handleNewUser;
            lobbyClient.onGamesListRefresh = handleGameListRefresh;
            $("#btnName").click(function () {
                var name = $("#name").val();
                if (name)
                    lobbyClient.LogIn(name);
            });
            $("#btnChat").click(function () {
                var message = $("#chat").val();
                if (message)
                    lobbyClient.sendMessage(message);
            });
            $("#btnStartGame").click(function () {
                lobbyClient.startGame($("#board")[0]);
            });
            $("#btnJoinGame").click(function () {
                lobbyClient.startGame($("#board")[0]);
            });
        });

    </script>
</head>
<body>
    <form id="form1" runat="server">
        <div style="margin-left: 50px;">
            <div id="lobbyJoin">
                <label>Name:</label><input id="name" />
                <input type="button" id="btnName" value="Join" />
            </div>
            <div id="userChatDisplay" style="display: none;">
                <div id="welcomeMessage"></div>
                <div id="chatLog" style="overflow: scroll; width: 600px; height: 200px; background-color: green;"></div>
                <div>
                    <input id="chat" />
                    <input type="button" id="btnChat" value="Submit" />
                </div>
                <div>
                    <select id="users" multiple="multiple"></select>
                    <select id="openGames" multiple="multiple"></select>
                </div>
                <input type="button" id="btnStartGame" value="Start Game" />
                <input type="button" id="btnJoinGame" value="Join Game" />
            </div>
            <canvas id="board" width="640" height="640"></canvas>
        </div>
    </form>
</body>
</html>
