var posts = []
var categories = []
const { rejects } = require('assert');
// var postsJson = require('./data/posts.json');
// var categoriesJson = require('./data/catgories.json');
const fs = require('fs');
const path = require('path');

// module.exports.{initialize,getAllPosts,getPublishedPosts,getCategories} 

module.exports.initialize = function(){
    return new Promise(function(resolve, rejects){
        //reading posts
        fs.readFile(path.join(__dirname+'/data/posts.json'), 'utf8', (err, data) => {
            if (err) rejects(err);
            // console.log(data);
            posts = JSON.parse(data);
           });
        //reading categories
        fs.readFile(path.join(__dirname+'/data/categories.json'), 'utf8', (err, data) => {
            if (err) rejects(err);
            // console.log(data); 
            categories = JSON.parse(data);
           });
        resolve("data read successfully");
    })
}

module.exports.getAllPosts = function(){
    return new Promise(function(resolve,rejects ){
        if(posts.length == 0){
            rejects("posts JSON file empty");
        }
        resolve(posts);
    });
}

module.exports.getPublishedPosts = function(){
    return new Promise(function(resolve,rejects){
        var publishedPosts = posts.filter(post => post.published === true);
        if(publishedPosts.length == 0){
            rejects("No Published posts found");
        }
        resolve(publishedPosts);
    });
}

module.exports.getCategories = function(){
    return new Promise(function(resolve,rejects){
        if(categories.length === 0){
            rejects("No Categories found");
        }
        resolve(categories);
    });
}

const dateFormat = () => {
    let d = new Date();
    let day = d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();
    // console.log(`${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
}

module.exports.addPost = function(postData){
    return new Promise(function(resolve,rejects){
        if (postData.published == undefined){
            postData.published = false;
        }
        else{
            postData.published = true;
        }
        
        postData.id = posts.length + 1;
        postData.postDate = dateFormat();
        posts.push(postData);
        resolve(postData);
    });
}

module.exports.getPostsByCategory = function(category){
    return new Promise(function(resolve,rejects){
        var filteredPosts = posts.filter(post => post.category == category);
        if(filteredPosts.length == 0){
            rejects("No Posts with the selected category found");
        }
        resolve(filteredPosts);
    });
}

module.exports.getPostsByMinDate = function(minDateStr){
    return new Promise(function(resolve,rejects){
        var filteredPosts = [];
        for (var i = 0; i < posts.length; i++)
            if (new Date(posts[i].postDate) >= new Date(minDateStr))
                filteredPosts.push(posts[i]);
        if (filteredPosts.length == 0){
            rejects("No posts found with date after the selected minimum date");
        }
        resolve(filteredPosts);
    })
}

module.exports.getPostById = function(id){
    return new Promise(function(resolve,rejects){
        var filteredPosts = posts.filter(post => post.id == id);
        if( filteredPosts.length == 0){
            rejects("No posts found with ID selected");
        }
        resolve(filteredPosts);
    })
}

module.exports. getPublishedPostsByCategory = function(category){
    return new Promise(function(resolve,rejects){
        if (posts.length != 0) {
            var filteredPosts = posts.filter(post => post.published == true && post.category == category);
            resolve(filteredPosts);
        }
        else
            reject({message: 'No Data'});
    })
}