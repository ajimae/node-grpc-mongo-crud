// requirements
const path = require('path');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');

const mongoose = require('mongoose');
const Customer = require('./model/Customer');

// knex
// const environment = process.env.ENVIRONMENT || 'development';
// const config = require('./knexfile.js')[environment];
// const knex = require('knex')(config);

mongoose.connect('mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/customer?replicaSet=spike', { useUnifiedTopology: true, useNewUrlParser: true });

// grpc service definition
const productProtoPath = path.join(__dirname, '..', 'protos', 'product.proto');
const productProtoDefinition = protoLoader.loadSync(productProtoPath);
const productPackageDefinition = grpc.loadPackageDefinition(productProtoDefinition).User;
/*
Using an older version of gRPC?
(1) You won't need the @grpc/proto-loader package
(2) const productPackageDefinition = grpc.load(productProtoPath).product;
*/

// knex queries
async function getUser(call, callback) {
  /*
  Using 'grpc.load'? Send back an array: 'callback(null, { data });'
  */
  // knex('products')
  //   .then((data) => { callback(null, { products: data }); });
  const customer = await Customer.find({});
  // console.log(customer, '>>')
  callback(null, ...customer)

  // , function(error, result) {
  //   console.log(result[0], '<><><>')
  //   // const { name, age, address } = result[0];
  //   callback(null, ...result)
  // })
}
function readProduct(call, callback) {
  console.log(call.request.id, '>>')
  // knex('products')
  //   .where({ id: parseInt(call.request.id) })
  //   .then((data) => {
  //     if (data.length) {
  //       callback(null, data[0]);
  //     } else {
  //       callback('That product does not exist');
  //     }
  //   });
  Customer.findOne({ _id: call.request.id }, function(error, result) {
    console.log(result)
    callback(null, result);
  })
}
function createProduct(call, callback) {
  knex('products')
    .insert({
      name: call.request.name,
      price: call.request.price,
    })
    .then(() => { callback(null, { status: 'success' }); });
}
function updateProduct(call, callback) {
  knex('products')
    .where({ id: parseInt(call.request.id) })
    .update({
      name: call.request.name,
      price: call.request.price,
    })
    .returning()
    .then((data) => {
      if (data) {
        callback(null, { status: 'success' });
      } else {
        callback('That product does not exist');
      }
    });
}
function deleteProduct(call, callback) {
  knex('products')
    .where({ id: parseInt(call.request.id) })
    .delete()
    .returning()
    .then((data) => {
      if (data) {
        callback(null, { status: 'success' });
      } else {
        callback('That product does not exist');
      }
    });
}

// main
function main() {
  const server = new grpc.Server();
  // gRPC service
  server.addService(productPackageDefinition.UserService.service, {
    getUser: getUser,
    readProduct: readProduct,
    createProduct: createProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
  });
  // gRPC server
  server.bind('localhost:50051', grpc.ServerCredentials.createInsecure());
  server.start();
  console.log('gRPC server running at http://127.0.0.1:50051');
}

main();
