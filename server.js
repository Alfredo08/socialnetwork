const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const knex = require( 'knex' );
const xss = require( 'xss' );
const sqlString = require( 'sqlstring' );

const jsonParser = bodyParser.json();
const app = express();

const database = knex({
    client: 'pg',
    connection : 'postgresql://alfredosalazar@localhost/socialnetwork'
});

app.post( '/api/login', jsonParser, ( req, res ) => {

    let { username, password } = req.body;

    console.log( username, password );
    let t = database.raw(`SELECT * FROM users WHERE username=${sqlString.escape(username)} AND password = ${sqlString.escape(password)}`)
    /*let t = database
        .select( '*' )
        .from( 'users' )
        .where({
            username,
            password
        }) */
    //console.log(t.toQuery());
    //console.log( 'xss', xss( t.toQuery()) );
    console.log( 'sqlstring', sqlString.escape( t.toQuery()) );
    //console.log( t.toSQL().toNative());
        t.then( result => {

            //if( result.length > 0 ){
                return res.status(200).json({user: result})
            //}

            //throw new Error( "That user doesn't exist! ");
        })
        .catch( err => {
            res.statusMessage = "That user doesn't exist!";
            return res.status(404).send();
        });

});

app.listen( 8080, () =>{
    console.log( "Server running in port 8080." );
});


