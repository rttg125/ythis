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
function getDate() {
    var date = new Date();
    var seperator1 = "-";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = year + seperator1 + month + seperator1 + strDate;
    return currentdate;
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
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
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
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 用户id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT  a.编号 as 住院号, a.名称, a.性别,  入院时间, 出院时间, 住院天数, 入院次数 FROM  D住院档案 as a where 人员编号 = "+id;
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
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
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


/* 
* 根据住院号获取用户的住院费用清单
*/
app.get('/list/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 住院编号id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "select 名称 ,单位,数量 ,金额  from ( select   b.名称 ,b.计量单位 As 单位, "
            +"sum(a.数量) 数量 , sum(a.金额) As 金额 From D住院记帐列表 a "
      		+"Inner Join T收费项目 b ON b.编号=a.费用明细 WHERE A.记帐方式 <> '处方记帐' "
      		+"And A.作废=0  AND  住院编号= "+ id +" group by  b.名称 ,b.计量单位 Union All "
      		+"select   C.名称 ,C.药品单位 As 单位, SUM(B.数量)数量 , sum(B.单项金额) As 金额 "
      		+"from  D住院划价单 A Inner Join D住院划价数据 B On A.序号 = B.序号 "
     		+"Inner Join T药品卫材 C On B.药品编号= C.编号 where  住院编号= "+ id 
     		+"And A.作废=0 and 已被记帐=1 group by C.名称 ,C.药品单位  ) w"
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/*
* 根据住院号和日期获取用户的住院详情单
*/
app.get('/list/:id/date/:date', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 住院编号id
    var date =  req.params.date;// 选择的时间
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = " select 名称 ,单位,数量 ,金额 from ("
            +"select   b.名称 ,b.计量单位 As 单位,"
               +"sum(a.数量) 数量 , sum(a.金额) As 金额"
               +" From D住院记帐列表 a"
                +" Inner Join T收费项目 b ON b.编号=a.费用明细"
                 +"  WHERE A.记帐方式 <> '处方记帐'  And A.作废=0  AND  住院编号= "+id
                 +"  and   IsNull(CONVERT(varchar(10),A. 记帐时间,23),'1900-01-01') = '"+date+"'  "
                 +"  group by  b.名称 ,b.计量单位 "
                 +"  Union All "
                +"  select   C.名称 ,C.药品单位 As 单位,"
            +"  SUM(B.数量)数量 , sum(B.单项金额) As 金额 from  D住院划价单 A "
              +"   Inner Join D住院划价数据 B On A.序号 = B.序号 "
               +" Inner Join T药品卫材 C On B.药品编号= C.编号 "
               +" where  住院编号= '"+id+"'     And A.作废=0 and 已被记帐=1 and   IsNull(CONVERT(varchar(10),A.过单时间,23),'1900-01-01') = '"+date+"' "
               +" group by C.名称 ,C.药品单位    ) w ;"
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
* 根据档案号获取用户的检验报告
*/
app.get('/jybg/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 住院编号id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT 序号 , IsNull(CONVERT(varchar(10),检验日期,23),'1900-01-01')检验日期 ,"
        +"标本类型, 临床诊断  FROM   D检验报告单 WHERE   (档案号 = "+id+" )  order by   检验日期 desc "
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/*
* 根据住院号和日期获取用户的住院详情单
*/
app.get('/list/:id/date/:date', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 住院编号id
    var date =  req.params.date;// 选择的时间
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = " select 名称 ,单位,数量 ,金额 from ("
            +"select   b.名称 ,b.计量单位 As 单位,"
               +"sum(a.数量) 数量 , sum(a.金额) As 金额"
               +" From D住院记帐列表 a"
                +" Inner Join T收费项目 b ON b.编号=a.费用明细"
                 +"  WHERE A.记帐方式 <> '处方记帐'  And A.作废=0  AND  住院编号= "+id
                 +"  and   IsNull(CONVERT(varchar(10),A. 记帐时间,23),'1900-01-01') = '"+date+"'  "
                 +"  group by  b.名称 ,b.计量单位 "
                 +"  Union All "
                +"  select   C.名称 ,C.药品单位 As 单位,"
            +"  SUM(B.数量)数量 , sum(B.单项金额) As 金额 from  D住院划价单 A "
              +"   Inner Join D住院划价数据 B On A.序号 = B.序号 "
               +" Inner Join T药品卫材 C On B.药品编号= C.编号 "
               +" where  住院编号= '"+id+"'     And A.作废=0 and 已被记帐=1 and   IsNull(CONVERT(varchar(10),A.过单时间,23),'1900-01-01') = '"+date+"' "
               +" group by C.名称 ,C.药品单位    ) w ;"
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
* 根据住院号获取用户的住院预交清单.
*/
app.get('/prepayment/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 住院编号id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT   姓名, 性别, 入院时间, 当前床位, 预交金额, 欠费金额 "     
            +" FROM    W病人信息  where  编号 = "+id+"   and 在院 = '1'"
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/* 
* 根据病员编号获取用户的门诊交费清单.
*/
app.get('/payment/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 病员编号
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT *  FROM   w_门诊待交  where  病员编号 = "+id
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});


/* 
* 根据病员编号获取用户的门诊交费清单.
*/
app.get('/payment/info/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 业务号
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT *  FROM   V_门诊代缴明细  where  就诊序号 = "+id
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});


/* 
* 根据检验报告单号获取用户的检验报告详情
*/
app.get('/jybgxq/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 住院编号id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT   项目名称, 结果值, 结论,  参考值 FROM  D检验报告明细 "
					+"WHERE     (序号 = "+id +" ) order by 排序号"
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/* 
* 根据住院编号和充值类型给病人微信支付充值
* 类型：1、住院预交；2、门诊交费；3、挂号
*
*
*/
app.post('/payments', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }        
    var dangan_id = req.body.dangan_id;       
    var zhuyuan_id = req.body.zhuyuan_id?req.body.zhuyuan_id:0;        
    var keshi_id = req.body.keshi_id?req.body.keshi_id:0;        
    var yewu_id = req.body.yewu_id?req.body.yewu_id:0;          
    var guahao_date = req.body.guahao_date?req.body.guahao_date:'2018-01-01';          
    var order_id = req.body.order_id;
    var pay_id = req.body.pay_id;
    var pay_total = req.body.pay_total;
    var type = req.body.type;
    var remarks = req.body.remarks;
    var time = req.body.time;
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "insert into w支付 (住院号,业务号, 挂号日期,科室号, 档案号, 订单号, 结算号, 金额, 时间, 类型, 备注 ) values( " +        
            zhuyuan_id +','+yewu_id +',\''+guahao_date +'\','+ keshi_id +','+dangan_id+',\''+order_id+'\',\''+pay_id+'\',\''+pay_total+'\',\''+ time +'\','+type+',\''+remarks
            +"\')"; 
         console.log(sqlc);
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/* 
* 根据病员编号获取该病员所有的就诊记录
*/
app.get('/getscore/:id', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var id =  req.params.id;// 住院编号id
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "Select * FROM   w就诊记录 "
			+"WHERE     (病员编号 = "+id +" ) order by 就诊时间 DESC"
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/* 
* 获取支持挂号的科室列表
*/
app.get('/getkeshi', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request.');
    }
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT *  FROM  w_挂号科室 ";
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/* 
* 获取支持挂号的科室列表的指定日期的剩余号数
*/
app.get('/getsyhs/:date', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request.');
    }
    var date =  req.params.date;// 日期
    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqlc = "SELECT 编号,剩余号  FROM  w_剩余号 where 挂号日期='"+date+"'";
        request.query(sqlc, function(err, recordset) {
            if(err){
            	res.end(JSON.stringify(err),'utf-8')
                console.log(err);
            }
            res.end(JSON.stringify(recordset),'utf-8'); // Result in JSON format
            sql.close();
        });
    });
});

/* 
* 向HIS系统插入新数据，并返回其病员编号及就诊卡号
*
*/
app.post('/patient', function (req, res) {
    res.writeHead(200,{'Content-Type':'application/json;charset=utf-8'});//设置response编码为utf-8
    var header = req.header('User-Agent');
    if(header !== "application/sunseen-api"){
		res.status(400).end('Bad Request');
    }
    var mobile = req.body.mobile      //  联系电话
    var name = req.body.name
    var sex = req.body.sex
    var idcard = req.body.idcard
    var card = req.body.ecard?req.body.ecard:req.body.card
    var birthday = req.body.birthday

    sql.connect(sqlConfig, function() {
        var request = new sql.Request();
        var sqla = "SELECT 编号 as patient_id, 名称 as name, 性别 as sex,  出生日期 as birthday,  身份证号 as idcard, "
        +" 联系电话 as mobile,  卡片编码 as card FROM  D病员档案 where 联系电话 = '"+mobile+"' and 名称 = '"+name+"' and 身份证号 = '"+idcard+"'";
        
        var sqlb = "Insert Into  D病员档案 ( 名称, 性别,身份证号,出生日期,卡片编码,联系电话,五笔简码,拼音简码, 有效状态, 备注 ) values "
        +" (\'"+name+"\',\'"+sex+"\',\'"+idcard+"\',\'"+birthday+"\',\'"+card+"\',\'"+mobile+"\',dbo.GetWB(\'"+name+"\'),dbo.GetPY(\'"+name+"\'),\'可用\',\'微信\')";
        // console.log("Part1:"+sqla+"\n");
        request.query(sqla, function(err, data) {
            if(err){
                console.log(err);
                // res.end(JSON.stringify('error'),'utf-8');
            }
            // console.log("recordset1:"+JSON.stringify(data));
            if(data.rowsAffected[0] > 0){
                res.end(JSON.stringify(data),'utf-8'); // Result in JSON format 
                sql.close(); 
            }else{
                //  console.log("Part2:"+sqlb+"\n");
                request.query(sqlb, function(err, data) {
                    if(err){
                        console.log("err2:"+err);
                    }
                   
                });
                 console.log("Part3:"+sqla+"\n");
                request.query(sqla, function(err, data) {
                    if(err){
                        console.log("err3:"+err);
                    }
                    // console.log("recordset3:"+JSON.stringify(data));
                    res.end(JSON.stringify(data),'utf-8'); // Result in JSON format
                    sql.close();
                });
            }  
        });            
    });
});