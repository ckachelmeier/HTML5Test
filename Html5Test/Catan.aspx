<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Catan.aspx.cs" Inherits="Html5Test.Catan" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Catan</title>
    <script src="Scripts/jquery-1.7.1.js"></script>
</head>
<body>
    <form id="form1" runat="server">
        <div>
            <script src="Scripts/Catan.js"></script>
            <canvas id="board" width="640" height="640"></canvas>
        </div>
    </form>
</body>
</html>
