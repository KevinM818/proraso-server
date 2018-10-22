const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const indexRouter = require('./routes/index');
const shopifyRouter = require('./routes/shopify-api');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Routes
app.use('/', indexRouter);
app.use('/shopify', shopifyRouter);

app.get('/status', (req,res) =>{
  res.send('We are Live');
  res.end();
});

//Start Server
app.listen(process.env.PORT || 3000, function(){
  console.log('Server is started on port 3000');
});

module.exports = app;
