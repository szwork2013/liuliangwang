var express = require('express');
var admin = express.Router();
var models  = require('../../models')
var helpers = require("../../helpers")
var async = require("async")
var _ = require('lodash')

admin.get('/bills', function(req, res) {
  async.waterfall([function(next) {
    models.TrafficPlan.findAndCountAll({
      where: {
        productType: models.TrafficPlan.PRODUCTTYPE["bill"]
      },
      limit: req.query.perPage || 15,
      offset: helpers.offset(req.query.page, req.query.perPage || 15)
    }).then(function(trafficPlans) {
      next(null, trafficPlans)
    }).catch(function(err) {
      next(err)
    })
  }, function(trafficPlans, next){
    models.TrafficGroup.findAll().then(function(trafficgroups) {
      var trafficgroupsCollection = [];
      for (var i = 0; i < trafficgroups.length; i++) {
        trafficgroupsCollection.push([ trafficgroups[i].id, trafficgroups[i].name ])
      };
      next(null, trafficPlans, trafficgroupsCollection)
    }).catch(function(err) {
      next(err)
    })
  }], function(err, trafficPlans, trafficgroupsCollection) {
    if(err){
      console.log(err)
      res.redirect('/500')
    }else{
      var providerOptions = { name: "providerId", class: 'select2 editChoose col-lg-12 col-xs-12' },
        providerCollection = models.TrafficPlan.PROVIDERARRAY,
        trafficgroupsOptions = { name: "trafficGroupId", class: 'select2 editChoose col-lg-12 col-xs-12', includeBlank: true }

      result = helpers.setPagination(trafficPlans, req)
      res.render('admin/bills/index', {
        trafficPlans: result,
        providerOptions: providerOptions,
        providerCollection: providerCollection,
        trafficgroupsOptions: trafficgroupsOptions,
        trafficgroupsCollection: trafficgroupsCollection
      })
    }
  })
})


admin.get('/bills/new', function(req, res) {
  async.waterfall([function(next) {
    models.TrafficGroup.findAll().then(function(trafficgroups) {
      var trafficgroupsCollection = [];
      for (var i = 0; i < trafficgroups.length; i++) {
        trafficgroupsCollection.push([ trafficgroups[i].id, trafficgroups[i].name ])
      };
      next(null, trafficgroupsCollection)
    }).catch(function(err) {
      next(err)
    })
  }], function(err, trafficgroupsCollection) {
    if(err){
      console.log(err)
      res.redirect('/500')
    }else{
      var trafficPlan = models.TrafficPlan.build(),
          providerOptions = { name: "providerId", class: 'select2 col-lg-12 col-xs-12' },
          providerCollection = models.TrafficPlan.PROVIDERARRAY,
          typeOptions = { name: "type", class: 'select2 col-lg-12 col-xs-12' },
          typeCollection = models.TrafficPlan.TYPEARRAY,
          trafficgroupsOptions = { name: "trafficGroupId", class: 'select2 col-lg-12 col-xs-12', includeBlank: true }

      res.render('admin/bills/new', {
        trafficPlan: trafficPlan,
        providerOptions: providerOptions,
        providerCollection: providerCollection,
        typeOptions: typeOptions,
        typeCollection: typeCollection,
        trafficgroupsOptions: trafficgroupsOptions,
        trafficgroupsCollection: trafficgroupsCollection,
        path: '/admin/bill'
      })
    }
  })
})

admin.post('/bill', function(req, res) {
  var params = req.body
  if(params['display'] == 'on'){
    params['display'] = true
  }else{
    params['display'] = false
  }
  params['productType'] = models.TrafficPlan.PRODUCTTYPE['bill']
  async.waterfall([function(next) {
    models.TrafficPlan.build(params).save().then(function(trafficplan) {
      if(trafficplan){
        next(null, trafficplan)
      }else{
        next(new Error("err"))
      }
    }).catch(function(err) {
      next(err)
    })
  }], function(err, trafficplan) {
    if(err){
      console.log(err)
      req.flash("err", "update fail")
      res.redirect('/500')
    }else{
      req.flash("info", "update success")
      res.redirect('/admin/bills/' + trafficplan.id + '/edit')
    }
  })
})


admin.get('/bills/:id/edit', function(req, res) {
  async.waterfall([function(next) {
    models.TrafficPlan.findById(req.params.id).then(function(trafficPlan) {
      next(null, trafficPlan)
    }).catch(function(err) {
      next(err)
    })
  }, function(trafficplan, next) {
    models.TrafficGroup.findAll().then(function(trafficgroups) {
      var trafficgroupsCollection = [];
      for (var i = 0; i < trafficgroups.length; i++) {
        trafficgroupsCollection.push([ trafficgroups[i].id, trafficgroups[i].name ])
      };
      next(null, trafficplan, trafficgroupsCollection)
    }).catch(function(err) {
      next(err)
    })
  }], function(err, trafficPlan, trafficgroupsCollection) {
    if(err){
      console.log(err)
      res.redirect('/500')
    }else{
      var providerOptions = { name: "providerId", class: 'select2 col-lg-12 col-xs-12' },
          providerCollection = models.TrafficPlan.PROVIDERARRAY,
          typeOptions = { name: "type", class: 'select2 col-lg-12 col-xs-12' },
          typeCollection = models.TrafficPlan.TYPEARRAY,
          trafficgroupsOptions = { name: "trafficGroupId", class: 'select2 col-lg-12 col-xs-12', includeBlank: true }

      res.render('admin/bills/new', {
          trafficPlan: trafficPlan,
          providerOptions: providerOptions,
          providerCollection: providerCollection,
          typeOptions: typeOptions,
          typeCollection: typeCollection,
          trafficgroupsOptions: trafficgroupsOptions,
          trafficgroupsCollection: trafficgroupsCollection,
          path: '/admin/bill/' + trafficPlan.id
        })
    }
  })
})

admin.get('/bills/:id', function(req, res) {
  async.waterfall([function(next) {
    models.TrafficPlan.findById(req.params.id).then(function(trafficPlan) {
      next(null, trafficPlan)
    }).catch(function(err) {
      next(err)
    })
  }], function(err, trafficPlan) {
    if(err){
      console.log(err)
      res.json({ err: 1, message: err })
    }else{
      res.json({ err: 0, message: "", data: trafficPlan })
    }
  })
})


admin.post('/bill/:id', function(req, res){
  var params = req.body
  if(params['display'] == 'on'){
    params['display'] = true
  }else{
    params['display'] = false
  }
  params['productType'] = models.TrafficPlan.PRODUCTTYPE['bill']
  async.waterfall([function(next) {
    models.TrafficPlan.findById(req.params.id).then(function(trafficPlan) {
      next(null, trafficPlan)
    }).catch(function(err) {
      next(err)
    })
  }, function(trafficPlan, next) {
    trafficPlan.updateAttributes(params).then(function(trafficPlan) {
      next(null, trafficPlan)
    }).catch(function(err) {
      next(err)
    })
  }], function(err, trafficPlan) {
    if(err){
      console.log(err)
      res.format({
        html: function(){
          req.flash("info", "update fail")
          res.redirect('/500')
        },
        json: function(){
          res.send({ message: 'update fail', err: 1 });
        }
      });
    }else{
      res.format({
        html: function(){
          req.flash("info", "update success")
          res.redirect('/admin/bills/' + trafficPlan.id + '/edit')
        },
        json: function(){
          res.send({ message: 'update success', err: 0 });
        }
      });
    }
  })
})


module.exports = admin;