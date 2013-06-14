<%@ Page Title="Contact" Language="C#" MasterPageFile="~/Site.Master" AutoEventWireup="true" CodeBehind="Contact.aspx.cs" Inherits="Html5Test.Contact" %>
<asp:Content runat="server" ID="Header" ContentPlaceHolderID="HeadContent">
    <script type="text/javascript" src="Scripts/jquery-1.7.1.min.js"></script>
    <script type="text/javascript" src="Scripts/jquery-ui-1.8.20.min.js"></script>
</asp:Content>
<asp:Content runat="server" ID="BodyContent" ContentPlaceHolderID="MainContent">
    <hgroup class="title">
        <h1 test="+++++"><%: Title %>.</h1>
        <h2>Your contact page.</h2>
    </hgroup>
    <style>
        h1:before
        {
            content: "----";
        }

        h1:after
        {
            content: "(" attr(test) ")";
        }
        input[type=range]:before { content: attr(min); padding-right: 50px; }  
        input[type=range]:after { content: attr(max); padding-left: 50px; }

        canvas
        {
            border: 1px dotted black;
        }

    </style>
    <canvas id="canvas" width="300" height="225">

    </canvas>
    <label>Pen size:</label><input id="penSize" value="10"/>
    <input type="button" onclick="setPenSize();" />

    <script>
        var penSize = 0;
        var mouseDown = false;
        var previousCoords = null;
        var context = null;

        function setPenSize(){
            penSize = parseInt($("#penSize").val());
            context.lineWidth = penSize;
        }

        function draw_rect(x, y) {
            context.beginPath();
            if (!mouseDown) {
                console.log(penSize);
            } else {
                context.moveTo(previousCoords.x, previousCoords.y);
            }
            context.lineTo(x, y);
            context.closePath();
            context.lineWidth = penSize;
            context.stroke();
            previousCoords = {x: x,y: y};

            context.beginPath();
            context.lineWidth = 1;
            //console.log("drawing" + Math.PI * 2);
            context.arc(x, y, penSize/2, 0, Math.PI * 2);
            context.closePath();
            context.fill();
            //b_context.fillRect(x-canvasWidth/2, y-canvasHeight/2, canvasWidth, canvasHeight);
        }

        $(document).ready(function () {
            var canvas = document.getElementById("canvas");
            context = canvas.getContext("2d");

            $("#canvas").mousedown(function (e) {
                console.log("mousedown");
                var coords = getCursorPosition(e, this);
                draw_rect(coords.x, coords.y);
                mouseDown = true;
            });

            $("#canvas").mouseup(function (e) {
                console.log("mouseup");
                mouseDown = false;
            });

            $("#canvas").mousemove(function (e) {
                //console.log(mouseDown);
                if (mouseDown) {
                    var coords = getCursorPosition(e, this);
                    draw_rect(coords.x, coords.y);
                }
            });

            setPenSize();
        });

        function getCursorPosition(e, gCanvasElement) {
            /* returns Cell with .row and .column properties */
            var x;
            var y;
            if (e.pageX != undefined && e.pageY != undefined) {
                x = e.pageX;
                y = e.pageY;
            }
            else {
                x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            x -= gCanvasElement.offsetLeft;
            y -= gCanvasElement.offsetTop;
            return { x: x, y: y };
        }
    </script>
    <%--<input type="range" name="range" min="0" max="10" step=".1" value="1" />
    <audio controls>
        <source src="Media/Kalimba.mp3" />
        <source src="Media/Kalimba.ogg" />
        <a href="Media/Kalimba.mp3" >Download</a>
    </audio>--%>
    <%--<video src="Media/youtube.com.Will%20We%20Ever%20Visit%20Other%20Stars%20%20-%20YouTube.ogv"
        controls="controls" />--%>
    <%--<video  controls preload>
        <source src="Media/youtube.com.Will%20We%20Ever%20Visit%20Other%20Stars%20%20-%20YouTube.ogv"  />
    </video>--%>
    <script type="text/javascript">


        var dragSrcEl;
        function handleDragEnter(e) {
            //console.log('dragover');
            //console.log('id: ' + $(this).attr('id'));
            if ($(this).hasClass("zone") && $(this).attr("id") != "") {
                $(this).css("background", "red");
            }
        }

        function handleDragLeave(e) {
            //console.log('dragover');
            //console.log('id: ' + $(this).attr('id'));
            if ($(this).hasClass("zone") && $(this).attr("id") != "") {
                $(this).css("background", "");
            }
        }

        function handleDrop(e) {
            console.log('hi');
            if (e.preventDefault) {
                e.preventDefault();
            }
            this.innerHTML += dragSrcEl.find(".droppedContent").html();
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
        }

        function supports_html5_storage() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        }

        $(document).ready(function () {
            var draggable = $("#_draggables>div");
            draggable.attr('draggable', 'true');
            draggable.bind('dragstart', function (e) {
                dragSrcEl = $(this);
            });

            $(".zone").bind('dragenter', handleDragEnter);
            $(".zone").bind('dragleave', handleDragLeave);
            $(".zone").bind('dragover', handleDragOver);
            $(".zone").bind('drop', handleDrop);
            if (supports_html5_storage()){
                console.log("supports html5");
                if (window.localStorage.getItem("editedContent") != null) {
                    console.log("getting local storage");
                    $("#testLocalStorage").html(window.localStorage["editedContent"]);
                }
                $("#testLocalStorage")[0].onChange = function () {
                    console.log("setting local storage");
                    window.localStorage["editedContent"] = $("#testLocalStorage").html();
                };
            }

            //This allows content editable 
            var editable = document.querySelectorAll('div[contentEditable]');

            for (var i = 0, len = editable.length; i < len; i++) {
                editable[i].setAttribute('data-orig', editable[i].innerHTML);

                editable[i].onblur = function () {
                    if (this.innerHTML == this.getAttribute('data-orig')) {
                        // no change
                    }
                    else {
                        // change has happened, store new value
                        this.setAttribute('data-orig', this.innerHTML);
                        this.onChange();
                    }
                };
            }
        });
    </script>
    <section id="_draggables">
        <div id="draggableTextbox" type="textbox">
            textbox
            <div class="droppedContent" style="display:none;">
                <div contenteditable="true">
                    test
                </div>
            </div>
        </div>
        <div id="draggableFillerText" type="fillertext">
            fillerText
            <div class="droppedContent" style="display:none;">
                This is some filler text.
            </div>
        </div>
    </section>
    <section id="zone1" class="contact zone">
        This is the first zone.
    </section>

    <section id="zone2" class="contact zone">
        This is the second zone.
    </section>

    <section id="zone3" class="contact zone">
        This is the third zone.
    </section>
    <section>
        <figure>
            <img src="Images/orderedList9.png" alt="test">
            </img>
            <figcaption>
                <p>This is a test.</p>
            </figcaption>
        </figure>
        <small>hello world</small>hello world
        <input id="email" name="email" type="email" placeholder="doug@givethesepeopleair.com" /> 
        <button type="submit"> Submit Form </button>  
    </section>
    <section>
        <div>Test persistent storage</div>
        <div id="testLocalStorage" contenteditable="true">
            Test
        </div>
    </section>
</asp:Content>