var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var exports = {
    Chess: {
    }
};
(function (Chess) {
    var GameState;
    (function (GameState) {
        GameState._map = [];
        GameState._map[0] = "CHECK";
        GameState.CHECK = 0;
        GameState._map[1] = "CHECKMATE";
        GameState.CHECKMATE = 1;
        GameState._map[2] = "STALEMATE";
        GameState.STALEMATE = 2;
        GameState._map[3] = "PLAY";
        GameState.PLAY = 3;
    })(GameState || (GameState = {}));
    var ChessContext = (function () {
        function ChessContext(canvas) {
            var _this = this;
            $(canvas).click(function (event) {
                return _this.handleClick(event);
            });
            this.context = canvas.getContext("2d");
            this.board = new Board(this.context);
            canvas.height = canvas.height + 50;
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
            this.gameState = GameState.PLAY;
            this.Refresh();
        }
        ChessContext.prototype.Refresh = function () {
            this.board.Display();
            this.context.fillStyle = '#000';
            this.context.font = 'bold 12px sans-serif';
            this.context.fillText("Turn: " + (this.currentTurn == ChessColor.WHITE ? "White" : "Black"), 10, this.board.sideLength + 20, 100);
            this.context.stroke();
            var stateDisplay = "";
            switch(this.gameState) {
                case GameState.CHECK:
                    stateDisplay = "Check";
                    break;
                case GameState.CHECKMATE:
                    stateDisplay = "Checkmate.  Game over";
                    break;
                case GameState.STALEMATE:
                    stateDisplay = "Stalemate";
                    break;
            }
            this.context.fillText(stateDisplay, 200, this.board.sideLength + 20);
        };
        ChessContext.prototype.handleClick = function (event) {
            var p;
            var x;
            x = $(event.target)[0];
            p = getCursorPosition(event, x);
            selectedPosition = new Position(Math.floor(p.X / this.board.squareLength), Math.floor(p.Y / this.board.squareLength));
            var moved = this.board.tryMove(selectedPosition);
            var selectedPosition;
            if(moved) {
                this.moves++;
                if(this.currentTurn == ChessColor.WHITE) {
                    this.currentTurn = ChessColor.BLACK;
                } else {
                    this.currentTurn = ChessColor.WHITE;
                }
                var check = this.board.isInCheck(this.currentTurn);
                var hasMoves = this.board.playerHasMoves(this.currentTurn);
                this.gameState = GameState.PLAY;
                if(check && hasMoves) {
                    this.gameState = GameState.CHECK;
                } else if(check && !hasMoves) {
                    this.gameState = GameState.CHECKMATE;
                } else if(!check && !hasMoves) {
                    this.gameState = GameState.STALEMATE;
                }
            } else {
                var selectedPiece;
                selectedPiece = this.board.getPieceAtPosition(selectedPosition);
                if(selectedPiece != null && selectedPiece.color == this.currentTurn) {
                    this.board.selected = selectedPosition;
                }
            }
            this.Refresh();
        };
        return ChessContext;
    })();
    Chess.ChessContext = ChessContext;    
    var ChessClientContext = (function () {
        function ChessClientContext(canvas) {
            var that = this;
            $(canvas).click(function (event) {
                return that.handleClick(event);
            });
            this.context = canvas.getContext("2d");
            this.board = new Board(this.context);
            canvas.height = canvas.height + 50;
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
            this.gameState = GameState.PLAY;
            this.Refresh();
            this.started = false;
            this.waitingForResponse = false;
            this.connection = new WebSocket('ws://localhost:8080', [
                'soap', 
                'xmpp'
            ]);
            this.connection.onmessage = function (ev) {
                that.HandleMessage(ev);
            };
            this.connection.onclose = function (ev) {
                that.HandleClose;
            };
            console.log('starting...');
        }
        ChessClientContext.prototype.HandleClose = function (ev) {
            console.log("Closing...");
        };
        ChessClientContext.prototype.HandleMessage = function (ev) {
            var message;
            message = ev.data;
            console.log(message);
            var index = message.indexOf(":");
            var messageType = message.substring(0, index).trim();
            var messageValue = message.substring(index + 1).trim();
            if(index < 0) {
                messageType = message.trim();
                messageValue = "";
            }
            console.log(messageType);
            console.log(messageValue);
            if(this.started) {
                switch(messageType) {
                    case "accepted":
                        this.HandleMoveAccepted();
                        this.waitingForResponse = false;
                        break;
                    case "rejected":
                        this.waitingForResponse = false;
                        this.board.board = JSON.parse(messageValue);
                        alert('Oh Noes!!!');
                        break;
                    case "opponentmove":
                        this.HandleMoveAccepted();
                        this.board.SetBoard(JSON.parse(messageValue));
                        this.Refresh();
                        break;
                    default:
                }
                console.log("started: " + this.started);
            } else {
                if(messageType == "color") {
                    if(messageValue.toLowerCase() == "white") {
                        this.myColor = ChessColor.WHITE;
                    } else {
                        this.myColor = ChessColor.BLACK;
                    }
                    this.started = true;
                    console.log("started: " + this.started);
                }
            }
        };
        ChessClientContext.prototype.Refresh = function () {
            this.board.Display();
            this.context.fillStyle = '#000';
            this.context.font = 'bold 12px sans-serif';
            this.context.fillText("Turn: " + (this.currentTurn == ChessColor.WHITE ? "White" : "Black"), 10, this.board.sideLength + 20, 100);
            this.context.stroke();
            var stateDisplay = "";
            switch(this.gameState) {
                case GameState.CHECK:
                    stateDisplay = "Check";
                    break;
                case GameState.CHECKMATE:
                    stateDisplay = "Checkmate.  Game over";
                    break;
                case GameState.STALEMATE:
                    stateDisplay = "Stalemate";
                    break;
            }
            this.context.fillText(stateDisplay, 200, this.board.sideLength + 20);
        };
        ChessClientContext.prototype.HandleMoveAccepted = function () {
            this.waitingForResponse = false;
            this.moves++;
            if(this.currentTurn == ChessColor.WHITE) {
                this.currentTurn = ChessColor.BLACK;
            } else {
                this.currentTurn = ChessColor.WHITE;
            }
            var check = this.board.isInCheck(this.currentTurn);
            var hasMoves = this.board.playerHasMoves(this.currentTurn);
            this.gameState = GameState.PLAY;
            if(check && hasMoves) {
                this.gameState = GameState.CHECK;
            } else if(check && !hasMoves) {
                this.gameState = GameState.CHECKMATE;
            } else if(!check && !hasMoves) {
                this.gameState = GameState.STALEMATE;
            }
        };
        ChessClientContext.prototype.SendMove = function (from, to) {
            var message = JSON.stringify([
                from, 
                to
            ]);
            this.connection.send("move:" + message);
            this.waitingForResponse = true;
        };
        ChessClientContext.prototype.handleClick = function (event) {
            var p;
            var x;
            console.log("Started: " + this.started);
            console.log("My Turn: " + (this.currentTurn == this.myColor));
            console.log(this.currentTurn == ChessColor.BLACK ? "Black" : (this.currentTurn == ChessColor.WHITE ? "White" : "not set"));
            console.log(this.myColor == ChessColor.BLACK ? "Black" : (this.myColor == ChessColor.WHITE ? "White" : "not set"));
            console.log("waiting: " + this.waitingForResponse);
            if(!this.started || this.currentTurn != this.myColor || this.waitingForResponse) {
                return;
            }
            x = $(event.target)[0];
            p = getCursorPosition(event, x);
            selectedPosition = new Position(Math.floor(p.X / this.board.squareLength), Math.floor(p.Y / this.board.squareLength));
            var from = this.board.selected;
            var moved = this.board.tryMove(selectedPosition);
            var selectedPosition;
            if(moved) {
                this.SendMove(from, selectedPosition);
            } else {
                var selectedPiece;
                selectedPiece = this.board.getPieceAtPosition(selectedPosition);
                if(selectedPiece != null && selectedPiece.color == this.currentTurn) {
                    this.board.selected = selectedPosition;
                }
            }
            this.Refresh();
        };
        return ChessClientContext;
    })();
    Chess.ChessClientContext = ChessClientContext;    
    var ChessClientContext2 = (function () {
        function ChessClientContext2(canvas) {
            var that = this;
            $(canvas).click(function (event) {
                return that.handleClick(event);
            });
            this.context = canvas.getContext("2d");
            this.board = new Board(this.context);
            canvas.height = canvas.height + 50;
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
            this.gameState = GameState.PLAY;
            this.Refresh();
            this.started = false;
            this.waitingForResponse = false;
            this.connection = new WebSocket('ws://localhost:8081', [
                'soap', 
                'xmpp'
            ]);
            this.connection.onmessage = function (ev) {
                that.HandleMessage(ev);
            };
            this.connection.onclose = function (ev) {
                that.HandleClose;
            };
            console.log('starting...');
        }
        ChessClientContext2.prototype.HandleClose = function (ev) {
            console.log("Closing...");
        };
        ChessClientContext2.prototype.HandleMessage = function (ev) {
            var message;
            message = ev.data;
            console.log(message);
            var index = message.indexOf(":");
            var messageType = message.substring(0, index).trim();
            var messageValue = message.substring(index + 1).trim();
            if(index < 0) {
                messageType = message.trim();
                messageValue = "";
            }
            console.log(messageType);
            console.log(messageValue);
            if(this.started) {
                switch(messageType) {
                    case "accepted":
                        this.HandleMoveAccepted();
                        this.waitingForResponse = false;
                        break;
                    case "rejected":
                        this.waitingForResponse = false;
                        this.board.board = JSON.parse(messageValue);
                        alert('Oh Noes!!!');
                        break;
                    case "opponentmove":
                        this.HandleMoveAccepted();
                        this.board.SetBoard(JSON.parse(messageValue));
                        this.Refresh();
                        break;
                    default:
                }
                console.log("started: " + this.started);
            } else {
                if(messageType == "color") {
                    if(messageValue.toLowerCase() == "white") {
                        this.myColor = ChessColor.WHITE;
                    } else {
                        this.myColor = ChessColor.BLACK;
                    }
                    this.started = true;
                    console.log("started: " + this.started);
                }
            }
        };
        ChessClientContext2.prototype.Refresh = function () {
            this.board.Display();
            this.context.fillStyle = '#000';
            this.context.font = 'bold 12px sans-serif';
            this.context.fillText("Turn: " + (this.currentTurn == ChessColor.WHITE ? "White" : "Black"), 10, this.board.sideLength + 20, 100);
            this.context.stroke();
            var stateDisplay = "";
            switch(this.gameState) {
                case GameState.CHECK:
                    stateDisplay = "Check";
                    break;
                case GameState.CHECKMATE:
                    stateDisplay = "Checkmate.  Game over";
                    break;
                case GameState.STALEMATE:
                    stateDisplay = "Stalemate";
                    break;
            }
            this.context.fillText(stateDisplay, 200, this.board.sideLength + 20);
        };
        ChessClientContext2.prototype.HandleMoveAccepted = function () {
            this.waitingForResponse = false;
            this.moves++;
            if(this.currentTurn == ChessColor.WHITE) {
                this.currentTurn = ChessColor.BLACK;
            } else {
                this.currentTurn = ChessColor.WHITE;
            }
            var check = this.board.isInCheck(this.currentTurn);
            var hasMoves = this.board.playerHasMoves(this.currentTurn);
            this.gameState = GameState.PLAY;
            if(check && hasMoves) {
                this.gameState = GameState.CHECK;
            } else if(check && !hasMoves) {
                this.gameState = GameState.CHECKMATE;
            } else if(!check && !hasMoves) {
                this.gameState = GameState.STALEMATE;
            }
        };
        ChessClientContext2.prototype.SendMove = function (from, to) {
            var message = JSON.stringify([
                from, 
                to
            ]);
            this.connection.send("move:" + message);
            this.waitingForResponse = true;
        };
        ChessClientContext2.prototype.handleClick = function (event) {
            var p;
            var x;
            console.log("Started: " + this.started);
            console.log("My Turn: " + (this.currentTurn == this.myColor));
            console.log(this.currentTurn == ChessColor.BLACK ? "Black" : (this.currentTurn == ChessColor.WHITE ? "White" : "not set"));
            console.log(this.myColor == ChessColor.BLACK ? "Black" : (this.myColor == ChessColor.WHITE ? "White" : "not set"));
            console.log("waiting: " + this.waitingForResponse);
            if(!this.started || this.currentTurn != this.myColor || this.waitingForResponse) {
                return;
            }
            x = $(event.target)[0];
            p = getCursorPosition(event, x);
            selectedPosition = new Position(Math.floor(p.X / this.board.squareLength), Math.floor(p.Y / this.board.squareLength));
            var from = this.board.selected;
            var moved = this.board.tryMove(selectedPosition);
            var selectedPosition;
            if(moved) {
                this.SendMove(from, selectedPosition);
            } else {
                var selectedPiece;
                selectedPiece = this.board.getPieceAtPosition(selectedPosition);
                if(selectedPiece != null && selectedPiece.color == this.currentTurn) {
                    this.board.selected = selectedPosition;
                }
            }
            this.Refresh();
        };
        return ChessClientContext2;
    })();
    Chess.ChessClientContext2 = ChessClientContext2;    
    var Board = (function () {
        function Board(context) {
            this.board = new Array(8);
            for(var i = 0; i < 8; i++) {
                this.board[i] = new Array(8);
            }
            this.selected = null;
            this.context = context;
            if(context != null) {
                if(context.canvas.width < context.canvas.height) {
                    this.sideLength = context.canvas.width;
                } else {
                    this.sideLength = context.canvas.height;
                }
                this.context.canvas.width = this.sideLength + 1;
                this.context.canvas.height = this.sideLength + 1;
                this.squareLength = this.sideLength / 8;
                console.log(this.squareLength);
                console.log(this.sideLength);
            }
            for(var j = 0; j < 8; j++) {
                this.board[1][j] = new Pawn(ChessColor.WHITE, new Position(1, j), this.squareLength);
                this.board[6][j] = new Pawn(ChessColor.BLACK, new Position(6, j), this.squareLength);
            }
            this.board[0][0] = new Rook(ChessColor.WHITE, new Position(0, 0), this.squareLength);
            this.board[0][1] = new Knight(ChessColor.WHITE, new Position(0, 1), this.squareLength);
            this.board[0][2] = new Bishop(ChessColor.WHITE, new Position(0, 2), this.squareLength);
            this.board[0][3] = new Queen(ChessColor.WHITE, new Position(0, 3), this.squareLength);
            this.board[0][4] = new King(ChessColor.WHITE, new Position(0, 4), this.squareLength);
            this.board[0][5] = new Bishop(ChessColor.WHITE, new Position(0, 5), this.squareLength);
            this.board[0][6] = new Knight(ChessColor.WHITE, new Position(0, 6), this.squareLength);
            this.board[0][7] = new Rook(ChessColor.WHITE, new Position(0, 7), this.squareLength);
            this.board[7][0] = new Rook(ChessColor.BLACK, new Position(7, 0), this.squareLength);
            this.board[7][1] = new Knight(ChessColor.BLACK, new Position(7, 1), this.squareLength);
            this.board[7][2] = new Bishop(ChessColor.BLACK, new Position(7, 2), this.squareLength);
            this.board[7][3] = new Queen(ChessColor.BLACK, new Position(7, 3), this.squareLength);
            this.board[7][4] = new King(ChessColor.BLACK, new Position(7, 4), this.squareLength);
            this.board[7][5] = new Bishop(ChessColor.BLACK, new Position(7, 5), this.squareLength);
            this.board[7][6] = new Knight(ChessColor.BLACK, new Position(7, 6), this.squareLength);
            this.board[7][7] = new Rook(ChessColor.BLACK, new Position(7, 7), this.squareLength);
            this.Display();
        }
        Board.prototype.checkMoveForCheck = function (from, move, kingColor) {
            console.log("checkMoveForCheck: " + from.X + "," + from.Y + " " + move.X + "," + move.Y + ": " + (ChessColor.WHITE == kingColor ? "White" : "Black"));
            var piece;
            if(this.getPieceAtPosition(from) == null) {
                return false;
            } else {
                piece = this.getPieceAtPosition(from);
            }
            var capturedPiece = this.getPieceAtPosition(move);
            this.board[move.X][move.Y] = piece;
            this.board[piece.position.X][piece.position.Y] = null;
            piece.position = move;
            var result = this.isInCheck(kingColor);
            this.board[move.X][move.Y] = capturedPiece;
            this.board[from.X][from.Y] = piece;
            piece.position = from;
            return result;
        };
        Board.prototype.isInCheck = function (color) {
            console.log("isInCheck: " + (ChessColor.WHITE == color ? "White" : "Black"));
            var kingPosition;
            for(var i = 0; i < 8; i++) {
                for(var j = 0; j < 8; j++) {
                    var king;
                    king = this.board[i][j];
                    if(king != null && king.type == ChessPieceType.King && king.color == color) {
                        kingPosition = king.position;
                    }
                }
            }
            for(var i = 0; i < 8; i++) {
                for(var j = 0; j < 8; j++) {
                    var piece;
                    piece = this.board[i][j];
                    if(piece != null && piece.color != color) {
                        var moves = piece.GetValidMoves(this, false);
                        for(var k = 0; k < moves.length; k++) {
                            if(kingPosition.X == moves[k].X && kingPosition.Y == moves[k].Y) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        };
        Board.prototype.playerHasMoves = function (color) {
            for(var i = 0; i < 8; i++) {
                for(var j = 0; j < 8; j++) {
                    var piece = this.board[i][j];
                    if(piece != null && piece.color == color) {
                        var moves = piece.GetValidMoves(this, true);
                        if(moves != null && moves.length > 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        Board.prototype.tryMove = function (to) {
            var selectedPiece;
            if(this.selected != null) {
                selectedPiece = this.getPieceAtPosition(this.selected);
                var moves = selectedPiece.GetValidMoves(this, true);
                if(moves != null) {
                    for(var i = 0; i < moves.length; i++) {
                        if(moves[i].X == to.X && moves[i].Y == to.Y) {
                            this.board[to.X][to.Y] = this.board[this.selected.X][this.selected.Y];
                            selectedPiece.position = to;
                            selectedPiece.hasMoved = true;
                            this.board[this.selected.X][this.selected.Y] = null;
                            this.selected = null;
                            return true;
                        }
                    }
                }
            }
            return false;
        };
        Board.prototype.getPieceAtPosition = function (position) {
            if(position.X >= 0 && position.X < 8 && position.Y >= 0 && position.Y < 8) {
                return this.board[position.X][position.Y];
            }
        };
        Board.prototype.Display = function () {
            if(this.context == null) {
                return;
            }
            this.context.canvas.height = this.context.canvas.height;
            if(this.selected != null) {
                this.context.fillStyle = "#F00";
                this.context.fillRect(this.selected.X * this.squareLength, this.selected.Y * this.squareLength, this.squareLength, this.squareLength);
                this.context.fillStyle = "#0F0";
                if(this.board[this.selected.X][this.selected.Y] != null) {
                    var moves = this.board[this.selected.X][this.selected.Y].GetValidMoves(this, true);
                    if(moves != null) {
                        for(var i = 0; i < moves.length; i++) {
                            this.context.fillRect(moves[i].X * this.squareLength, moves[i].Y * this.squareLength, this.squareLength, this.squareLength);
                        }
                    }
                }
            }
            this.context.stroke();
            this.context.beginPath();
            for(var i = 0; i < 9; i++) {
                this.context.moveTo(0, i * this.squareLength + 0.5);
                this.context.fillText("y: " + i * this.squareLength, 10, i * this.squareLength + 10);
                this.context.lineTo(this.sideLength, i * this.squareLength + 0.5);
                this.context.moveTo(i * this.squareLength + 0.5, 0);
                this.context.fillText("x: " + i * this.squareLength, i * this.squareLength + 10, 10);
                this.context.lineTo(i * this.squareLength + 0.5, this.sideLength);
            }
            for(var i = 0; i < 8; i++) {
                for(var j = 0; j < 8; j++) {
                    if(this.board[i][j] != undefined) {
                        this.board[i][j].Display(this.context);
                    }
                }
            }
            this.context.closePath();
            this.context.lineWidth = 1;
            this.context.stroke();
        };
        Board.prototype.SetBoard = function (newBoard) {
            for(var i = 0; i < 8; i++) {
                var disp = "";
                for(var j = 0; j < 8; j++) {
                    if(newBoard[i][j] == null) {
                        this.board[i][j] = null;
                        disp += "X";
                    } else {
                        var piece;
                        var newPiece;
                        piece = newBoard[i][j];
                        switch(piece.type) {
                            case ChessPieceType.Bishop:
                                newPiece = new Bishop(piece.color, piece.position, this.squareLength);
                                disp += "B";
                                break;
                            case ChessPieceType.King:
                                newPiece = new King(piece.color, piece.position, this.squareLength);
                                disp += "K";
                                break;
                            case ChessPieceType.Knight:
                                newPiece = new Knight(piece.color, piece.position, this.squareLength);
                                disp += "K";
                                break;
                            case ChessPieceType.Pawn:
                                newPiece = new Pawn(piece.color, piece.position, this.squareLength);
                                disp += "P";
                                break;
                            case ChessPieceType.Queen:
                                newPiece = new Queen(piece.color, piece.position, this.squareLength);
                                disp += "Q";
                                break;
                            case ChessPieceType.Rook:
                                newPiece = new Rook(piece.color, piece.position, this.squareLength);
                                disp += "Q";
                                break;
                            default:
                                disp += ":";
                        }
                        newPiece.hasMoved = piece.hasMoved;
                        this.board[i][j] = newPiece;
                    }
                }
                console.log(disp);
            }
        };
        return Board;
    })();
    Chess.Board = Board;    
    function getCursorPosition(e, gCanvasElement) {
        var x;
        var y;
        if(e.pageX != undefined && e.pageY != undefined) {
            x = e.pageX;
            y = e.pageY;
        } else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        x -= gCanvasElement.offsetLeft;
        y -= gCanvasElement.offsetTop;
        return new Position(x, y);
    }
    (function (ChessColor) {
        ChessColor._map = [];
        ChessColor._map[0] = "BLACK";
        ChessColor.BLACK = 0;
        ChessColor._map[1] = "WHITE";
        ChessColor.WHITE = 1;
    })(Chess.ChessColor || (Chess.ChessColor = {}));
    var ChessColor = Chess.ChessColor;
    var Position = (function () {
        function Position(X, Y) {
            this.X = X;
            this.Y = Y;
        }
        return Position;
    })();
    Chess.Position = Position;    
    var ChessPieceType;
    (function (ChessPieceType) {
        ChessPieceType._map = [];
        ChessPieceType._map[0] = "Pawn";
        ChessPieceType.Pawn = 0;
        ChessPieceType._map[1] = "Rook";
        ChessPieceType.Rook = 1;
        ChessPieceType._map[2] = "Knight";
        ChessPieceType.Knight = 2;
        ChessPieceType._map[3] = "Bishop";
        ChessPieceType.Bishop = 3;
        ChessPieceType._map[4] = "Queen";
        ChessPieceType.Queen = 4;
        ChessPieceType._map[5] = "King";
        ChessPieceType.King = 5;
    })(ChessPieceType || (ChessPieceType = {}));
    function setContextColor(piece, context) {
        if(piece.color == ChessColor.BLACK) {
            context.fillStyle = '#000';
            context.font = 'bold 12px sans-serif';
        } else {
            context.fillStyle = '#222';
            context.font = '12px sans-serif';
        }
    }
    var Pawn = (function () {
        function Pawn(color, position, size) {
            this.color = color;
            this.position = position;
            this.size = size;
            this.position = position;
            this.color = color;
            this.size = size;
            this.hasMoved = false;
            this.type = ChessPieceType.Pawn;
        }
        Pawn.prototype.getRelativePosition = function (xDifference, yDifference, board) {
            if(this.color == ChessColor.WHITE) {
                return new Position(this.position.X + xDifference, this.position.Y + yDifference);
            } else {
                return new Position(this.position.X - xDifference, this.position.Y + yDifference);
            }
        };
        Pawn.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            console.log("Get moves Pawn: " + trimCheck);
            var moves = [];
            var movePosition;
            var piece;
            movePosition = this.getRelativePosition(1, 0, board);
            piece = board.getPieceAtPosition(movePosition);
            if(piece == null) {
                if(!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color)) {
                    moves[moves.length] = movePosition;
                }
                movePosition = this.getRelativePosition(2, 0, board);
                piece = board.getPieceAtPosition(movePosition);
                if(!this.hasMoved && piece == null && (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                    moves[moves.length] = movePosition;
                }
            }
            if(this.position.Y > 0) {
                movePosition = this.getRelativePosition(1, -1, board);
                piece = board.getPieceAtPosition(movePosition);
                if(piece != null && piece.color != this.color && (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                    moves[moves.length] = movePosition;
                }
            }
            if(this.position.Y < 7) {
                movePosition = this.getRelativePosition(1, 1, board);
                piece = board.getPieceAtPosition(movePosition);
                if(piece != null && piece.color != this.color && (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                    moves[moves.length] = movePosition;
                }
            }
            return moves;
        };
        Pawn.prototype.Display = function (context) {
            setContextColor(this, context);
            context.fillText("PAWN", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        };
        return Pawn;
    })();    
    var IDirectionalPiece = (function () {
        function IDirectionalPiece(color, position, size) {
            this.color = color;
            this.position = position;
            this.size = size;
            this.position = position;
            this.color = color;
            this.size = size;
            this.hasMoved = false;
        }
        IDirectionalPiece.prototype.GetValidMovesInDirection = function (xChange, yChange, board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            var moves = [];
            var keepGoing = true;
            var xOffset = xChange;
            var yOffset = yChange;
            while(keepGoing) {
                var nextPiece;
                var movePosition = movePosition = new Position(this.position.X + xOffset, this.position.Y + yOffset);
                if(movePosition.X >= 0 && movePosition.X < 8 && movePosition.Y >= 0 && movePosition.Y < 8) {
                    nextPiece = board.getPieceAtPosition(movePosition);
                    keepGoing = nextPiece == null;
                    if((nextPiece == null || nextPiece.color != this.color) && (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                        moves[moves.length] = movePosition;
                    }
                    xOffset = xOffset + xChange;
                    yOffset = yOffset + yChange;
                } else {
                    keepGoing = false;
                }
            }
            return moves;
        };
        IDirectionalPiece.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = false; }
        };
        IDirectionalPiece.prototype.Display = function (context) {
        };
        return IDirectionalPiece;
    })();    
    var Rook = (function (_super) {
        __extends(Rook, _super);
        function Rook(color, position, size) {
                _super.call(this, color, position, size);
            this.color = color;
            this.position = position;
            this.size = size;
            this.type = ChessPieceType.Rook;
        }
        Rook.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            console.log("Get moves rook: " + trimCheck);
            var moves = [];
            moves = this.GetValidMovesInDirection(1, 0, board, trimCheck);
            moves = moves.concat(this.GetValidMovesInDirection(-1, 0, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(0, 1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(0, -1, board, trimCheck));
            return moves;
        };
        Rook.prototype.Display = function (context) {
            setContextColor(this, context);
            context.fillText("ROOK", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        };
        return Rook;
    })(IDirectionalPiece);    
    var Bishop = (function (_super) {
        __extends(Bishop, _super);
        function Bishop(color, position, size) {
                _super.call(this, color, position, size);
            this.color = color;
            this.position = position;
            this.size = size;
            this.type = ChessPieceType.Bishop;
        }
        Bishop.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            console.log("Get moves Bishop: " + trimCheck);
            var moves = [];
            moves = this.GetValidMovesInDirection(1, 1, board, trimCheck);
            moves = moves.concat(this.GetValidMovesInDirection(-1, 1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(1, -1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(-1, -1, board, trimCheck));
            return moves;
        };
        Bishop.prototype.Display = function (context) {
            setContextColor(this, context);
            context.fillText("BISHOP", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        };
        return Bishop;
    })(IDirectionalPiece);    
    var Queen = (function (_super) {
        __extends(Queen, _super);
        function Queen(color, position, size) {
                _super.call(this, color, position, size);
            this.color = color;
            this.position = position;
            this.size = size;
            this.type = ChessPieceType.Queen;
        }
        Queen.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            console.log("Get moves Queen: " + trimCheck);
            var moves = [];
            moves = this.GetValidMovesInDirection(1, 0, board, trimCheck);
            moves = moves.concat(this.GetValidMovesInDirection(-1, 0, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(0, 1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(0, -1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(1, 1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(-1, 1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(1, -1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(-1, -1, board, trimCheck));
            return moves;
        };
        Queen.prototype.Display = function (context) {
            setContextColor(this, context);
            context.fillText("QUEEN", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        };
        return Queen;
    })(IDirectionalPiece);    
    var IJumperPiece = (function () {
        function IJumperPiece(color, position, size) {
            this.color = color;
            this.position = position;
            this.size = size;
            this.position = position;
            this.color = color;
            this.size = size;
            this.hasMoved = false;
        }
        IJumperPiece.prototype.MoveIsValid = function (xOffset, yOffset, board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            if(this.position.X + xOffset >= 0 && this.position.X + xOffset < 8 && this.position.Y + yOffset >= 0 && this.position.Y + yOffset < 8) {
                var piece;
                piece = board.board[this.position.X + xOffset][this.position.Y + yOffset];
                return (piece == null || piece.color != this.color) && (!trimCheck || !board.checkMoveForCheck(this.position, new Position(this.position.X + xOffset, this.position.Y + yOffset), this.color));
            }
            return false;
        };
        IJumperPiece.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
        };
        IJumperPiece.prototype.Display = function (context) {
        };
        return IJumperPiece;
    })();    
    var King = (function (_super) {
        __extends(King, _super);
        function King(color, position, size) {
                _super.call(this, color, position, size);
            this.color = color;
            this.position = position;
            this.size = size;
            this.type = ChessPieceType.King;
        }
        King.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            console.log("Get moves King: " + trimCheck);
            var moves = [];
            if(this.MoveIsValid(1, 1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y + 1);
            }
            if(this.MoveIsValid(1, 0, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y);
            }
            if(this.MoveIsValid(1, -1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y - 1);
            }
            if(this.MoveIsValid(0, 1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X, this.position.Y + 1);
            }
            if(this.MoveIsValid(0, -1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X, this.position.Y - 1);
            }
            if(this.MoveIsValid(-1, 1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y + 1);
            }
            if(this.MoveIsValid(-1, 0, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y);
            }
            if(this.MoveIsValid(-1, -1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y - 1);
            }
            return moves;
        };
        King.prototype.Display = function (context) {
            setContextColor(this, context);
            context.fillText("KING", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        };
        return King;
    })(IJumperPiece);    
    var Knight = (function (_super) {
        __extends(Knight, _super);
        function Knight(color, position, size) {
                _super.call(this, color, position, size);
            this.color = color;
            this.position = position;
            this.size = size;
            this.type = ChessPieceType.Knight;
        }
        Knight.prototype.GetValidMoves = function (board, trimCheck) {
            if (typeof trimCheck === "undefined") { trimCheck = true; }
            console.log("Get moves Knight: " + trimCheck);
            var moves = [];
            if(this.MoveIsValid(2, 1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X + 2, this.position.Y + 1);
            }
            if(this.MoveIsValid(2, -1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X + 2, this.position.Y - 1);
            }
            if(this.MoveIsValid(-2, 1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X - 2, this.position.Y + 1);
            }
            if(this.MoveIsValid(-2, -1, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X - 2, this.position.Y - 1);
            }
            if(this.MoveIsValid(1, 2, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y + 2);
            }
            if(this.MoveIsValid(1, -2, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y - 2);
            }
            if(this.MoveIsValid(-1, 2, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y + 2);
            }
            if(this.MoveIsValid(-1, -2, board, trimCheck)) {
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y - 2);
            }
            return moves;
        };
        Knight.prototype.Display = function (context) {
            setContextColor(this, context);
            context.fillText("KNIGHT", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        };
        return Knight;
    })(IJumperPiece);    
    var ChessServerContext = (function () {
        function ChessServerContext() {
            this.connections = [];
            this.board = new Board(this.context);
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
        }
        ChessServerContext.prototype.addConnection = function (connection) {
            var index;
            if(this.connections[0] == null) {
                this.connections[0] = connection;
                index = 0;
            } else if(this.connections[1] == null) {
                index = 1;
                this.connections[1] = connection;
                this.connections[0].sendUTF("color:white");
                this.connections[1].sendUTF("color:black");
            }
            var that = this;
            connection.on('message', function (message) {
                that.handleMessage(message, index);
            });
        };
        ChessServerContext.prototype.handleMessage = function (messageWrapper, connectionIndex) {
            if(messageWrapper.type === 'utf8') {
                var message;
                message = messageWrapper.utf8Data;
                message.indexOf;
                var index = message.indexOf(":");
                var messageType = message.substring(0, index).trim();
                var messageValue = message.substring(index + 1);
                console.log('Received Message: ' + message);
                switch(messageType) {
                    case "move":
                        var from;
                        var to;
                        var p = JSON.parse(messageValue.trim());
                        from = p[0];
                        to = p[1];
                        if(this.validateMove(from, to)) {
                            this.connections[connectionIndex].sendUTF("accepted");
                            this.connections[(connectionIndex + 1) % 2].sendUTF("opponentmove:" + JSON.stringify(this.board.board));
                        } else {
                            this.connections[connectionIndex].sendUTF("rejected:" + JSON.stringify(this.board.board));
                        }
                        break;
                }
            }
        };
        ChessServerContext.prototype.sendGameState = function (connection) {
        };
        ChessServerContext.prototype.sendMoveConfirmation = function (connection) {
            connection.sendUTF("accepted");
        };
        ChessServerContext.prototype.validateMove = function (from, to) {
            this.board.selected = from;
            console.log("X: " + from.X + ", Y: " + from.Y);
            console.log("X: " + to.X + ", Y: " + to.Y);
            var succeeded;
            succeeded = this.board.tryMove(to);
            return succeeded;
        };
        return ChessServerContext;
    })();
    Chess.ChessServerContext = ChessServerContext;    
    var LoggedInState;
    (function (LoggedInState) {
        LoggedInState._map = [];
        LoggedInState._map[0] = "LoggedOff";
        LoggedInState.LoggedOff = 0;
        LoggedInState._map[1] = "LoggingIn";
        LoggedInState.LoggingIn = 1;
        LoggedInState._map[2] = "LoggedIn";
        LoggedInState.LoggedIn = 2;
    })(LoggedInState || (LoggedInState = {}));
    var LobbyClient = (function () {
        function LobbyClient() {
            var that = this;
            this.connection = new WebSocket('ws://localhost:8080', [
                'soap', 
                'xmpp'
            ]);
            this.connection.onmessage = function (ev) {
                that.HandleMessage(ev);
            };
            this.connection.onclose = function (ev) {
                that.HandleClose;
            };
            console.log('starting...');
            this.loggedInState = LoggedInState.LoggedOff;
        }
        LobbyClient.prototype.HandleClose = function (ev) {
            console.log("Closing...");
        };
        LobbyClient.prototype.HandleMessage = function (ev) {
            var message;
            message = ev.data;
            console.log(message);
            var index = message.indexOf(":");
            var messageType = message.substring(0, index).trim();
            var messageValue = message.substring(index + 1).trim();
            if(index < 0) {
                messageType = message.trim();
                messageValue = "";
            }
            console.log(messageType);
            console.log(messageValue);
            if(messageType == "lobbyMessage") {
                var params = JSON.parse(messageValue);
                this.onLobbyMessage(params.userName, params.message);
            }
            if(this.loggedInState == LoggedInState.LoggedIn) {
                this.handleLoggedInMessage(messageType, messageValue);
            } else {
                this.handleLoggedOutMessage(messageType, messageValue);
            }
        };
        LobbyClient.prototype.handleLoggedInMessage = function (messageType, messageValue) {
            switch(messageType) {
                case "newUser":
                    this.onNewUser(messageValue);
                    break;
                case "gamesList":
                    this.onGamesListRefresh(JSON.parse(messageValue));
                default:
            }
        };
        LobbyClient.prototype.handleLoggedOutMessage = function (messageType, messageValue) {
            switch(messageType) {
                case "loggedIn":
                    this.loggedInState = LoggedInState.LoggedIn;
                    var x = JSON.parse(messageValue);
                    this.onLoggedIn(x.name, x.users, x.games);
                    break;
                case "failed":
                    this.loggedInState = LoggedInState.LoggedOff;
                    break;
            }
        };
        LobbyClient.prototype.LogIn = function (name) {
            this.connection.send("name: " + name);
            this.loggedInState = LoggedInState.LoggingIn;
        };
        LobbyClient.prototype.sendMessage = function (message) {
            this.connection.send("lobbyMessage:" + message);
        };
        LobbyClient.prototype.startGame = function (canvas) {
            this.connection.send("startGame");
            this.chessContext = new ChessClientContext(canvas, this.connection);
        };
        return LobbyClient;
    })();
    Chess.LobbyClient = LobbyClient;    
})(exports.Chess || (exports.Chess = {}));
var Chess = exports.Chess;
