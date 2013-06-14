var Catan;
(function (Catan) {
    var TurnState;
    (function (TurnState) {
        TurnState._map = [];
        TurnState._map[0] = "PreRoll";
        TurnState.PreRoll = 0;
        TurnState._map[1] = "PostRoll";
        TurnState.PostRoll = 1;
    })(TurnState || (TurnState = {}));
    var CatanContext = (function () {
        function CatanContext(players) {
            this.players = [];
            for(var i = 0; i < players; i++) {
                this.players[i] = new Player(i);
            }
        }
        return CatanContext;
    })();    
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    })();    
    var ResourceType;
    (function (ResourceType) {
        ResourceType._map = [];
        ResourceType._map[0] = "Grain";
        ResourceType.Grain = 0;
        ResourceType._map[1] = "Coal";
        ResourceType.Coal = 1;
        ResourceType._map[2] = "Wool";
        ResourceType.Wool = 2;
        ResourceType._map[3] = "Wood";
        ResourceType.Wood = 3;
        ResourceType._map[4] = "Brick";
        ResourceType.Brick = 4;
        ResourceType._map[5] = "Desert";
        ResourceType.Desert = 5;
    })(ResourceType || (ResourceType = {}));
    var PlayerColor;
    (function (PlayerColor) {
        PlayerColor._map = [];
        PlayerColor._map[0] = "Red";
        PlayerColor.Red = 0;
        PlayerColor._map[1] = "Blue";
        PlayerColor.Blue = 1;
        PlayerColor._map[2] = "White";
        PlayerColor.White = 2;
        PlayerColor._map[3] = "Green";
        PlayerColor.Green = 3;
        PlayerColor._map[4] = "Orange";
        PlayerColor.Orange = 4;
    })(PlayerColor || (PlayerColor = {}));
    function Shuffle(array) {
        for(var i = 0; i < array.length; i++) {
            var tmp = array[i];
            var swap;
            swap = Math.floor(i + (Math.random() * (array.length - i)));
            array[i] = array[swap];
            array[swap] = tmp;
        }
    }
    var Board = (function () {
        function Board(context) {
            this.hexGrid = [];
            for(var i = 0; i < 5; i++) {
                this.hexGrid[i] = [];
            }
            this.context = context;
            if(context != null) {
                this.sideLength = context.canvas.width / 10;
            }
            var numbers = [
                2, 
                12
            ];
            var index = 2;
            for(var i = 3; i < 12; i++) {
                if(i != 7) {
                    numbers[index] = i;
                    numbers[index + 1] = i;
                    index = index + 2;
                }
            }
            Shuffle(numbers);
            var hexes = [];
            for(var i = 0; i < 3; i++) {
                hexes[i] = new Hex(ResourceType.Brick, numbers[i]);
            }
            for(var i = 0; i < 4; i++) {
                hexes[i + 3] = new Hex(ResourceType.Wood, numbers[i + 3]);
            }
            for(var i = 0; i < 4; i++) {
                hexes[i + 7] = new Hex(ResourceType.Wool, numbers[i + 7]);
            }
            for(var i = 0; i < 4; i++) {
                hexes[i + 11] = new Hex(ResourceType.Grain, numbers[i + 11]);
            }
            for(var i = 0; i < 3; i++) {
                hexes[i + 15] = new Hex(ResourceType.Coal, numbers[i + 15]);
            }
            hexes[18] = new Hex(ResourceType.Desert, -1);
            Shuffle(hexes);
            this.hexGrid[0][2] = hexes[0];
            this.hexGrid[0][3] = hexes[1];
            this.hexGrid[0][4] = hexes[2];
            this.hexGrid[1][1] = hexes[3];
            this.hexGrid[1][2] = hexes[4];
            this.hexGrid[1][3] = hexes[5];
            this.hexGrid[1][4] = hexes[6];
            this.hexGrid[2][0] = hexes[7];
            this.hexGrid[2][1] = hexes[8];
            this.hexGrid[2][2] = hexes[9];
            this.hexGrid[2][3] = hexes[10];
            this.hexGrid[2][4] = hexes[11];
            this.hexGrid[3][0] = hexes[12];
            this.hexGrid[3][1] = hexes[13];
            this.hexGrid[3][2] = hexes[14];
            this.hexGrid[3][3] = hexes[15];
            this.hexGrid[4][0] = hexes[16];
            this.hexGrid[4][1] = hexes[17];
            this.hexGrid[4][2] = hexes[18];
            this.Display();
        }
        Board.prototype.Display = function () {
            if(this.context == null) {
                return;
            }
            this.context.setTransform(1, 0, 0, 1, this.sideLength, this.sideLength);
            for(var i = 0; i < 5; i++) {
                for(var j = 0; j < 5; j++) {
                    var color;
                    if(this.hexGrid[i][j] == null || this.hexGrid[i][j] == undefined) {
                        continue;
                    }
                    var h;
                    switch(this.hexGrid[i][j].type) {
                        case ResourceType.Brick:
                            color = "red";
                            break;
                        case ResourceType.Coal:
                            color = "#111111";
                            break;
                        case ResourceType.Desert:
                            color = "orange";
                            break;
                        case ResourceType.Grain:
                            color = "yellow";
                            break;
                        case ResourceType.Wood:
                            color = "green";
                            break;
                        case ResourceType.Wool:
                            color = "#55ff55";
                            break;
                    }
                    var coords;
                    coords = this.getGridCoordinateFromHexCoordinate(new Point(i * this.sideLength, j * this.sideLength));
                    this.context.beginPath();
                    this.context.arc(coords.x, coords.y, this.sideLength / 2, 0, 2 * Math.PI);
                    this.context.fillStyle = color;
                    this.context.fill();
                    this.context.lineWidth = 1;
                    this.context.stroke();
                    if(this.hexGrid[i][j].rollNumber > 1) {
                        this.context.beginPath();
                        this.context.arc(coords.x, coords.y, this.sideLength / 6, 0, 2 * Math.PI);
                        this.context.fillStyle = "white";
                        this.context.fill();
                        this.context.lineWidth = 1;
                        this.context.stroke();
                        this.context.beginPath();
                        this.context.fillStyle = "black";
                        this.context.fillText(this.hexGrid[i][j].rollNumber, coords.x - (this.sideLength / 12), coords.y + (this.sideLength / 12));
                        this.context.stroke();
                    }
                }
            }
        };
        Board.prototype.getGridCoordinateFromHexCoordinate = function (pos) {
            return new Point(pos.x + pos.y * .5, pos.y * 0.866);
        };
        return Board;
    })();    
    var Player = (function () {
        function Player(color) {
            this.color = color;
            this.resourceCards = [
                0, 
                0, 
                0, 
                0, 
                0
            ];
            this.resourceTypes = [
                ResourceType.Brick, 
                ResourceType.Coal, 
                ResourceType.Grain, 
                ResourceType.Wood, 
                ResourceType.Wool
            ];
        }
        return Player;
    })();    
    var Settlement = (function () {
        function Settlement(owner) {
            this.owner = owner;
            this.city = false;
        }
        Settlement.prototype.Upgrade = function () {
            this.city = true;
        };
        return Settlement;
    })();    
    var Hex = (function () {
        function Hex(type, rollNumber) {
            this.type = type;
            this.rollNumber = rollNumber;
            this.settlementLocations = [
                [
                    null, 
                    null
                ], 
                [
                    null, 
                    null
                ], 
                [
                    null, 
                    null
                ]
            ];
            this.roadLocations = [
                [
                    null, 
                    null
                ], 
                [
                    null, 
                    null
                ], 
                [
                    null, 
                    null
                ]
            ];
        }
        return Hex;
    })();    
    $(document).ready(function () {
        var canvas;
        canvas = $("#board")[0];
        var c = new Board(canvas.getContext("2d"));
    });
})(Catan || (Catan = {}));
//@ sourceMappingURL=Catan.js.map
