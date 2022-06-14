//imports
const express = require('express');
const morgan = require('morgan');
const {Prohairesis} = require('prohairesis');
const bodyParser = require('body-parser');
const { response } = require('express');
// const format = require('date-format');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 8888;

// connection to heroku
const mySQLString = 'mysql://b9a42c0a1b8343:7ec8508b@eu-cdbr-west-02.cleardb.net/heroku_252e1419c201912?reconnect=true';
//connection to local db - mysql
// const mySQLString = 'mysql://root:asperina123@localhost/new_test_db?reconnect=true';
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

        let jsonResponse = {status: "OK",message: "User was added"};
        res.status(200).json(jsonResponse);
    })

    .get('/api/getAllData', async (req,res) => {
        const body = req.body;
        
        let results = await database.query(`
        select * from user_data order by id desc
        `)

        let data = [];
        results.forEach(function(el){
            data.push([
                '<a href="/detail.html?id='+el.id+'">'+el.id+'</a>',
                el.firstname,
                el.lastname,
                el.email,
                moment(el.date_added).format("dddd, MMMM Do YYYY, h:mm:ss a"),
                '<button type="button" data-delete="'+el.id+'">Delete</button>'
            ]);
        })

        let jsonResponse = {data: data};
        res.status(200).json(jsonResponse);

    })

    .get('/api/user/detail', async (req,res) => {
        const body = req.query;
        
        let results = await database.getOne(`
        select * from user_data where id = @id
        `,{
            id: body.id,
        })


        let jsonResponse = {status: "OK",data: results};
        res.status(200).json(jsonResponse);

    })

    .post('/api/user/update', async (req,res) => {
        const body = req.body;
        
        await database.execute(`
        UPDATE user_data SET firstname = @firstname, lastname = @lastname, email = @email
        WHERE id = @id
        `,{
            firstname: body.first,
            id: body.id,
            lastname: body.last,
            email: body.email
        })


        let jsonResponse = {status: "OK",message: "User updated"};
        res.status(200).json(jsonResponse);

    })

    .post('/api/user/delete', async (req,res) => {
        const body = req.body;
        
        await database.execute(`
        DELETE FROM user_data 
        WHERE id = @id
        `,{
            id: body.id,
        })


        let jsonResponse = {status: "OK",message: "User deleted"};
        res.status(200).json(jsonResponse);

    })

    .listen(port, () => console.log(`Server listening on port ${port}`));