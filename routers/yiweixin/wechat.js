var express = require('express');
var app = express.Router();
var models  = require('../../models')
var helpers = require("../../helpers")
var formidable = require('formidable')
var async = require("async")
var OAuth = require('wechat-oauth');
var config = require("../../config")
var wechat = require('wechat')
var WechatAPI = require('wechat-api');

var api = helpers.API

var maxDepth = config.max_depth

var wechatConfig = {
  token: config.token,
  appid: config.appId,
  encodingAESKey: config.aesKey
}

app.use('/wechat', wechat(wechatConfig, function (req, res, next) {
  var menusKeys = config.menus_keys
  var message = req.weixin;
  console.log(message)

  if(message.Event === 'subscribe') { // scan and subscribe
    subscribe(message, res)
  }else if (message.Event === 'unsubscribe') {
    unsubscribe(message, res)
  }else if (message.MsgType == 'text' ){

    async.waterfall([function(next) {
      models.WechatReply.findOne({
        where: {
          key: message.Content,
          isActive: true
        }
      }).then(function(reply){
        if(reply){
          next(null, reply)
        }else{
          models.MessageTemplate.findOrCreate({
            where: {
              name: "defaultReply"
            },
            defaults: {
              content: "欢迎使用"
            }
          }).spread(function(template) {
            next(null, template)
          }).catch(function(err) {
            next(err)
          })
        }
      })
    }], function(err, reply) {
      if(err){
        console.log(err)
        res.reply('欢迎使用')
      }else{
        res.reply(reply.content)
      }
    })

  }else{
    models.WechatMenu.findOne({
      where: {
        key: message.EventKey
      }
    }).then(function(menu) {
      if(menu){
        res.reply(menu.url)
      }else{

        models.MessageTemplate.findOrCreate({
          where: {
            name: "defaultReply"
          },
          defaults: {
            content: "欢迎使用"
          }
        }).spread(function(template) {
          var content = template.content
          res.reply(content)
        }).catch(function(err) {
          res.reply('欢迎使用')
        })
      }
    })
  }
}))


function unsubscribe(message, res) {
  var openid = message.FromUserName

  async.waterfall([function(next) {
    models.Customer.findOne({
      where: {
        wechat: openid
      }
    }).then(function (customer) {
      if(customer && customer.isSubscribe){
        customer.updateAttributes({
          isSubscribe: false
        }).then(function(customer) {
          next(null, customer)
        })
      }else{
        return
      }
    })
  }], function(err) {
    res.reply('取消关注成功')
  })

}

/*
{ ToUserName: '',
  FromUserName: '',
  CreateTime: '1448544827',
  MsgType: 'event',
  Event: 'subscribe',
  EventKey: 'qrscene_1',
  Ticket: 'gQEH8DoAAAAAAAAAASxodHRwOi8vd2VpeGluLnFxLmNvbS9xL20wUTlWbnptdzlHNlJ0Q0JoMmp1AAIEX7hWVgMEAAAAAA==' }
*/


function subscribe(message, res){
  var customerId = null,
      openid = message.FromUserName
  if(message.EventKey.indexOf('qrscene_') != -1 ){
    customerId = message.EventKey.replace('qrscene_', '')
  }

  async.waterfall([function(next) {
    models.Customer.findOne({
      where: {
        wechat: openid
      }
    }).then(function (customer) {
      if(customer && customer.isSubscribe){
        return
      }else if(customer && !customer.isSubscribe){
        customer.updateAttributes({
          isSubscribe: true
        }).then(function(customer) {
          return
        }).catch(function(err) {
          next(err)
        })
      }else{
        next(null, openid)
      }
    })
  }, function(openid, next) {
    api.getUser(openid, function(err, result) {
      if(err){
        next(err)
      }else{
        next(null, result)
      }
    });
  }, function(result, next) {
    if(customerId){
      models.Customer.findById(customerId).then(function(customer) {
        next(null, customer, result)
      })
    }else{
      next(null, null, result)
    }
  }, function(recommend, result, next) {
      // new customer

      models.Customer.create({
        password: '1234567',
        username: result.nickname,
        wechat: result.openid,
        sex: result.sex + '',
        city: result.city,
        province: result.province,
        country: result.country,
        headimgurl: result.headimgurl,
        subscribeTime: new Date(),
        isSubscribe: true,
        ancestry: recommend
      }).then(function(customer) {
        next(null, customer, recommend)
      }).catch(function(err) {
        next(err)
      })
  }], function(err, newCustomer, recommend) {
    if(err){
      console.log(err)
      res.reply('')
    }else{
      models.MessageTemplate.findOrCreate({
        where: {
          name: "subscribe"
        },
        defaults: {
          content: "您好{{username}}，欢迎成为第{{id}}位用户"
        }
      }).spread(function(template) {
        var content = template.content.format({ username: newCustomer.username, id: newCustomer.id })
        if(recommend){
          sendSubscribeNotice(newCustomer, recommend)
        }

        res.reply(content)
      }).catch(function(err) {
        res.reply('')
      })
    }
  })


}


function sendSubscribeNotice(newCustomer, recommend){

  async.waterfall([function(next) {
    models.MessageTemplate.findOrCreate({
        where: {
          name: "recommendNotice"
        },
        defaults: {
          content: "您推荐{{username}}成为第{{id}}位用户"
        }
      }).spread(function(template) {
        var content = template.content.format({ username: newCustomer.username, id: newCustomer.id })
        next(null, content)
      }).catch(function(err) {
        next(err)
      })
  }, function(content, next) {
    var articles = [
     {
       "title":"推荐成功",
       "description": content,
       "url": "http://" + config.hostname + '/slave?id=' + newCustomer.id,
       "picurl": newCustomer.headimgurl
     }];

    api.sendNews(recommend.wechat, articles, function(err, result) {
      if(err){
        next(err)
      }else{
        next(null, result)
      }
    });
  }], function(err, result) {
    if(err){
      console.log(err)
    }else{
      console.log(result)
    }
  })
}

module.exports = app;
