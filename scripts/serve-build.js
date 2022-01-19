const express = require('express');
const serveStatic = require('serve-static');
const cors = require('cors');
const path = require('path');

var app = express();
app.use(cors());
app.use('/mcc-patient-v2', serveStatic(path.resolve(__dirname, '../build')));
app.listen(8000, err => {
  if (err != null) {
    console.error(err);
  }
  console.log('NOTE: This is a development server intended to test static deployment of the')
  console.log('MyPain app. This server is not intended for production use.')
  console.log();
  console.log('Launch URL: http://localhost:8000/mcc-patient-v2/launch.html');
});
