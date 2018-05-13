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
/* 
* 获取所有的用户
*/
// app.get('/user', function (req, res) {
//     res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
//     sql.connect(sqlConfig, function() {
//         var request = new sql.Request();
//         var sqlc = 'SELECT TOP 3 编号 as patient_id, 名称 as name, 性别 as sex,  出生日期 as birthday,  身份证号 as idcard,  联系电话 as mobile,  卡片编码 as card FROM  D病员档案 ';
//         request.query(sqlc, function(err, recordset) {
//             if(err){
//                 console.log(err);
//             } 
//             res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
//             sql.close();
//         });
//     });
// });
/* 
* 根据电话号码和卡号获取用户
*
*/
app.post('/user', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    //var name = req.body.name;
    //var idcard = req.body.idcard;
    var mobile = req.body.mobile;       //  请求需要的联系电话
    var card = req.body.card;           //  请求需要的卡片编码
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT 编号 as patient_id, 名称 as name, 性别 as sex,  出生日期 as birthday,  身份证号 as idcard,  联系电话 as mobile,  卡片编码 as card FROM  D病员档案 where 联系电话 = '"+mobile+"' and 卡片编码 = '"+card+"'";
        request.query(sqlc, function(err, recordset) {
            if(err){
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});
/* 
* 根据用户id获取用户的住院记录
*/
app.get('/record/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var id =  req.params.id;// 用户id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT  a.编号 as 住院号, a.名称, a.性别,  入院时间,入院次数 FROM  D住院档案 as a where 人员编号 = "+id;
        request.query(sqlc, function(err, recordset) {
            if(err){
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/* 
* 根据住院号获取用户的住院详情单
*/
app.get('/record/:id/info', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var id =  req.params.id;// 住院编号id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "  SELECT TOP (200) a.编号, a.名称, a.性别,  入院时间, 出院时间,  病情诊断, 预交金额, "
        +"case when 在院 = 1 then 费用金额 else  住院总额 end as 费用总额,  b.名称 as 住院医师, E.名称  责任护士, "
        +"c.名称 as  当前科室, d.名称 as  当前床位, 住院天数, 已结帐, 费用类型 FROM D住院档案 a  inner join T员工档案 b "
        +"on a.住院医师 =b.编号 LEFT join T员工档案 E on a.责任护士 =E.编号 inner join T科室档案 C on c.编号 =a.当前科室 "
        +"left join  T床位档案 D on d.编号 =a.当前床位 where  a.编号 = "+id;
        request.query(sqlc, function(err, recordset) {
            if(err){
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});