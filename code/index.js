//imports
const express = require("express");
const morgan = require("morgan");
const { Prohairesis } = require("prohairesis");
const bodyParser = require("body-parser");
const { response } = require("express");
// const format = require('date-format');
const moment = require("moment");
//session library node js
const session = require("express-session");
const path = require('path');
//encrypting password
const bcrypt = require("bcrypt");



const app = express();
const port = process.env.PORT || 8888;

// connection to heroku
const mySQLString = 'mysql://b9a42c0a1b8343:7ec8508b@eu-cdbr-west-02.cleardb.net/heroku_252e1419c201912?reconnect=true';
//connection to local db - mysql
// const mySQLString =
//   "mysql://root:asperina123@localhost/new_test_db?reconnect=true";
const database = new Prohairesis(mySQLString);

app

  .use(
    session({
      secret: "secret",
      resave: true,
      saveUninitialized: true
    })
  )

  .use(morgan("dev"))
//   .use('/',express.static("public"))
    .use('/static', express.static(path.join(__dirname, 'static')))
  //parse application/x-www-form-urlencoded
  .use(bodyParser.urlencoded({ extended: false }))

  //parse application/json
  .use(bodyParser.json())


//   .get('/login', function(request, response) {
// 	// Render login template
// 	response.sendFile(path.join(__dirname+'/public' + '/index.html'));
// })


// to load dashboard when logged in 
.get("/", (req, res) => {
	// If the user is loggedin
	if (!req.session.loggedin) {
		// Output username
		res.sendFile(path.join(__dirname+'/public' + '/index.html'));
	} else {
		// logged in
        res.redirect('/dashboard');
	}

  })

.post('/auth',async function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		let results = await database.query('SELECT * FROM accounts WHERE username = @username', 
        {username: username, password: password});
			if (results.length > 0) {
                console.log(results);
                const validPassword = await bcrypt.compare(password, results[0].password);
                console.log(validPassword);
                if(validPassword){
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
				// Redirect to home page
				response.redirect('/dashboard');
                // response.sendFile(path.join(__dirname+'/public' + '/index.html'));
                }else{
                    response.send('Incorrect Username and/or Password!');

                }

            } else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
})

.get('/dashboard', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.sendFile(path.join(__dirname+'/public' + '/dashboard.html'));
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	// response.end();
})

.get('/register', function(request, response) {
	// If the user is loggedin
	if (!request.session.loggedin) {
		// Output username
		response.sendFile(path.join(__dirname+'/public' + '/register.html'));
	} else {
		// logged in
		response.sendFile(path.join(__dirname+'/public' + '/dashboard.html'));
	}
	// response.end();
})


  .post("/api/user", async (req, res) => {
    const body = req.body;

    await database.execute(
      `
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
        `,
      {
        firstName: body.first,
        lastName: body.last,
        email: body.email
      }
    );

    let jsonResponse = { status: "OK", message: "User was added" };
    res.status(200).json(jsonResponse);
  })

  .get("/api/getAllData", async (req, res) => {
    const body = req.body;

    let results = await database.query(`
        select * from user_data order by id desc
        `);

    let data = [];
    results.forEach(function (el) {
      data.push([
        '<a href="/detail.html?id=' + el.id + '">' + el.id + "</a>",
        el.firstname,
        el.lastname,
        el.email,
        moment(el.date_added).format("dddd, MMMM Do YYYY, h:mm:ss a"),
        '<button type="button" data-delete="' + el.id + '">Delete</button>'
      ]);
    });

    let jsonResponse = { data: data };
    res.status(200).json(jsonResponse);
  })

  .get("/api/user/detail", async (req, res) => {
    const body = req.query;

    let results = await database.getOne(
      `
        select * from user_data where id = @id
        `,
      {
        id: body.id
      }
    );

    let jsonResponse = { status: "OK", data: results };
    res.status(200).json(jsonResponse);
  })

  .post("/api/user/update", async (req, res) => {
    const body = req.body;

    await database.execute(
      `
        UPDATE user_data SET firstname = @firstname, lastname = @lastname, email = @email
        WHERE id = @id
        `,
      {
        firstname: body.first,
        id: body.id,
        lastname: body.last,
        email: body.email
      }
    );

    let jsonResponse = { status: "OK", message: "User updated" };
    res.status(200).json(jsonResponse);
  })

  .post("/api/user/delete", async (req, res) => {
    const body = req.body;

    await database.execute(
      `
        DELETE FROM user_data 
        WHERE id = @id
        `,
      {
        id: body.id
      }
    );

    let jsonResponse = { status: "OK", message: "User deleted" };
    res.status(200).json(jsonResponse);
  })

  .post("/register/user", async (req, res) => {
    const body = req.body;
    const salt = await bcrypt.genSalt(10);
    let plainPassword = body.password;

    const encryptedPassword = await bcrypt.hash(plainPassword, salt);


    await database.execute(
      `
            INSERT INTO accounts (
                username,
                password,
                email
            ) VALUES(
                @username,
                @password,
                @email
            )
        `,
      {
        username: body.username,
        password: encryptedPassword,
        email: body.email
      }
    );
    req.session.loggedin = true;
    req.session.username = body.username;
	res.redirect('/dashboard');
    res.end();

  })

  .post("/logout", (req, res) => {

    req.session.loggedin = false;
    req.session.username = '';
	res.redirect('/');
    res.end();

  })

  .use(function(req, res, next){
    res.status(404);
    res.send('Not found');
  })

  .listen(port, () => console.log(`Server listening on port ${port}`));
