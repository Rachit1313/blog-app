var path = require('path');
var express = require("express");
var blog = require('./blog-service.js');
var app = express();

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

//setup another route to listen on /blog
app.get("/blog", function(req,res){
    blog.getPublishedPosts().then(function(data){
        res.json(data)
    })
    .catch((err)=>{
        console.log(err);
    });
});

//setup another route to listen on /posts
app.get("/posts", function(req,res){
    blog.getAllPosts().then(function(data){
        res.json(data)
    })
    .catch((err)=>{
        console.log(err);
    });
});

//setup another route to listen on /categories
app.get("/categories", function(req,res){
    blog.getCategories().then(function(data){
        res.json(data)
    })
    .catch((err)=>{
        console.log(err);
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