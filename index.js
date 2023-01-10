//   index.js
// * Project 
// *
// * Revision History
// * John Cristopher Danez, 2022.11.29: Created



// import the modules needed
const EXPRESS = require('express');
const PATH = require('path');


//set up express validator
const{check, validationResult} = require('express-validator'); //es6 destructuring an object;
// create express app
var app = EXPRESS();


//import session
const SESSION = require('express-session'); 


const FILE_UPLOAD = require('express-fileupload');


//database part

//import mongoose
// DB step 1.
const MONGOOSE = require('mongoose');

// DB step 2.
// connect to the database
MONGOOSE.connect('mongodb://localhost:27017/ticketData');

// DB step 3. model definition for ticket
const TICKET = MONGOOSE.model('Ticket',{
    uNumber: String,
    uName: String,
    uContact: String,
    description: String,
    uImageName: String
})

//model definition for admin credentials
const ADMIN_CRED = MONGOOSE.model('AdminCred',{
    userName: String,
    uPassword: String
})


//middlewares and other setup
app.use(EXPRESS.static(__dirname + '/public')); // THIS MEANS that every time youre finding a static file, look at the public``3
//define view engine and views
app.set('view engine', 'ejs');
//app.set('views', './views');
app.set('views', PATH.join( __dirname, 'views')); //alternative...make sure to use views
//SETUP body parser
app.use(EXPRESS.urlencoded({extended:false}));
app.use(FILE_UPLOAD());



app.use(SESSION({
    secret: 'thisISmyProject!!!', //should be unique for each application
    resave:false,
    saveUninitialized: true
}))


//routes

//homepage
app.get('/', function(req, res){
    res.render('newrequest'); //render newrequest.ejs file from the views folder
});


//login
app.get('/login', function(req, res){
    res.render('login'); //render login.ejs file from the views folder
});


//logout
app.get('/logout', function(req, res){
    req.session.userName = ''; // reset the username
    req.session.loggedIn = false; //make logged in sesion closed
    res.redirect('/login');    
});


//dashboard
app.get('/dashboard', function(req, res){


    if (req.session.loggedIn){ //by default is true
        //show the list
        TICKET.find({}).exec(function(err, tickets){
            var pageData = {
                tickets:tickets
            }
            
            res.render('dashboard', pageData)
        });

    }
    else{
        //redirectto the login page if session
        res.redirect('/login');
    }



});


//screen when deleting a ticket
app.get('/delete/:id',function(req, res){
   
    if (req.session.loggedIn){

        var id = req.params.id;
        TICKET.findByIdAndDelete({_id:id}).exec(function(err,ticket){
            
            // if not found
            var message = 'No entry found.';

            if (ticket){
                message = 'Successfully deleted.'
            }

            var pageData = {
                message: message
            }
    
            res.render('deletesuccess', pageData);
        });
         
    }
    else{
        res.redirect('/login');
    }


});

//screen when viewing a ticket
app.get('/view/:id',function(req, res){
    
    if (req.session.loggedIn){
        var id = req.params.id;
        // res.send('the id is ' + id); 
    
        TICKET.findOne({_id:id}).exec(function(err,ticket){
    
            var pageData = {
                uNumber: ticket.uNumber,
                uName : ticket.uName,
                uContact : ticket.uContact,
                description : ticket.description,
                uImageName: ticket.uImageName
            }
    
            res.render('view', pageData);
        });
         
    }
    else{
        res.redirect('/login');
    }

});


//screen when editing a ticket
app.get('/edit/:id',function(req, res){
   

    if (req.session.loggedIn){
        var id = req.params.id;    
        TICKET.findOne({_id:id}).exec(function(err,ticket){
    
            var pageData = {
                uName : ticket.uName,
                uContact : ticket.uContact,
                description : ticket.description,
                uImageName: ticket.uImageName,
                id: id
            }
    
            res.render('edit', pageData);
        });
         
    }
    else{
        res.redirect('/login');
    }

});


// what happens when user logs in
 app.post('/loginAttempt', function(req, res){
  
    //fetch input
    var userName = req.body.userName;
    var uPassword = req.body.uPassword;



    //find in database
    ADMIN_CRED.findOne({userName:userName, uPassword:uPassword}).exec(function(err, admin_yes){

        if(admin_yes){ //would be true if there is data returned in admin user

            //save in session
           
            req.session.userName = admin_yes.userName;
            req.session.loggedIn = true;
            

            res.redirect('/dashboard');
        }

        else{

            var pageData={
                error : 'Login details are not correct.'
            }
            res.render('login', pageData);

        }
       
    });

 });


//processing the new request submission
app.post('/process', function(req, res){

   //fetch data 
   var uName = req.body.uName;
   var uContact = req.body.uContact;
   var description = req.body.description;
   var uNumber = 'INC'+ (Math.floor(10000*Math.random())); 


    //fetch the image
  
    var uImage = req.files.uImage;

    //fetch the image name 

    var uImageName = req.files.uImage.name;

    var uImagePath = 'public/uploads/' + uImageName;
    uImage.mv(uImagePath);


   var pageData = {
        uNumber: uNumber,
        uName: uName,
        uContact: uContact,
        description: description,
        uImageName: uImageName
   }

   var newTicket = new TICKET(pageData); // create new object using the model
   newTicket.save(); //save into DB

   res.render('success');
   
});


// post route for editing the form 
app.post('/editProcess', function(req, res){

    //fetch data 
    var uName = req.body.uName;
    var uContact = req.body.uContact;
    var description = req.body.description;


     //fetch the image
     var id = req.body.id; 
     var uImage = req.files.uImage;
 
     //fetch the image name 
     var uImageName = req.files.uImage.name;
     var uImagePath = 'public/uploads/' + uImageName;
     uImage.mv(uImagePath);

             
     TICKET.findOne({_id:id}).exec(function(err,ticket){
        ticket.uName =  uName;
        ticket.uContact =  uContact;
        ticket.description =  description;
        ticket.uImageName =  uImageName;
        ticket.save(); // SAVING to DB

    });
 

 
    res.render('editsuccess'); //shows successful
    
 });


 //this is temp and for creating admin credentials
app.get('/setup',function(req, res){

    var adminData = {
        userName : 'admin',
        uPassword : 'admin'
    }

    var administrator = new ADMIN_CRED(adminData);
    administrator.save();
    res.send('Done');
});


//listen at a port
app.listen(8080);
console.log('Open http://localhost:8080 in your browser');