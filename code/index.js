//imports
const express = require('express');
const morgan = require('morgan');
const {Prohairesis} = require('prohairesis');
const bodyParser = require('body-parser');
const { response } = require('express');

const app = express();
const port = process.env.PORT || 8888;

// connection to heroku
// const mySQLString = 'mysql://b9a42c0a1b8343:7ec8508b@eu-cdbr-west-02.cleardb.net/heroku_252e1419c201912?reconnect=true';
//connection to local db - mysql
const mySQLString = 'mysql://root:asperina123@localhost/new_test_db?reconnect=true';
const database = new Prohairesis(mySQLString);


app
    .use(morgan('dev'))
    .use(express.static('public'))
    
    //parse application/x-www-form-urlencoded
    .use(bodyParser.urlencoded({extended: false}))

    //parse application/json
    .use(bodyParser.json())
    .post('/api/user', async (req,res) => {
        const body = req.body;
        
        await database.execute(`
            INSERT INTO user_data (
                firstname,
                lastname,
                email,
                date_added
            ) VALUES(
                @firstName,
                @lastName,
                @email,
                NOW()
            )
        `, {
            firstName: body.first,
            lastName: body.last,
            email: body.email,
        })

        res.end('Added user');
    })

    .listen(port, () => console.log(`Server listening on port ${port}`));