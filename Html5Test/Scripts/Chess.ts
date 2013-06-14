/// <reference path="jquery.d.ts" />

var exports = { Chess: {} };

//Module
export module Chess {

    enum GameState {
        CHECK,
        CHECKMATE,
        STALEMATE,
        PLAY
    }
    export class ChessContext {
        private currentTurn: ChessColor;
        private moves: number;
        public board: Board;
        private context: CanvasRenderingContext2D;
        private gameState: GameState;
        constructor(canvas: HTMLCanvasElement) {
            //canvas.onclick = this.handleClick;
            $(canvas).click((event: MouseEvent) => this.handleClick(event));
            this.context = canvas.getContext("2d");
            this.board = new Board(this.context);
            canvas.height = canvas.height + 50;
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
            this.gameState = GameState.PLAY;
            this.Refresh();
        }

        public Refresh() {
            this.board.Display();
            this.context.fillStyle = '#000';
            this.context.font = 'bold 12px sans-serif';
            this.context.fillText("Turn: " + (this.currentTurn == ChessColor.WHITE ? "White" : "Black"), 10, this.board.sideLength + 20, 100);
            this.context.stroke();
            var stateDisplay: string = "";
            switch (this.gameState) {
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
        }

        public handleClick(event: MouseEvent) {
            var p: Position;
            var x: HTMLElement;
            x = $(event.target)[0];
            p = getCursorPosition(event, x);

            selectedPosition = new Position(Math.floor(p.X / this.board.squareLength), Math.floor(p.Y / this.board.squareLength));

            var moved = this.board.tryMove(selectedPosition);

            var selectedPosition: Position;
            if (moved) {
                this.moves++;
                if (this.currentTurn == ChessColor.WHITE)
                    this.currentTurn = ChessColor.BLACK;
                else
                    this.currentTurn = ChessColor.WHITE;
                var check: bool = this.board.isInCheck(this.currentTurn);
                var hasMoves: bool = this.board.playerHasMoves(this.currentTurn);
                this.gameState = GameState.PLAY;
                if (check && hasMoves)
                    this.gameState = GameState.CHECK;
                else if (check && !hasMoves)
                    this.gameState = GameState.CHECKMATE;
                else if (!check && !hasMoves)
                    this.gameState = GameState.STALEMATE;
            } else {
                var selectedPiece: IPiece;
                selectedPiece = this.board.getPieceAtPosition(selectedPosition)
                if (selectedPiece != null && selectedPiece.color == this.currentTurn)
                    this.board.selected = selectedPosition;
            }
            this.Refresh();
        }
    }

    export class ChessClientContext {
        private currentTurn: ChessColor;
        private myColor: ChessColor;
        private moves: number;
        public board: Board;
        private context: CanvasRenderingContext2D;
        private gameState: GameState;
        private started: bool;
        private connection: WebSocket;
        private waitingForResponse: bool;

        constructor(canvas: HTMLCanvasElement) {
            var that = this;
            $(canvas).click((event: MouseEvent) => that.handleClick(event));
            this.context = canvas.getContext("2d");
            this.board = new Board(this.context);
            canvas.height = canvas.height + 50;
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
            this.gameState = GameState.PLAY;
            this.Refresh();
            this.started = false;
            this.waitingForResponse = false;

            //start connection
            this.connection = new WebSocket('ws://localhost:8080', ['soap', 'xmpp']);

            this.connection.onmessage = function (ev) { that.HandleMessage(ev); };
            this.connection.onclose = function (ev: CloseEvent) { that.HandleClose; };
            console.log('starting...');
        }

        private HandleClose(ev: CloseEvent) {
            console.log("Closing...");
        }

        private HandleMessage(ev: any) {
            var message: string;
            message = ev.data;
            console.log(message);
            var index = message.indexOf(":");
            var messageType = message.substring(0, index).trim();
            var messageValue = message.substring(index + 1).trim();
            if (index < 0) {
                messageType = message.trim();
                messageValue = "";
            }
            console.log(messageType);
            console.log(messageValue);
            if (this.started) {
                switch (messageType) {
                    case "accepted":
                        this.HandleMoveAccepted();
                        this.waitingForResponse = false;
                        break;
                    case "rejected":
                        //handle that the move was invalid.
                        this.waitingForResponse = false;
                        this.board.board = JSON.parse(messageValue);
                        alert('Oh Noes!!!');
                        break;
                    case "opponentmove":
                        //get the current state of the game board.
                        this.HandleMoveAccepted();
                        this.board.SetBoard(JSON.parse(messageValue));
                        //this.board.board = JSON.parse(messageValue);
                        this.Refresh();
                        break;
                    default:
                        //throw error. bad message
                    }
                console.log("started: " + this.started);
            } else {
                if (messageType == "color") {
                    if (messageValue.toLowerCase() == "white") {
                        this.myColor = ChessColor.WHITE;
                    } else {
                        this.myColor = ChessColor.BLACK;
                    }
                    this.started = true;
                    console.log("started: " + this.started);
                }
            }
        }

        public Refresh() {
            this.board.Display();
            this.context.fillStyle = '#000';
            this.context.font = 'bold 12px sans-serif';
            this.context.fillText("Turn: " + (this.currentTurn == ChessColor.WHITE ? "White" : "Black"), 10, this.board.sideLength + 20, 100);
            this.context.stroke();
            var stateDisplay: string = "";
            switch (this.gameState) {
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
        }

        private HandleMoveAccepted() {
            this.waitingForResponse = false;
            this.moves++;
            if (this.currentTurn == ChessColor.WHITE)
                this.currentTurn = ChessColor.BLACK;
            else
                this.currentTurn = ChessColor.WHITE;
            var check: bool = this.board.isInCheck(this.currentTurn);
            var hasMoves: bool = this.board.playerHasMoves(this.currentTurn);
            this.gameState = GameState.PLAY;
            if (check && hasMoves)
                this.gameState = GameState.CHECK;
            else if (check && !hasMoves)
                this.gameState = GameState.CHECKMATE;
            else if (!check && !hasMoves)
                this.gameState = GameState.STALEMATE;

        }

        private SendMove(from: Position, to: Position) {
            var message = JSON.stringify([from, to]);
            this.connection.send("move:" + message);
            this.waitingForResponse = true;
        }

        public handleClick(event: MouseEvent) {
            var p: Position;
            var x: HTMLElement;
            //ignore clicks unless the game has started and it's your turn.
            console.log("Started: " + this.started);
            console.log("My Turn: " + (this.currentTurn == this.myColor));
            console.log(this.currentTurn == ChessColor.BLACK ? "Black" : (this.currentTurn == ChessColor.WHITE ? "White" : "not set"));
            console.log(this.myColor == ChessColor.BLACK ? "Black" : (this.myColor == ChessColor.WHITE ? "White" : "not set"));
            console.log("waiting: " + this.waitingForResponse);
            if (!this.started || this.currentTurn != this.myColor || this.waitingForResponse)
                return;
            x = $(event.target)[0];
            p = getCursorPosition(event, x);

            selectedPosition = new Position(Math.floor(p.X / this.board.squareLength), Math.floor(p.Y / this.board.squareLength));

            var from = this.board.selected;

            var moved = this.board.tryMove(selectedPosition);

            var selectedPosition: Position;
            if (moved) {
                this.SendMove(from, selectedPosition);
            } else {
                var selectedPiece: IPiece;
                selectedPiece = this.board.getPieceAtPosition(selectedPosition)
                if (selectedPiece != null && selectedPiece.color == this.currentTurn)
                    this.board.selected = selectedPosition;
            }
            this.Refresh();
        }
    }

    export class ChessClientContext2 {
        private currentTurn: ChessColor;
        private myColor: ChessColor;
        private moves: number;
        public board: Board;
        private context: CanvasRenderingContext2D;
        private gameState: GameState;
        private started: bool;
        private connection: WebSocket;
        private waitingForResponse: bool;

        constructor(canvas: HTMLCanvasElement) {
            var that = this;
            $(canvas).click((event: MouseEvent) => that.handleClick(event));
            this.context = canvas.getContext("2d");
            this.board = new Board(this.context);
            canvas.height = canvas.height + 50;
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
            this.gameState = GameState.PLAY;
            this.Refresh();
            this.started = false;
            this.waitingForResponse = false;

            //start connection

            this.connection = new WebSocket('ws://localhost:8081', ['soap', 'xmpp']);

            this.connection.onmessage = function (ev) { that.HandleMessage(ev); };
            this.connection.onclose = function (ev: CloseEvent) { that.HandleClose; };
            console.log('starting...');
        }

        private HandleClose(ev: CloseEvent) {
            console.log("Closing...");
        }

        private HandleMessage(ev: any) {
            var message: string;
            message = ev.data;
            console.log(message);
            var index = message.indexOf(":");
            var messageType = message.substring(0, index).trim();
            var messageValue = message.substring(index + 1).trim();
            if (index < 0) {
                messageType = message.trim();
                messageValue = "";
            }
            console.log(messageType);
            console.log(messageValue);
            if (this.started) {
                switch (messageType) {
                    case "accepted":
                        this.HandleMoveAccepted();
                        this.waitingForResponse = false;
                        break;
                    case "rejected":
                        //handle that the move was invalid.
                        this.waitingForResponse = false;
                        this.board.board = JSON.parse(messageValue);
                        alert('Oh Noes!!!');
                        break;
                    case "opponentmove":
                        //get the current state of the game board.
                        this.HandleMoveAccepted();
                        this.board.SetBoard(JSON.parse(messageValue));
                        //this.board.board = JSON.parse(messageValue);
                        this.Refresh();
                        break;
                    default:
                        //throw error. bad message
                    }
                console.log("started: " + this.started);
            } else {
                if (messageType == "color") {
                    if (messageValue.toLowerCase() == "white") {
                        this.myColor = ChessColor.WHITE;
                    } else {
                        this.myColor = ChessColor.BLACK;
                    }
                    this.started = true;
                    console.log("started: " + this.started);
                }
            }
        }

        public Refresh() {
            this.board.Display();
            this.context.fillStyle = '#000';
            this.context.font = 'bold 12px sans-serif';
            this.context.fillText("Turn: " + (this.currentTurn == ChessColor.WHITE ? "White" : "Black"), 10, this.board.sideLength + 20, 100);
            this.context.stroke();
            var stateDisplay: string = "";
            switch (this.gameState) {
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
        }

        private HandleMoveAccepted() {
            this.waitingForResponse = false;
            this.moves++;
            if (this.currentTurn == ChessColor.WHITE)
                this.currentTurn = ChessColor.BLACK;
            else
                this.currentTurn = ChessColor.WHITE;
            var check: bool = this.board.isInCheck(this.currentTurn);
            var hasMoves: bool = this.board.playerHasMoves(this.currentTurn);
            this.gameState = GameState.PLAY;
            if (check && hasMoves)
                this.gameState = GameState.CHECK;
            else if (check && !hasMoves)
                this.gameState = GameState.CHECKMATE;
            else if (!check && !hasMoves)
                this.gameState = GameState.STALEMATE;

        }

        private SendMove(from: Position, to: Position) {
            var message = JSON.stringify([from, to]);
            this.connection.send("move:" + message);
            this.waitingForResponse = true;
        }

        public handleClick(event: MouseEvent) {
            var p: Position;
            var x: HTMLElement;
            //ignore clicks unless the game has started and it's your turn.
            console.log("Started: " + this.started);
            console.log("My Turn: " + (this.currentTurn == this.myColor));
            console.log(this.currentTurn == ChessColor.BLACK ? "Black" : (this.currentTurn == ChessColor.WHITE ? "White" : "not set"));
            console.log(this.myColor == ChessColor.BLACK ? "Black" : (this.myColor == ChessColor.WHITE ? "White" : "not set"));
            console.log("waiting: " + this.waitingForResponse);
            if (!this.started || this.currentTurn != this.myColor || this.waitingForResponse)
                return;
            x = $(event.target)[0];
            p = getCursorPosition(event, x);

            selectedPosition = new Position(Math.floor(p.X / this.board.squareLength), Math.floor(p.Y / this.board.squareLength));

            var from = this.board.selected;

            var moved = this.board.tryMove(selectedPosition);

            var selectedPosition: Position;
            if (moved) {
                this.SendMove(from, selectedPosition);
            } else {
                var selectedPiece: IPiece;
                selectedPiece = this.board.getPieceAtPosition(selectedPosition)
                if (selectedPiece != null && selectedPiece.color == this.currentTurn)
                    this.board.selected = selectedPosition;
            }
            this.Refresh();
        }
    }



    export class Board {
        public board;
        public sideLength: number;
        public squareLength: number;
        public selected: Position;
        private context: CanvasRenderingContext2D;

        constructor(context: CanvasRenderingContext2D) {
            this.board = new Array(8);
            for (var i = 0; i < 8; i++) {
                this.board[i] = new Array(8);
            }
            this.selected = null;
            this.context = context;
            if (context != null) {
                if (context.canvas.width < context.canvas.height) {
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

            //add pawns
            for (var j = 0; j < 8; j++) {
                this.board[1][j] = new Pawn(ChessColor.WHITE, new Position(1, j), this.squareLength);
                this.board[6][j] = new Pawn(ChessColor.BLACK, new Position(6, j), this.squareLength);
            }
            //add the rest of the pieces.
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

        public checkMoveForCheck(from: Position, move: Position, kingColor: ChessColor): bool {
            console.log("checkMoveForCheck: " + from.X + "," + from.Y + " " + move.X + "," + move.Y + ": " + (ChessColor.WHITE == kingColor ? "White" : "Black"));
            var piece: IPiece;
            if (this.getPieceAtPosition(from) == null)
                return false;
            else
                piece = this.getPieceAtPosition(from);
            var capturedPiece: IPiece = this.getPieceAtPosition(move);
            this.board[move.X][move.Y] = piece;
            this.board[piece.position.X][piece.position.Y] = null;
            piece.position = move;
            var result: bool = this.isInCheck(kingColor);

            this.board[move.X][move.Y] = capturedPiece;
            this.board[from.X][from.Y] = piece;
            piece.position = from;
            return result;
        }

        public isInCheck(color: ChessColor): bool {
            console.log("isInCheck: " + (ChessColor.WHITE == color ? "White" : "Black"));
            var kingPosition: Position;
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    var king: IPiece;
                    king = this.board[i][j];
                    if (king != null && king.type == ChessPieceType.King && king.color == color) {
                        kingPosition = king.position;
                    }
                }
            }
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    var piece: IPiece;
                    piece = this.board[i][j];
                    if (piece != null && piece.color != color) {
                        var moves = piece.GetValidMoves(this, false);
                        for (var k = 0; k < moves.length; k++) {
                            if (kingPosition.X == moves[k].X && kingPosition.Y == moves[k].Y) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }

        public playerHasMoves(color: ChessColor) {
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    var piece: IPiece = this.board[i][j];
                    if (piece != null && piece.color == color) {
                        var moves = piece.GetValidMoves(this, true);
                        if (moves != null && moves.length > 0)
                            return true;
                    }
                }
            }
            return false;
        }

        ///if it's a valid move, the selected piece will move the the new position.
        ///If the piece has moved, it will return true.  Otherwise it returns false.
        public tryMove(to: Position): bool {
            var selectedPiece: IPiece;
            if (this.selected != null) {
                selectedPiece = this.getPieceAtPosition(this.selected);
                var moves = selectedPiece.GetValidMoves(this, true);
                if (moves != null) {
                    for (var i = 0; i < moves.length; i++) {
                        if (moves[i].X == to.X && moves[i].Y == to.Y) {
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
        }

        public getPieceAtPosition(position: Position) {
            if (position.X >= 0 && position.X < 8 &&
                position.Y >= 0 && position.Y < 8)
                return this.board[position.X][position.Y];
        }

        public Display(): void {
            //clear
            if (this.context == null)
                return;
            this.context.canvas.height = this.context.canvas.height;
            //
            if (this.selected != null) {
                this.context.fillStyle = "#F00";
                this.context.fillRect(this.selected.X * this.squareLength, this.selected.Y * this.squareLength, this.squareLength, this.squareLength);
                this.context.fillStyle = "#0F0";
                if (this.board[this.selected.X][this.selected.Y] != null) {
                    var moves = this.board[this.selected.X][this.selected.Y].GetValidMoves(this, true);
                    if (moves != null) {
                        for (var i = 0; i < moves.length; i++) {
                            this.context.fillRect(moves[i].X * this.squareLength, moves[i].Y * this.squareLength, this.squareLength, this.squareLength);
                        }
                    }
                }
            }
            this.context.stroke();
            //display grid
            this.context.beginPath();
            for (var i = 0; i < 9; i++) {
                this.context.moveTo(0, i * this.squareLength + 0.5);
                this.context.fillText("y: " + i * this.squareLength, 10, i * this.squareLength + 10);
                this.context.lineTo(this.sideLength, i * this.squareLength + 0.5);
                this.context.moveTo(i * this.squareLength + 0.5, 0);
                this.context.fillText("x: " + i * this.squareLength, i * this.squareLength + 10, 10);
                this.context.lineTo(i * this.squareLength + 0.5, this.sideLength);
            }

            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    if (this.board[i][j] != undefined) {
                        this.board[i][j].Display(this.context);
                    }
                }
            }

            this.context.closePath();
            this.context.lineWidth = 1;
            this.context.stroke();
        };

        public SetBoard(newBoard) {
            for (var i = 0; i < 8; i++) {
                var disp = "";
                for (var j = 0; j < 8; j++) {
                    if (newBoard[i][j] == null) {
                        this.board[i][j] = null;
                        disp += "X";
                    } else {
                        var piece: IPiece;
                        var newPiece: IPiece;
                        piece = newBoard[i][j];
                        switch (piece.type) {
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
    }

    function getCursorPosition(e: MouseEvent, gCanvasElement: HTMLElement) {
        //returns Cell with .row and .column properties 
        var x;
        var y;
        if (e.pageX != undefined && e.pageY != undefined) {
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

    export enum ChessColor {
        BLACK,
        WHITE,
    }
    export class Position {
        X: number;
        Y: number;
        constructor(X?: number, Y?: number) {
            this.X = X;
            this.Y = Y;
        }
    }
    enum ChessPieceType {
        Pawn,
        Rook,
        Knight,
        Bishop,
        Queen,
        King
    }

    interface IPiece {
        type: ChessPieceType;
        position: Position;
        color: ChessColor;
        size: number;
        hasMoved: bool;

        GetValidMoves(board: Board, trimCheck: bool);

        Display(context, scale: number): void;
    }

    function setContextColor(piece: IPiece, context: CanvasRenderingContext2D) {
        if (piece.color == ChessColor.BLACK) {
            context.fillStyle = '#000';
            context.font = 'bold 12px sans-serif';
        } else {
            context.fillStyle = '#222';
            context.font = '12px sans-serif';
        }
    }

    ///Chess Pieces
    class Pawn implements IPiece {
        type: ChessPieceType;
        hasMoved: bool;
        constructor(public color: ChessColor, public position: Position, public size: number) {
            this.position = position;
            this.color = color;
            this.size = size;
            this.hasMoved = false;
            this.type = ChessPieceType.Pawn;
        }

        private getRelativePosition(xDifference: number, yDifference: number, board: Board): Position {
            if (this.color == ChessColor.WHITE) {
                return new Position(this.position.X + xDifference, this.position.Y + yDifference);
            } else {
                return new Position(this.position.X - xDifference, this.position.Y + yDifference);
            }
        }

        GetValidMoves(board: Board, trimCheck: bool = true) {
            console.log("Get moves Pawn: " + trimCheck);
            var moves = [];
            var movePosition: Position;
            var piece: IPiece;
            movePosition = this.getRelativePosition(1, 0, board);
            piece = board.getPieceAtPosition(movePosition);
            if (piece == null) {
                if (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))
                    moves[moves.length] = movePosition;
                movePosition = this.getRelativePosition(2, 0, board);
                piece = board.getPieceAtPosition(movePosition);
                if (!this.hasMoved && piece == null &&
                    (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                    moves[moves.length] = movePosition;
                }
            }
            if (this.position.Y > 0) {
                movePosition = this.getRelativePosition(1, -1, board);
                piece = board.getPieceAtPosition(movePosition);
                if (piece != null && piece.color != this.color &&
                    (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                    moves[moves.length] = movePosition;
                }
            }
            if (this.position.Y < 7) {
                movePosition = this.getRelativePosition(1, 1, board);
                piece = board.getPieceAtPosition(movePosition);
                if (piece != null && piece.color != this.color &&
                    (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                    moves[moves.length] = movePosition;
                }
            }
            return moves;
        }

        Display(context: CanvasRenderingContext2D): void {
            setContextColor(this, context);
            context.fillText("PAWN", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        }
    }

    class IDirectionalPiece implements IPiece {
        type: ChessPieceType;
        hasMoved: bool;
        constructor(public color: ChessColor, public position: Position, public size: number) {
            this.position = position;
            this.color = color;
            this.size = size;
            this.hasMoved = false;
        }

        GetValidMovesInDirection(xChange: number, yChange: number, board: Board, trimCheck: bool = true) {
            var moves = [];
            var keepGoing = true;
            var xOffset = xChange;
            var yOffset = yChange;
            while (keepGoing) {
                var nextPiece: IPiece;
                var movePosition: Position = movePosition = new Position(this.position.X + xOffset, this.position.Y + yOffset);
                if (movePosition.X >= 0 && movePosition.X < 8 &&
                    movePosition.Y >= 0 && movePosition.Y < 8) {
                    nextPiece = board.getPieceAtPosition(movePosition);
                    keepGoing = nextPiece == null;
                    if ((nextPiece == null || nextPiece.color != this.color) &&
                        (!trimCheck || !board.checkMoveForCheck(this.position, movePosition, this.color))) {
                        moves[moves.length] = movePosition;
                    }
                    xOffset = xOffset + xChange;
                    yOffset = yOffset + yChange;
                } else {
                    keepGoing = false;
                }
            }
            return moves;
        }

        GetValidMoves(board: Board, trimCheck: bool = false) { }

        Display(context: CanvasRenderingContext2D): void {
        }
    }

    class Rook extends IDirectionalPiece {
        hasMoved: bool;
        constructor(public color: ChessColor, public position: Position, public size: number) {
            super(color, position, size);
            this.type = ChessPieceType.Rook;
        }

        GetValidMoves(board: Board, trimCheck: bool = true) {
            console.log("Get moves rook: " + trimCheck);
            var moves = [];

            moves = this.GetValidMovesInDirection(1, 0, board, trimCheck);
            moves = moves.concat(this.GetValidMovesInDirection(-1, 0, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(0, 1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(0, -1, board, trimCheck));
            return moves;
        }

        Display(context: CanvasRenderingContext2D): void {
            setContextColor(this, context);
            context.fillText("ROOK", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        }
    }

    class Bishop extends IDirectionalPiece {
        constructor(public color: ChessColor, public position: Position, public size: number) {
            super(color, position, size);
            this.type = ChessPieceType.Bishop;
        }
        GetValidMoves(board: Board, trimCheck: bool = true) {
            console.log("Get moves Bishop: " + trimCheck);
            var moves = [];
            moves = this.GetValidMovesInDirection(1, 1, board, trimCheck);
            moves = moves.concat(this.GetValidMovesInDirection(-1, 1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(1, -1, board, trimCheck));
            moves = moves.concat(this.GetValidMovesInDirection(-1, -1, board, trimCheck));
            return moves;
        }

        Display(context: CanvasRenderingContext2D): void {
            setContextColor(this, context);
            context.fillText("BISHOP", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        }
    }

    class Queen extends IDirectionalPiece {
        constructor(public color: ChessColor, public position: Position, public size: number) {
            super(color, position, size);
            this.type = ChessPieceType.Queen;
        }
        GetValidMoves(board: Board, trimCheck: bool = true) {
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
        }

        Display(context: CanvasRenderingContext2D): void {
            setContextColor(this, context);
            context.fillText("QUEEN", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        }
    }

    class IJumperPiece implements IPiece {
        type: ChessPieceType;
        hasMoved: bool;
        constructor(public color: ChessColor, public position: Position, public size: number) {
            this.position = position;
            this.color = color;
            this.size = size;
            this.hasMoved = false;
        }

        MoveIsValid(xOffset: number, yOffset: number, board: Board, trimCheck: bool = true): bool {
            if (this.position.X + xOffset >= 0 && this.position.X + xOffset < 8 &&
                this.position.Y + yOffset >= 0 && this.position.Y + yOffset < 8) {
                var piece: IPiece;
                piece = board.board[this.position.X + xOffset][this.position.Y + yOffset];
                return (piece == null || piece.color != this.color) &&
                    (!trimCheck || !board.checkMoveForCheck(this.position, new Position(this.position.X + xOffset, this.position.Y + yOffset), this.color));
            }
            return false;
        }

        GetValidMoves(board: Board, trimCheck: bool = true) {
        }

        Display(context: CanvasRenderingContext2D): void { }
    }

    class King extends IJumperPiece {
        constructor(public color: ChessColor, public position: Position, public size: number) {
            super(color, position, size);
            this.type = ChessPieceType.King;
        }
        GetValidMoves(board: Board, trimCheck: bool = true) {
            console.log("Get moves King: " + trimCheck);
            var moves = [];
            if (this.MoveIsValid(1, 1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y + 1);
            if (this.MoveIsValid(1, 0, board, trimCheck))
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y);
            if (this.MoveIsValid(1, -1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y - 1);
            if (this.MoveIsValid(0, 1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X, this.position.Y + 1);
            if (this.MoveIsValid(0, -1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X, this.position.Y - 1);
            if (this.MoveIsValid(-1, 1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y + 1);
            if (this.MoveIsValid(-1, 0, board, trimCheck))
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y);
            if (this.MoveIsValid(-1, -1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y - 1);
            return moves;
        }

        Display(context: CanvasRenderingContext2D): void {
            setContextColor(this, context);
            context.fillText("KING", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        }
    }

    class Knight extends IJumperPiece {
        constructor(public color: ChessColor, public position: Position, public size: number) {
            super(color, position, size);
            this.type = ChessPieceType.Knight;
        }
        GetValidMoves(board: Board, trimCheck: bool = true) {
            console.log("Get moves Knight: " + trimCheck);
            var moves = [];
            if (this.MoveIsValid(2, 1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X + 2, this.position.Y + 1);
            if (this.MoveIsValid(2, -1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X + 2, this.position.Y - 1);
            if (this.MoveIsValid(-2, 1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X - 2, this.position.Y + 1);
            if (this.MoveIsValid(-2, -1, board, trimCheck))
                moves[moves.length] = new Position(this.position.X - 2, this.position.Y - 1);
            if (this.MoveIsValid(1, 2, board, trimCheck))
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y + 2);
            if (this.MoveIsValid(1, -2, board, trimCheck))
                moves[moves.length] = new Position(this.position.X + 1, this.position.Y - 2);
            if (this.MoveIsValid(-1, 2, board, trimCheck))
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y + 2);
            if (this.MoveIsValid(-1, -2, board, trimCheck))
                moves[moves.length] = new Position(this.position.X - 1, this.position.Y - 2);
            return moves;
        }

        Display(context: CanvasRenderingContext2D): void {
            setContextColor(this, context);
            context.fillText("KNIGHT", this.position.X * this.size + this.size / 4, this.position.Y * this.size + this.size / 4);
            context.stroke();
        }
    }

    export class ChessServerContext {
        private connections;
        private currentTurn: ChessColor;
        private moves: number;
        public board: Board;
        private context: CanvasRenderingContext2D;
        //private gameState: GameState;

        constructor() {
            this.connections = [];
            this.board = new Board(this.context);
            this.moves = 0;
            this.currentTurn = ChessColor.WHITE;
            //this.gameState = GameState.PLAY;
        }

        public addConnection(connection) {
            var index: number;
            if (this.connections[0] == null) {
                this.connections[0] = connection;
                index = 0;
            } else if (this.connections[1] == null) {
                index = 1;
                this.connections[1] = connection;
                this.connections[0].sendUTF("color:white");
                this.connections[1].sendUTF("color:black");
            }
            var that = this;
            connection.on('message', function (message) { that.handleMessage(message, index); });
        }

        private handleMessage(messageWrapper, connectionIndex: number) {
            if (messageWrapper.type === 'utf8') {
                var message: string;
                message = messageWrapper.utf8Data;
                message.indexOf
                var index = message.indexOf(":");
                var messageType = message.substring(0, index).trim();
                var messageValue = message.substring(index + 1);
                console.log('Received Message: ' + message);
                //for (var i = 0; i < this.connections.length; i++) {
                //    if (this.connections[i] != null) {
                //        this.connections[i].sendUTF(message.utf8Data);
                //    }
                //}
                switch (messageType) {
                    case "move":
                        var from: Position;
                        var to: Position;
                        var p = JSON.parse(messageValue.trim());
                        from = p[0];
                        to = p[1];
                        if (this.validateMove(from, to)) {
                            this.connections[connectionIndex].sendUTF("accepted");
                            this.connections[(connectionIndex + 1) % 2].sendUTF("opponentmove:" + JSON.stringify(this.board.board));
                        } else {
                            this.connections[connectionIndex].sendUTF("rejected:" + JSON.stringify(this.board.board));
                        }
                        break;
                }
            }
        }

        private sendGameState(connection) {
            //to be implemented
        }

        private sendMoveConfirmation(connection) {
            connection.sendUTF("accepted");
        }

        private validateMove(from: Position, to: Position): bool {
            this.board.selected = from; //this.board.getPieceAtPosition(from);
            console.log("X: " + from.X + ", Y: " + from.Y);
            console.log("X: " + to.X + ", Y: " + to.Y);

            var succeeded: bool;
            succeeded = this.board.tryMove(to);
            return succeeded;
        }
    }
    
    enum LoggedInState{
        LoggedOff,
        LoggingIn,
        LoggedIn
    }

    export class LobbyClient {
        private connection: WebSocket;
        private loggedInState: LoggedInState;

        private uiEvents;
        private users;
        private openGames;
        private gamesStarted;
        public onLoggedIn: Function;
        public onLobbyMessage: Function;
        public onNewUser: Function;
        public onGamesListRefresh: Function;

        private chessContext: ChessClientContext;

        constructor() {
            var that = this;
            this.connection = new WebSocket('ws://localhost:8080', ['soap', 'xmpp']);
            this.connection.onmessage = function (ev) { that.HandleMessage(ev); };
            this.connection.onclose = function (ev: CloseEvent) { that.HandleClose; };
            console.log('starting...');
            this.loggedInState = LoggedInState.LoggedOff;
        }

        private HandleClose(ev: CloseEvent) {
            console.log("Closing...");
        }

        private HandleMessage(ev: any) {
            var message: string;
            message = ev.data;
            console.log(message);
            var index = message.indexOf(":");
            var messageType = message.substring(0, index).trim();
            var messageValue = message.substring(index + 1).trim();
            if (index < 0) {
                messageType = message.trim();
                messageValue = "";
            }
            console.log(messageType);
            console.log(messageValue);
            if (messageType == "lobbyMessage") {
                var params = JSON.parse(messageValue);
                this.onLobbyMessage(params.userName, params.message);
            }
            if (this.loggedInState == LoggedInState.LoggedIn) {
                this.handleLoggedInMessage(messageType, messageValue);
            } else {
                this.handleLoggedOutMessage(messageType, messageValue);
            }
        }

        handleLoggedInMessage(messageType: string, messageValue: string) {
            switch (messageType) {
                case "newUser":
                    this.onNewUser(messageValue);
                    break;
                case "gamesList":
                    this.onGamesListRefresh(JSON.parse(messageValue));
                default:
                    //throw error. bad message
                }
        }
        handleLoggedOutMessage(messageType: string, messageValue: string) {
            switch (messageType) {
                case "loggedIn":
                    this.loggedInState = LoggedInState.LoggedIn;
                    var x = JSON.parse(messageValue);
                    this.onLoggedIn(x.name, x.users, x.games);
                    break;
                case "failed":
                    //handle case where log in failed.
                    this.loggedInState = LoggedInState.LoggedOff;
                    break;

            }
        }

        public LogIn(name: string) {
            this.connection.send("name: " + name);
            this.loggedInState = LoggedInState.LoggingIn;
        }

        public sendMessage(message: string) {
            this.connection.send("lobbyMessage:" + message);
        }

        public startGame(canvas: HTMLCanvasElement) {
            this.connection.send("startGame");
            this.chessContext = new ChessClientContext(canvas, this.connection);
        }

    }

    //$(document).ready(function () {
    //    var canvas: HTMLCanvasElement;
    //    canvas = < HTMLCanvasElement > $("#board")[0];
    //    var c = new ChessContext(canvas);
    //    var c = new ChessClientContext(canvas);
    //});
}

//var lobbyClient: Chess.LobbyClient;
//var uiEvent: Chess.UIEvents;
//uiEvent = new Chess.UIEvents;
//lobbyClient = new Chess.LobbyClient();