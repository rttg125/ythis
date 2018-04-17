var express = require('express'); // Web Framework
var bodyParser = require("body-parser");
var sql = require('mssql'); // MS Sql Server client
var app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Connection string parameters.
var sqlConfig = {
    user: 'sa',
    password: '1055',
    server: 'localhost',
    database: 'ythis',
}

// Start server and listen on http://localhost:8081/
var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("app listening at http://%s:%s", host, port)
});
app.get('/user', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = 'SELECT TOP 3 编号 as id, 名称 as name, 性别 as sex,  出生日期 as birthday,  身份证号 as idcard,  联系电话 as mobile,  卡片编码 as card FROM  D病员档案 ';
        request.query(sqlc, function(err, recordset) {
            if(err){
                console.log(err);
            } 
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});
app.post('/user', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    //var name = req.body.name;
    //var idcard = req.body.idcard;
    var mobile = req.body.mobile;       //  请求需要的联系电话
    var card = req.body.card;           //  请求需要的卡片编码
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT 编号 as userid, 名称 as name, 性别 as sex,  出生日期 as birthday,  身份证号 as idcard,  联系电话 as mobile,  卡片编码 as card FROM  D病员档案 where 联系电话 = '"+mobile+"' and 卡片编码 = '"+card+"'";
        request.query(sqlc, function(err, recordset) {
            if(err){
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});
