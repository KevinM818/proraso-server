const Shopify = require('shopify-api-node');

const SHOP_NAME = 'happy-box-product-builder-app-test.myshopify.com';
const SHOP_API_KEY = '3040feb3552de88cea2ac85cb0586e3f';
const SHOP_PASSWORD = 'cc89cb9f9cd7fa32554dd5f03f6fa5d0';
const BOXNAME = 'Your Box';

const shopify = new Shopify({
  shopName: process.env.SHOP_NAME || SHOP_NAME,
  apiKey: process.env.SHOP_API_KEY || SHOP_API_KEY,
  password: process.env.SHOP_PASSWORD || SHOP_PASSWORD
});

/* Set of Functions To Retrieve All the Products From the Store */
async function getAllProducts(){
  //Returns all the products in the store to send to client server
  try{
    let numOfProducts = await getNumOfProducts();
    let productsList = await fetchProducts(Math.ceil(numOfProducts/250));
    return productsList;
  }catch(e){
    console.log('Error Fetching All Products');
  }
}
function getNumOfProducts(){
  //Gets the number of products in the store
  return shopify.product.count();
}
async function fetchProducts(page, productList = []){
  //Returns all the product objects in the store
  try{
    if(page != 0){
      let products = await getPageOfProducts(page);
      let updatedProductList = [...productList, ...products];
      return await fetchProducts(page - 1, updatedProductList);
    }else{
      return productList;
    }
  }catch(e){
    console.log('Error fetching producs');
  }
}
async function getPageOfProducts(page){
  //Gets the total number of pages with 250 products
  try{
    let products = await shopify.product.list({ limit:250, page });
    return products;
  }catch(e){
    console.log('Error getting page of products');
  }
}

/* Set of Functions to Create and Return a Bundled Box */
async function createBox(metafields, items, boxDescription){
  //Starts process to create the box
  try{
    let box = await createProduct({
      title: BOXNAME,
      product_type: "Built Box",
      metafields,
      variants:[{
        "price":items.price
      }]
    });
    box.boxDescription = boxDescription;
    await enableSalesChannel(box);
    return box;
  }catch(e){
    console.log('Error creating box');
  }
}
async function createProduct(productDetails){
  //Creates the box on Shopify and returns the object
  try{
    let product = await shopify.product.create(productDetails)
    .then( response => {
      return response;
    })
    .catch((err)=> {
      console.log(err);
    });
    return product;
  }catch(e){
    console.log('Error creating a product');
  }
}
async function enableSalesChannel(product){
  //Enable product on sales channel to checkout
  try{
    await shopify.productListing.create(product.id)
    .then((response) => {
      console.log('Product Successfully Enabled on App Sales Channel');
    })
    .catch((err) =>{
      console.log(err);
    });
  }catch(e){
    console.log('Error enabling sales channel');
  }
}

/* Set of Functions to handle a completed order with a box */
async function handleOrderCreation(orderItems){
  orderItems.forEach(async (orderItem) => {
    if(orderItem.title === BOXNAME){
      const metafields = await getMetafields(orderItem.product_id);
      const updateInventoryList = getProductsToUpdate(metafields);
      updateProductQuantity(updateInventoryList);
      deleteBoxProduct(orderItem.product_id);
    }
  });
}
async function getMetafields(productId){
  //Returns all the metafields for the box
  try{
    let metafields = [];
    await shopify.metafield.list({
      metafield:{
        owner_resource:'product',
        owner_id: productId
      }
    })
    .then((res) => {
      metafields = res;
    })
    .catch((err) => {
      console.log(err);
    });
    return metafields;
  }catch(e){
    console.log('Error getting metafields');
  }
}
function getProductsToUpdate(metafields){
  //Finds which items need inventory updated
  const productIds = metafields
  .filter(metafield => metafield.key === 'inventory_id')
  .map( metafield => parseInt(metafield.value));
  const productQuantities = metafields
    .filter(metafield => metafield.key === 'quantity')
    .map( metafield => parseInt(metafield.value));
  let productsToUpdate = [];
  productIds.forEach((id, index)=>{
    let inventoryItem = {
      id,
      quantity: productQuantities[index]
    };
    productsToUpdate.push(inventoryItem);
  });
  return productsToUpdate;
}
async function updateProductQuantity(inventoryList){
  //Adjusts the quantity for each item in the box
  try{
    let locations = await shopify.location.list();
    let locationId = locations[0].id;
    inventoryList.forEach( item => {
      shopify.inventoryLevel.adjust({
        location_id: locationId,
        inventory_item_id: item.id, 
        available_adjustment: item.quantity*-1
      })
      .then( success => {
        console.log(`${success.inventory_item_id} inventory updated`);
      })
      .catch( err => {
        console.log(err);
      });
    });
  }catch(e){
    console.log('Error updating product quantity');
  }
}
function deleteBoxProduct(productId){
  //Deletes the box from the Shopify Store
  shopify.product.delete(productId)
  .catch(err => {
    console.log(err);
  });
}


module.exports.getAllProducts = getAllProducts;
module.exports.createBox = createBox;
module.exports.handleOrderCreation = handleOrderCreation;