/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Rachit Chawla Student ID: 162759211 Date: 17th April, 2023
*
* Cyclic Web App URL: https://itchy-red-millipede.cyclic.app
*
* GitHub Repository URL: https://github.com/Rachit1313/web322-app
*
********************************************************************************/

var path = require('path');
var express = require("express");
var blog = require('./blog-service.js');
var authData = require('./auth-service.js');
var clientSessions = require("client-sessions");
var app = express();
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier');
const exphbs = require("express-handlebars");
const stripJs = require('strip-js');

cloudinary.config({
    cloud_name: 'dd1arp27e',
    api_key: '772393949359259',
    api_secret: 'pj5emzg-4RXqAuwmuWzMZSCoGi0',
    secure: true
   });


app.use(express.static("public"));

app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "web322blogapplication", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});


app.use(express.urlencoded({extended: true}));
   
app.engine('.hbs', exphbs.engine({ extname: '.hbs',helpers: {
  navLink: function(url, options){
    return '<li' +
    ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
    '><a href="' + url + '">' + options.fn(this) + '</a></li>';
   },
   equal: function (lvalue, rvalue, options) {
    if (arguments.length < 3)
    throw new Error("Handlebars Helper equal needs 2 parameters");
    if (lvalue != rvalue) {
    return options.inverse(this);
    } else {
    return options.fn(this);
    }
   },
   safeHTML: function(context){
    return stripJs(context);
   },
   formatDate: function(dateObj){
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
   }
}}));

app.set('view engine', '.hbs');


app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
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
    res.redirect('/blog');
});

// setup another route to listen on /about
app.get("/about", function(req,res){
    // res.sendFile(path.join(__dirname+'/views/about.html'));
    res.render('about');
});

//setup get route for /posts/add
app.get('/posts/add',ensureLogin, function(req, res) {
  blog.getCategories()
  .then((categories) => {
    res.render("addPost", { categories: categories });
  })
  .catch(() => {
    res.render("addPost", { categories: [] });
  });
});


//setup post route for /posts/add
app.post("/posts/add", ensureLogin,upload.single("featureImage"),function(req,res){
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

app.get('/blog', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          posts = await blog.getPublishedPostsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          posts = await blog.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // get the latest post from the front of the list (element 0)
      let post = posts[0]; 

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
      viewData.post = post;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blog.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})

});


app.get("/blog/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {

      // declare empty array to hold "post" objects
      let posts = [];

      // if there's a "category" query, filter the returned posts by category
      if (req.query.category) {
          // Obtain the published "posts" by category
          posts = await blog.getPublishedPostsByCategory(req.query.category);
      } else {
          // Obtain the published "posts"
          posts = await blog.getPublishedPosts();
      }

      // sort the published posts by postDate
      posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "posts" and "post" data in the viewData object (to be passed to the view)
      viewData.posts = posts;
  } catch (err) {
      viewData.message = "no results";
  }

  try {
      // Obtain the post by "id"
      let post = await blog.getPostById(req.params.id);
      viewData.post = post[0]
  } catch (err) {
      viewData.message = "no results";
  }

  try {
      // Obtain the full list of "categories"
      let categories = await blog.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  } catch (err) {
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
  // res.send(viewData)
});

//setup another route to listen on /posts
app.get("/posts",ensureLogin, function(req,res){
  var category = req.query.category;
  var minDate = req.query.minDate;
  if (category) {
      blog.getPostsByCategory(category).then((data) => {
          if (data.length > 0){
          res.render("posts", {posts: data});
          }
          else{
            res.render("posts",{ message: "no results" });
          }
      }).catch((err) => {
        res.render("posts", {message: "no results"});
      });
  }
  else if (minDate) {
      blog.getPostsByMinDate(minDate).then((data) => {
        if (data.length > 0){
          res.render("posts", {posts: data});}
          else{
          res.render("posts", {message: "no results"});
          }
      }).catch((err) =>{
        res.render("posts", {message: "no results"});
      });
  }
  else {
      blog.getAllPosts().then((data) => {
        if (data.length > 0){
          res.render("posts", {posts: data});}
          else{
            res.render("posts", {message: "no results"});
          }
      }).catch((err) =>{
        res.render("posts", {message: "no results"});
      });
  }
});

//setup another route to listen on /categories
app.get("/categories",ensureLogin, function(req,res){
    blog.getCategories().then(function(data){
        // res.json(data)
        if (data.length > 0){
        res.render("categories", {categories: data});
        }
        else{
          res.render("categories",{ message: "no results" });
        }
    })
    .catch((err)=>{
        // res.status(500).send({ message: err })
        res.render("categories", {message: "no results"});
    });
});

app.get('/post/:value',ensureLogin, (req, res) => {
    var value = req.params.value;
    blog.getPostById(value).then((data) => {
        res.send(data);
    }).catch((err) => {res.send(err);});
});

// setup http server to listen on HTTP_PORT
// app.listen(HTTP_PORT, onHttpStart);
blog.initialize()
.then(authData.initialize())
.then(function(){
    app.listen(HTTP_PORT, onHttpStart);
}).catch(function(err){
    console.log("unable to start server: " + err);
});

app.get("/categories/add",ensureLogin, (req, res) => {
    res.render('addCategory')
});

app.post("/categories/add",ensureLogin, (req, res) => {
    blog.addCategory(req.body).then(() => {
        res.redirect('/categories');
    }).catch(() => {
        console.log("Unable to Add category");
    })  
});

app.get("/categories/delete/:id",ensureLogin, (req, res) => {
    blog.deleteCategoryById(req.params.id).then(() => {
        res.redirect('/categories');
    }).catch(() => {
        console.log("Unable to Remove Category / Category not found)");
    })
});

app.get("/posts/delete/:id",ensureLogin, (req, res) => {
    blog.deletePostById(req.params.id).then(() => {
        res.redirect('/posts');
    }).catch(() => {
        console.log("Unable to Remove Post / Post not found");
    })
});

app.get("/login", (req, res) => {
  res.render('login');
})

// ========== Get Register Page Route ==========
app.get("/register", (req, res) => {
  res.render('register');
})

// ========== Post Login Page Route ==========
app.post("/login", (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/posts');
    })
    .catch((err) => {
      res.render('login', {errorMessage: err, userName: req.body.userName});
    });
})

// ========== Post Register Page Route ==========
app.post("/register", (req, res) => {
   authData.registerUser(req.body)
   .then(() => {
     res.render('register', { successMessage: 'User created' });
   })
   .catch((err) => {
     res.render('register', { errorMessage: err, userName: req.body.userName });
   });
})

// ========== Logout Route ==========
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
})

// ========== User History Route ==========
app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
}); 


// setup route for page not found if user enters something that doesn't matches with any route
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});