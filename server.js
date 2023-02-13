/*********************************************************************************
* WEB322 – Assignment 03
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Rachit Chawla Student ID: 162759211 Date: 13th February,2023
*
* Cyclic Web App URL: https://itchy-red-millipede.cyclic.app
*
* GitHub Repository URL: https://github.com/Rachit1313/web322-app
*
********************************************************************************/

var path = require('path');
var express = require("express");
var blog = require('./blog-service.js');
var app = express();
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')

cloudinary.config({
    cloud_name: 'dd1arp27e',
    api_key: '772393949359259',
    api_secret: 'pj5emzg-4RXqAuwmuWzMZSCoGi0',
    secure: true
   });

const upload = multer(); // no { storage: storage } since we are not using disk storage   
var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}
app.use(express.static('public'));
// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function(req,res){
    res.redirect('/about');
});

// setup another route to listen on /about
app.get("/about", function(req,res){
    res.sendFile(path.join(__dirname+'/views/about.html'));
});

//setup get route for /posts/add
app.get('/posts/add', function(req, res) {
  res.sendFile(path.join(__dirname, '/views/addPost.html'));
});


//setup post route for /posts/add
app.post("/posts/add",upload.single("featureImage"),function(req,res){
    // res.sendFile(path.join(__dirname+'/views/addPost.html'));
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
      }
      upload(req).then((uploaded) => {
        processPost(uploaded.url);
      });
    } else {
      processPost("");
    }
    function processPost(imageUrl) {
      req.body.featureImage = imageUrl;
      // TODO: Process the req.body and add it as a new Blog Post before redirecting to /posts)
      blog.addPost(req.body).then(() =>{
        res.redirect("/posts");
    });
    } 
});

//setup another route to listen on /blog
app.get("/blog", function(req,res){
    blog.getPublishedPosts().then(function(data){
        res.json(data)
    })
    .catch((err)=>{
        res.status(500).send({ message: err })
    });
});

//setup another route to listen on /posts
app.get("/posts", function(req,res){
  var category = req.query.category;
  var minDate = req.query.minDate;
  
  if (category) {
      blog.getPostsByCategory(category).then((data) => {
          res.json(data);
      }).catch((err) => res.send(err));
  }
  else if (minDate) {
      blog.getPostsByMinDate(minDate).then((data) => {
          res.json(data);
      }).catch((err) => res.send(err));
  }
  else {
      blog.getAllPosts().then((data) => {
          res.json(data);
      }).catch((err) => res.send(err));
  }
});

//setup another route to listen on /categories
app.get("/categories", function(req,res){
    blog.getCategories().then(function(data){
        res.json(data)
    })
    .catch((err)=>{
        res.status(500).send({ message: err })
    });
});

//setup route for page not found if user enters something that doesn't matches with any route
app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });

// setup http server to listen on HTTP_PORT
// app.listen(HTTP_PORT, onHttpStart);

blog.initialize().then(()=>{
    app.listen(HTTP_PORT,onHttpStart);
}).catch((err)=>{
    console.log(err);
})