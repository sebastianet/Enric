
// Enric's first express code, 20150228.

// Estrucura de fitxers i directoris
//    app.js
//    <pagines>
//        index.htm
//        logon.htm
//        <css>
//            enric.css

// To run it, do:
//  a) start server with "node app.js"
//  b) start client with a browser pointing at "http://localhost:8956/"

// En aquest directori hem de fer:
//    *) gpm init - crea directori .git
//    *) npm init - crea package.json
//    *) npm install express --save          - installs "express" module into "node_modules" directory
//    *) npm install express-session --save  - installs session
//    *) npm install morgan  --save          - installs "morgan" module into "node_modules" directory
//    *) create .gitignore file from https://github.com/github/gitignore/blob/master/Node.gitignore -> include "node_modules" in it

	var express    = require( 'express' ) ;         // web framework for node.js - http://expressjs.com/api.html
	var http       = require( 'http' ) ;            // required to use the HTTP server - http://nodejs.org/api/http.html
	var monk       = require( 'monk' ) ;            // access to mongo
	var session    = require( 'express-session' ) ; // create "session" space in REQ
	var logger     = require( 'morgan' ) ;          // logging middleware - https://github.com/expressjs/morgan

	var app = express() ;                           // instantiate Express and assign our app variable to it
	var db  = monk( 'localhost:27017/cdt' ) ;       // BBDD := "cdt" ; port : http://docs.mongodb.org/manual/reference/default-mongodb-port/
	
	app.set( 'port', process.env.PORT || 8956 ) ;   // set "port" value for our app
	app.set( 'userscolname', "usuaris" ) ;          // collection name := "usuaris" ;

	app.use( session({secret:'secretsebas', resave:false, saveUninitialized:false}) ); // https://github.com/expressjs/session
	app.use( logger( "dev" ) ) ;                    // https://github.com/expressjs/morgan - tiny (minimal), dev (developer), common (apache)

	var myVersio   = "v 1.1.a" ;                    // identify our code

// Ara comença l'especificacio de MIDDLEWARES, o rutes que el Express() agafara segons els missatges HTTP que rebi
	
	var staticPath    =  __dirname + '/pagines';
	var staticOptions = { index: 'index.htm' };                     // provide "index.htm" instead of the default "index.html"
	app.get( '/*', express.static( staticPath, staticOptions ) ) ;  // configure express options


// rebem POST /logonuser/nom_Logon=Ivan&pwd_Logon=Grozniy

	app.post( '/logonuser/nom_Logon=:log_nom_soci&pwd_logon=:log_pwd', function( req, res ){

		var Logon_NomSoci = req.params.log_nom_soci ;
		var Logon_PwdUser = req.params.log_pwd ;

		console.log( ">>> POST un LOGON(). Nom (%s), pwd (%s).", Logon_NomSoci, Logon_PwdUser ) ;
	
		var CollectionName = app.get( 'userscolname' ) ;     // get collection name
		var MyUsersCollection = db.get( CollectionName ) ;   // get the collection
		console.log( ">>> Using USERS ddbb (" + MyUsersCollection.name + ")." ) ;

		MyUsersCollection.find( { nom: Logon_NomSoci }, { limit: 20 }, function( err, docs ){ 
		
			if ( err ) {
				console.log( '--- Logon MongoDB error. Error is (%s)', err.message ) ;
				res.status( 500 ) ; // internal error
				res.send( {'error':'mongodb error has occurred'} ) ;
			} else { // no ERR

				if ( docs ) {

				var  i = docs.length ;
					console.log( "+++ the collection (%s) for the user (%s) has (%s) elements.", CollectionName, Logon_NomSoci, i ) ;

					if ( i > 0 ) {
						console.log( '+++ user found. Lets see its PWD.' ) ;
						var ObjectId_User_at_bbdd = docs[0]._id ;
						var Logon_Pwd_From_bbdd   = docs[0].pwd ;
						console.log( 'PWD - bbdd [' + Logon_Pwd_From_bbdd + '], user [' + Logon_PwdUser + '].' ) ;
						
						if ( Logon_PwdUser == Logon_Pwd_From_bbdd ) {
							
							req.session.nomsoci = Logon_NomSoci ;       // guardar nom soci en la sessio
							var mSg = new Date() ;                      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now : time in milliseconds
							req.session.lastlogon = mSg.toISOString() ; 
							
							res.status( 200 ) ; // OK
							var szMsg_Logon_OK = "+++ logon and PWD OK. Last logon {"+ req.session.lastlogon + "}. "
							res.send( szMsg_Logon_OK ) ; 
						} else {
							console.log( '--- PWD not right.' ) ;
							res.send( 401,'user ('+ Logon_NomSoci + ') incorrect password ('+Logon_PwdUser+').' ) ;
						} ; // both passwords are the same ?

					} else {
						console.log( '--- USER NOT FOUND.' ) ;
						var rcstatus = 200 ; // 401 does not display the text we send 
						var rcbody = '--- logon failed : user ('+ Logon_NomSoci + ') not found.' ;
						res.status( rcstatus ).send( rcbody ) ; // res.send( 401,'user ('+ Logon_NomSoci + ') not found.' ) ;
					} ;
				} else {
					console.log( '--- no DOCS returned.' ) ;
					res.status( 404 ) ; // 404 ?
					res.send( "--- no DOCS." ) ; 
				} ; // if Docs
			} ; // if Error

		}) ; // find()
	

		
	}); // POST '/logonuser/nom_Logon=:log_nom_soci&pwd_logon=:log_pwd'

	

// create our http server and launch it

	http.createServer( app ).listen( app.get( 'port' ), function() {
		console.log( "Enric's express server " + myVersio + " listening on port [" + app.get( "port" ) + "]." ) ;
	} ) ; // create server
