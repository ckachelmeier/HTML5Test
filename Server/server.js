define(["require", "exports", "Chess"], function(require, exports, __chess__) {
    /// <reference path="Chess.ts" />
    /// <reference path="references/node.d.ts" />
    //#!/usr/bin/env node
    var chess = __chess__;

    var WebSocketServer = require('websocket').server;
    var http = require('http');
    /*connection.on('message', function (message) {
    if (message.type === 'utf8') {
    console.log('Received Message: ' + message.utf8Data);
    for (var i = 0; i < users.length; i++) {
    if (users[i] != null) {
    users[i].sendUTF(message.utf8Data);
    }
    }
    }
    else if (message.type === 'binary') {
    console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
    connection.sendBytes(message.binaryData);
    }
    });*/
    /*connection.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    for (var i = 0; i < users.length; i++) {
    if (users[i] == connection) {
    users[i] = null;
    }
    }
    });*/
    var ChessLobby = (function () {
        function ChessLobby(port) {
            this.connections = [];
            this.maxConnections = 0;
            this.numberConnected = 0;
            this.server = http.createServer(function (request, response) {
                console.log((new Date()) + ' Received request for ' + request.url);
                response.writeHead(404);
                response.end();
            });
            this.server.listen(port, function () {
                console.log((new Date()) + ' Server is listening on port ' + port);
            });
            this.wsServer = new WebSocketServer({
                httpServer: this.server,
                autoAcceptConnections: // You should not use autoAcceptConnections for production
                // applications, as it defeats all standard cross-origin protection
                // facilities built into the protocol and the browser.  You should
                // *always* verify the connection's origin and decide whether or not
                // to accept it.
                false
            });
            var that = this;
            this.wsServer.on('request', function (request) {
                that.newRequest(request);
            });
        }
        ChessLobby.prototype.closeRequest = function (reasonCode, description, index) {
            var connection = this.connections[index];
            console.log((new Date()) + ' Peer ' + connection.connection.remoteAddress + ' disconnected.');
            this.connections[index] = null;
            var count = 0;
            this.numberConnected--;
            if(index + 1 == this.maxConnections) {
                var i;
                for(i = 0; i < this.maxConnections; i++) {
                    if(this.connections != null) {
                        count++;
                    }
                    if(count == this.numberConnected) {
                        break;
                    }
                }
                this.maxConnections = i;
            }
        };
        ChessLobby.prototype.newRequest = function (request) {
            if(!this.originIsAllowed(request.origin)) {
                // Make sure we only accept requests from an allowed origin
                request.reject();
                console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
                return;
            }
            console.log((new Date()) + ' Connection from origin ' + request.origin + ' not rejected.');
            var connection = request.accept(null, request.origin);
            var index = 0;
            while(this.connections[index]) {
                index++;
            }
            if(index >= this.maxConnections) {
                this.maxConnections = index + 1;
            }
            this.numberConnected++;
            var that = this;
            var newConnection = {
                connection: connection,
                name: ""
            };
            this.connections[index] = newConnection;
            //newConnection.connection = connection;
            //newConnection.name = "";
            connection.on('message', function (message) {
                that.handleMessage(message, index);
            });
            console.log((new Date()) + ' Connection accepted. index: ' + index);
            connection.on('close', function (reasonCode, description) {
                that.closeRequest(reasonCode, description, index);
            });
        };
        ChessLobby.prototype.handleMessage = function (messageWrapper, index) {
            if(messageWrapper.type === 'utf8') {
                var message;
                message = messageWrapper.utf8Data;
                message.indexOf;
                var colonIndex = message.indexOf(":");
                var messageType = colonIndex > 0 ? message.substring(0, colonIndex).trim() : message;
                var messageValue = colonIndex > 0 ? message.substring(colonIndex + 1).trim() : "";
                console.log('Received Message: ' + message);
                console.log("index: " + index);
                switch(messageType) {
                    case "name":
                        this.newUserName(index, messageValue);
                        break;
                    case "lobbyMessage":
                        var toSend = {
                            userName: this.connections[index].name,
                            message: messageValue
                        };
                        //send all users info about the new user name
                        this.sendMessageToLoggedInUsers("lobbyMessage: " + JSON.stringify(toSend));
                        break;
                    case "startGame":
                        if(this.connections[index].inGame) {
                            console.log("Failed starting game for " + this.connections[index].name);
                            this.connections[index].connection.sendUTF("failed: Already in game");
                            break;
                        }
                        var chessServer;
                        chessServer = new chess.Chess.ChessServerContext();
                        chessServer.addConnection(this.connections[index].connection);
                        this.connections[index].chessServer = chessServer;
                        console.log("Created Chess game for " + this.connections[index].name);
                        this.connections[index].inGame = true;
                        this.connections[index].gameFull = false;
                        this.sendRefreshedGamesList();
                        break;
                    case "joinGame":
                        var dashIndex = messageValue.indexOf("-");
                        if(dashIndex < 0) {
                            this.connections[index].connection.sendUTF("failed: Message not in correct format");
                            break;
                        }
                        var gameIndexToJoin = parseInt(messageValue.substring(0, dashIndex));
                        if(this.connections[gameIndexToJoin].gameFull) {
                            this.connections[index].connection.sendUTF("failed: game is full");
                            break;
                        }
                        if(!this.connections[gameIndexToJoin].inGame) {
                            this.connections[index].connection.sendUTF("failed: game doesn't exist");
                            break;
                        }
                        this.connections[index].chessServer = this.connections[gameIndexToJoin].chessServer;
                        this.connections[index].inGame = true;
                        this.connections[index].gameFull = true;
                        this.connections[gameIndexToJoin].gameFull = true;
                        this.connections[index].chessServer.addConnection(this.connections[index].connection);
                        break;
                }
            }
        };
        ChessLobby.prototype.newUserName = function (userIndex, name) {
            for(var i = 0; i < this.maxConnections; i++) {
                if(this.isLoggedIn(this.connections[i]) && this.connections[i].name.toLowerCase() == name.toLowerCase()) {
                    this.connections[i].connection.sendUTF("failed: User Name Taken");
                    return;
                }
            }
            if("" + this.connections[userIndex].name == "") {
                //if the name is currently empty, it's a new user
                this.sendMessageToLoggedInUsers("newUser: " + name);
                console.log(name + " joined");
                //set the user's name
                this.connections[userIndex].name = name;
                var x = {
                    name: name,
                    users: [],
                    games: []
                };
                for(var i = 0; i < this.maxConnections; i++) {
                    if(this.isLoggedIn(this.connections[i])) {
                        x.users[x.users.length] = this.connections[i].name;
                        if(this.connections[i].inGame && this.connections[i].gameFull) {
                            x.games[x.games.length] = {
                                id: i,
                                name: this.connections[i].name
                            };
                        }
                    }
                }
                //send success message with user lists to user.
                this.connections[userIndex].connection.sendUTF("loggedIn:" + JSON.stringify(x));
            } else {
                //if the currently have a name, they're just changing it.
                //this.sendMessageToLoggedInUsers("nameChange: " + this.connections[index].name + "-" + messageValue, index);
                this.connections[userIndex].connection.sendUTF("failed: Can't Change Name");
            }
        };
        ChessLobby.prototype.sendRefreshedGamesList = function () {
            var games = [];
            console.log("max connections: " + this.maxConnections);
            for(var i = 0; i < this.maxConnections; i++) {
                console.log("i: " + i + " : logged in: " + this.isLoggedIn(this.connections[i]) + " : in game: " + this.connections[i].inGame + " : game full: " + this.connections[i].gameFull);
                if(this.isLoggedIn(this.connections[i]) && this.connections[i].inGame && !this.connections[i].gameFull) {
                    games[games.length] = {
                        id: i,
                        name: this.connections[i].name
                    };
                    console.log("here");
                }
            }
            this.sendMessageToLoggedInUsers("gamesList: " + JSON.stringify(games));
        };
        ChessLobby.prototype.sendMessageToLoggedInUsers = function (message, except) {
            if (typeof except === "undefined") { except = -1; }
            console.log("Sending message to users: " + message);
            for(var i = 0; i < this.maxConnections; i++) {
                if(except != i && this.isLoggedIn(this.connections[i])) {
                    this.connections[i].connection.sendUTF(message);
                }
            }
        };
        ChessLobby.prototype.isLoggedIn = function (user) {
            if(user == null) {
                return false;
            }
            if(!user.connection) {
                return false;
            }
            if(!user.name) {
                return false;
            }
            return true;
        };
        ChessLobby.prototype.originIsAllowed = function (origin) {
            // put logic here to detect whether the specified origin is allowed.
            return true;
        };
        return ChessLobby;
    })();    
    var cl = new ChessLobby(8080);
})
//@ sourceMappingURL=server.js.map
