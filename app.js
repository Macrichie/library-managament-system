var express = require('express');
var models = require('./models.js');
var os = require("os");

var User = models.User;
var Item = models.Item;

var app = express.createServer();
 
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('view options', {layout: false});
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "ABC" }));
	app.use(express.methodOverride());
	app.use(express.static(__dirname + '/public'));
	app.use(app.router);
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Routes
app.get('/', function(req,res){
	res.render("index");	
});

app.post('/login', function(req,res){
	var user = req.param('email',null);
	var password = req.param('password',null);
	User.check_login(user,password, function(result){	
		if ( result){
			var type = result.name;
			if ( ['privileged', 'normal', 'guest'].indexOf(type) != -1){
				res.redirect('/panel/normal');
			} else {
				res.redirect("/panel/" + type);				
			}
		} else {
			res.redirect("/wrong-login");
		}	
	});
});

app.get('/panel/:type/:menu?', function(req,res,next){
	if ( req.params.menu){
		next();
	} else {
		if ( ['admin', 'staff', 'normal'].indexOf(req.params.type) != -1){		
			res.render("panel", {type:req.params.type});
		} else {
			res.send(404);
		}
	}
});

// Normal User Menus
app.get('/panel/normal/home', function(req,res){
	res.render("personal-details");
});

app.get('/panel/normal/my-books', function(req,res){
	res.render("my-books");
});

app.get('/panel/normal/reserve-room', function(req,res){
	res.render("reserve-room");
});


// Admin Menus
app.get('/panel/admin/manage-staff', function(req,res){
	User.get_user_list(2, function(result){
		res.render("manage-staff", {users:result});
	});
});

app.get('/panel/admin/edit-constraints', function(req,res){
	res.render("edit-constraints");
});

// Staff Menus
app.get('/panel/staff/manage-users', function(req,res){
	res.render('manage-users');
});

app.get('/panel/staff/checkout/:userID?', function(req,res){
	if ( !req.params.userID){
		res.render("user-holdings", {userID : null, found: true});
	} else {
		User.user_details(req.params.userID, function(data){ 
			if ( data){
				res.render("user-holdings", {	
						userID : req.params.userID,
					 	name: data.name,
						birth: data.DateOfBirth,
						found: true
					});		
			} else {
				res.render("user-holdings", {userID: req.params.userID, found: false})
			}
		});
	}
});

app.get("/panel/staff/addItem",function(req,res){
	res.render("add-item");
});

app.get("/logout", function(req,res){
	req.session.destroy();
	res.redirect("/");
});	

app.get('/items/:keyword', function(req,res){
	Item.item_search(req.params.keyword, function(results){
		res.render("item-search-results", {items:results});
	});	
});

app.get('/item/:id/:category', function(req,res){
  	Item.item_details_category(req.params.id, req.params.category, function(result){
		res.render("item-details", {details: result});
  	});
});

app.get('/item/:id', function(req,res){
	Item.item_details(req.params.id, function(result){
		if ( result)
			res.render("item-details-checkin", {details: result});
		else
			res.render("item-details-checkin", {details: null});			
  	});
});

app.post("/admin/staff/add", function(req,res) {
	var name = req.param('name',null);
	var password = req.param('password',null);
	var birthday = req.param('birthday',null);
	User.add_staff(name, password, birthday, function(data){
		res.send(data);
	})
});

app.get("/staff/checkin/:user/:item", function(req,res){
	Item.check_in(req.params.user, req.params.item, function(data){
		res.send(JSON.stringify(data));
	});
});

app.post("/staff/add/book", function(req,res){
	var title = req.param('title', null);
	var location = req.param('location', null);
	var isBorrowable = req.param('isBorrwable', null);
	var ISBN = req.param('ISBN', null);
	var author = req.param('author', null);
	var publisher = req.param('publisher', null);
	var year = req.param('year', null);
	var category = req.param('category', null);
	Item.addBook(title, location, isBorrowable, ISBN, author, publisher, year, category, function(result){
		res.send(result);
	})
});


app.post("/staff/add/video", function(req,res){
	var title = req.param('title', null);
	var location = req.param('location', null);
	var isBorrowable = req.param('isBorrwable', null);
	var director = req.param('director', null);
	var year = req.param('year', null);
	var producer = req.param('producer', null);
	var duration = req.param('duration', null);
	Item.addVideo(title, location, isBorrowable, director, year, producer, duration, function(result){
		res.send(result);
	})
});

app.post("/staff/add/audio", function(req,res){
	var title = req.param('title', null);
	var location = req.param('location', null);
	var isBorrowable = req.param('isBorrwable', null);
	var year = req.param('year', null);
	var artist = req.param('artist', null);
	Item.addAudio(title, location, isBorrowable, year, artist, function(result){
		res.send(result);
	})
});

app.post("/staff/add/ematerial", function(req,res){
	var title = req.param('title', null);
	var location = req.param('location', null);
	var isBorrowable = req.param('isBorrwable', null);
	var URL = req.param('URL', null);
	Item.addEmaterial(title, location, isBorrowable, URL, function(result){
		res.send(result);
	})
});


app.listen(3000);
