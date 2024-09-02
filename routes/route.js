'use strict';
const oData = require("../odata/odata");
var express = require('express');
var router = express.Router();
var urlBase = '/readDestinationDetails';

router.get('/', function(req, res, next) {
  req.url = urlBase; //We forward the default request to the /products endpoint request
  router.handle(req, res);
});

router.get(urlBase, function(req, res) {
  var query = require('url').parse(req.url,true).query;
  var destination = query.destination;
  var data = undefined;
      oData.readDestinationDetails(destination)
          .then(function (body) {
            res.send(body);
            // const data = body;
            // console.log('divye'+ data);

              // const data = body.d.results;
              // console.log(`RESULTS: ${JSON.stringify(data)}`);
          })
          .catch(function(error) {
              console.error(`Error uploadInitialData ${error.toString()}`);
              data = error;
          });

          // console.log("test9" + data);
          // res.send(body);
});


module.exports = router;