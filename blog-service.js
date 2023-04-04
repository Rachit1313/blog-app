const Sequelize = require('sequelize');
var sequelize = new Sequelize('wekmliyg', 'wekmliyg', 'lJAJNk4ztf26qJC3-VgMJI3C3JC7-nx2', {
    host: 'ruby.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
    ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
   });

var Post = sequelize.define('Post',{
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published:Sequelize.BOOLEAN,
})

var Category = sequelize.define('Category',{
    category: Sequelize.STRING,
})

Post.belongsTo(Category, {foreignKey: 'category'})

module.exports.initialize = function(){
    return new Promise(function(resolve, reject) {
        sequelize.sync().then(() => {
            resolve("Successfull");
        }).catch(() => {
            reject("unable to sync the database");
        })
    });
}

module.exports.getAllPosts = function(){
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function() {
            Post.findAll().then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned");
            })
        })
    });
}

module.exports.getPublishedPosts = function(){
    return new Promise(function(resolve, reject) {
        sequelize.sync().then(function() {
            Post.findAll({
                where: {
                    published: true
                }
            }).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned");
            })
        })
    });
}

module.exports.getCategories = function(){
    return new Promise((resolve, reject) => {
        sequelize.sync().then(() => {
            Category.findAll().then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned");
            })
        })
    });
};

module.exports.addPost = function(postData){
    return new Promise((resolve, reject) => {
        postData.published = (postData.published) ? true : false;
        if(postData.body == "") postData.body = null;
        if(postData.title == "") postData.title = null;
        if(postData.postDate == "") postData.postDate = null;
        if(postData.featureImage == "") postData.featureImage = null;
        if(postData.category == "") postData.category = null;
        postData.postDate = new Date();
        sequelize.sync().then(() => {
            Post.create(postData).then(() => {
                resolve("Post Added successfully");
            }).catch(() => {
                reject("unable to create post");
            })
        })
    });
}

module.exports.getPostsByCategory = function(category){
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function() {
            Post.findAll({
                where: {
                    category: category
                }
            }).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned");
            })
        })
    });
}

module.exports.getPostsByMinDate = function(minDateStr){
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function() {
            Post.findAll({
                where: {
                    postDate: {
                        [gte] : new Date(minDateStr)
                    }
                }
            }).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned");
            })
        })
    });
}

module.exports.getPostById = function(id){
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function() {
            Post.findAll({
                where: {
                    id: id
                }
            }).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned");
            })
        })
    });

}

module.exports. getPublishedPostsByCategory = function(category){
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function() {
            Post.findAll({
                where: {
                    published: true,
                    category: category
                }
            }).then((data) => {
                resolve(data);
            }).catch((err) => {
                reject("no results returned");
            })
        })
    });
}

module.exports.addCategory = function(categoryData){
    return new Promise ((resolve,reject)=>{
        if (categoryData.category == "")
            categoryData.category = null;
        sequelize.sync().then(function(){
            Category.create(categoryData).then(() => {
                resolve("Category added");
            }).catch(() => {
                reject("unable to create category");
            })
        })
    })
}

module.exports.deleteCategoryById = function(id){
    return new Promise ((resolve,reject)=>{
        sequelize.sync().then(function(){
            Category.destroy({
                where: {
                    id: id
                }
            }).then(() => {
                resolve("Data was Deleted");
            }).catch(() => {
                reject("Unable to delete category")
            });
        })
    })
}

module.exports.deletePostById = function(id){
    return new Promise ((resolve,reject)=>{
        sequelize.sync().then(function(){
            Post.destroy({
                where: {
                    id: id
                }
            }).then(() => {
                resolve("Data was Deleted")
            }).catch(() => {
                reject("Unable to delete category")
            });
        })
    })
}