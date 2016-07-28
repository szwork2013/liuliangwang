/**
 * 流量接口
 * Created by 唐亮 on 2016/7/16.
 */
var express = require('express');
var app = express.Router();
var models  = require('../../models');
var async = require("async")
var xml2js = require('xml2js')
var recharger = require("../../recharger")
var Xinhaoba = recharger.Xinhaoba
var Dazhong = recharger.Dazhong
var Liuliangtong = recharger.Liuliangtong
var YiSai = recharger.YiSai

/**
 * 易赛获取产品
 */
app.get('/test_ys', function (req, res) {
    if(process.env.NODE_ENV  && process.env.NODE_ENV != "development"){
        return
    }
    var yisai = new YiSai("123445678", '18320376671', '100027')
/*    yisai.getProductList(function (data) {
        res.write(JSON.stringify(data))
        res.end()
    })*/

    yisai.then(function (data) {
        console.log(data)
        res.write(JSON.stringify(data))
        res.end()
    }).catch(function (err) {
        console.log(err)
        res.write(JSON.stringify(err))
        res.end()
    }).do()


})
/**
 * 易赛查看订单结果
 */
app.get('/test_ys_result', function (req, res) {
    if(process.env.NODE_ENV  && process.env.NODE_ENV != "development"){
        return
    }
    var yisai = new YiSai("123445678", '18320376671', '100027')

    yisai.rechargeResult('IF8766118201607281011266208012','18320376671_2286_1_188029',function (data) {
        res.write(JSON.stringify(data))
        res.end()
    })
})

app.post('/recharger_yisai', function (req, res) {
    console.log('post ', req.body)

    async.waterfall([
        function (next) {
            var parser =  new xml2js.Parser({explicitArray : false, ignoreAttrs : true})
            parser.parseString(req.body, function (err, result) {
                next(null, result.Esaipay)
            })
        },
        function (reqinfo, next) {
            models.ExtractOrder.findOne({
                where : {  out_trade_no: reqinfo.OutOrderNumber }
            }).then(function (extractOrder) {
                if(reqinfo.Result == 'success'){
                    extractOrder.updateAttributes({
                        state: models.ExtractOrder.STATE.FINISH
                    }).then(function(extractOrder){
                        next(null, extractOrder)
                    }).catch(function(err) {
                        next(err)
                    })
                } else {
                    extractOrder.updateAttributes({
                        state: models.ExtractOrder.STATE.FAIL
                    })
                    next(new Error(reqinfo.Remark))
                }
            }).catch(function (err) {
                next(err)
            })
        }
    ],function (err, result) {
        if(!err && result){

        }
    })

})

module.exports = app;