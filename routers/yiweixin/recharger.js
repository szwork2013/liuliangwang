/**
 * 流量接口
 * Created by 唐亮 on 2016/7/16.
 */
var express = require('express');
var app = express.Router();
var models  = require('../../models');
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

app.get('/recharger_yisai', function (req, res) {
    console.log('get ', req.body.trim())
})

app.post('/recharger_yisai', function (req, res) {
    console.log('post ', req.body.trim())
})

module.exports = app;