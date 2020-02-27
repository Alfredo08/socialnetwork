const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const knex = require( 'knex' );
const xss = require( 'xss' );
const sqlString = require( 'sqlstring' );
const bcrypt = require( 'bcryptjs' );
const jsonwebtoken = require( 'jsonwebtoken' );

const jsonParser = bodyParser.json();
const app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
    if (req.method === "OPTIONS") {
      return res.send(204);
    }
    next();
  });

const database = knex({
    client: 'pg',
    connection : 'postgresql://alfredosalazar@localhost/socialnetwork'
});

app.post( '/api/login', jsonParser, ( req, res ) => {

    let { username, password } = req.body;

    console.log( username, password );
    //let t = database.raw(`SELECT * FROM users WHERE username=${sqlString.escape(username)} AND password = ${sqlString.escape(password)}`)
    let t = database
        .select( '*' )
        .from( 'users' )
        .where({
            username
        })
    //console.log(t.toQuery());
    //console.log( 'xss', xss( t.toQuery()) );
    //console.log( 'sqlstring', sqlString.escape( t.toQuery()) );
    console.log( t.toSQL().toNative());
    t.then( result => {

        if( result.length > 0 ){
            /*bcrypt.hash(password, 10)
                .then( newpass => {
                    console.log("DB", result[0].password);
                    console.log("New", newpass);
                }) */
            bcrypt.compare(password, result[0].password)
                .then( compareResult => {
                    console.log( compareResult );
                    if ( compareResult ){
                        
                        jsonwebtoken.sign({user: username, firstname : result[0].firstname, lastname : result[0].lastname}, 'shhhhh', {expiresIn: 60 * 2 /* Expire in two minutes*/},function(err, token) {
                            if( err ){
                                console.log( "issue with token!");
                            }
                            else{
                                console.log(token);
                                return res.status(200).json({
                                    message : `Welcome back ${username}`,
                                    token : token       
                                });
                            }
                            
                        });

                    }
                    else{
                        throw new Error( "Please verify your credentials");
                    }
                    
                })
                .catch( err => {
                    res.statusMessage = err;
                    return res.status(404).send();
                });
        }
        else{
            throw new Error( "That user doesn't exist! ");
        }


    })
    .catch( err => {
        res.statusMessage = err;
        return res.status(404).send();
    });

});

app.post( '/api/create-user', jsonParser, ( req, res ) => {

    let { username, password, firstname, lastname } = req.body;

    bcrypt.hash( password, 10 )
        .then( hashPassword => {
            console.log( hashPassword );
            let newUser = {
                username,
                password : hashPassword,
                firstname,
                lastname
            }

            database
                .insert( newUser )
                .into( 'users' )
                .returning('*')
                .then( userCreated => {
                    console.log( userCreated );
                    return res.status(200).json({message : "userCreated"});
                })
                .catch( err => {
                    res.statusMessage = "Something wen wrong. Try again later.";
                    return res.status(404).send();
                });
        });
});

app.get( '/api/current-user', ( req, res ) => {
    let token = req.headers.authorization;
    token = token.split(' ')[1];
    console.log( token )
    jsonwebtoken.verify(token, 'shhhhh', function(err, decoded) {
        console.log( decoded )
        if ( err ){
            return res.sendStatus(401);
        }
        else{
            return res.status(200).json( decoded );
        }
    });

});

app.listen( 8080, () =>{
    console.log( "Server running in port 8080." );
});


