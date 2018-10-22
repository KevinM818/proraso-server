const express = require('express');
const router = express.Router();
const ShopifyFunctions = require('../scripts/shopify-functions.js');
const helpers = require('../scripts/helpers.js');

router.get('/fetchAllProducts', async (req ,res) => {
  console.log('====== Fetch Products ======');
  let allProducts = await ShopifyFunctions.getAllProducts();
  res.json(allProducts);
});

router.post('/createBox', async (req, res) => {
  console.log('====== Creating Box ======');
  const items = req.body;
  const metafields = helpers.getMetaFields(items);
  const boxDescription = helpers.getBoxDescription(items);
  const createdBox = await ShopifyFunctions.createBox(metafields, items, boxDescription);
  res.send(createdBox);
});

router.post('/order-created', (req, res) => {
  console.log('====== ORDER CREATED ======');
  const orderItems = req.body.line_items;
  ShopifyFunctions.handleOrderCreation(orderItems);
  res.end();
})

module.exports = router;