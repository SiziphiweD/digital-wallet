const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const hbs = require('hbs');
const http = require('http');



const app = express();
app.use(express.urlencoded({ extended: false }))

app.use(express.json());
app.use(cors());

// USING HBS

const path = require("path");

const templatePath = path.join(__dirname, './templates');
const publicPath = path.join(__dirname, './public');

app.set('view engine', 'hbs');
app.set('views', templatePath);
app.use(express.static(publicPath));

// PAGES

app.get('/', (req, res) => {
    res.render('signup');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login')
});

app.get('/deposit', async (req, res) => {
    res.render('deposit', {
        id: req.query.id
    });
});

app.get('/airtime', (req, res) => {
    res.render('airtime', {
        id: req.query.id
    });
});

app.get('/electricity', (req, res) => {
    res.render('electricity', {
        id: req.query.id
    });
});

app.get('/transfer', (req, res) => {
    res.render('transfer', {
        id: req.query.id
    });
});

app.get('/transaction_history', (req, res) => {
    res.render('transaction_history')
});

// PAGES

mongoose.connect("mongodb://127.0.0.1:27017/wallet", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to DB"))
.catch(console.error);

const Users = require("./models/db");

app.post('/new-user', (req, res) => {
    const md5Hash = crypto.createHash('md5');
    md5Hash.update(req.body.password);

    const newUser = new Users({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        account_number: 1234567898,
        phone_number: req.body.phone_number,
        password: md5Hash.digest('hex'),
        balance : 0

    });

    newUser.save();

    const redirectURL = `http://${req.headers.host}/home?id=${newUser.id}&message=Successfully Signed Up!`
    res.status(201).redirect(redirectURL);m
    
});

app.post('/login', async (req, res) => {
    const user = await Users.findOne( { email: req.body.email });
    
    const md5Hash = crypto.createHash('md5');
    md5Hash.update(req.body.password);

    if (user.password === md5Hash.digest('hex')) {
        const redirectURL = `http://${req.headers.host}/home?id=${user.id}&message=Successfully Signed In!`
        res.status(201).redirect(redirectURL);
    } else {
        res.status(200).render('login', {
            naming: 'Invalid username or password!'
        });
    }
});

app.get('/users', async (req, res) => {
    const users = await Users.find();
    res.json(users);
});

app.get('/delete-user/:id', async (req, res) => {
    const user = await Users.findByIdAndDelete(req.params.id);
    res.json(user);
});

app.post('/balance', async (req, res) => {
    const user = new balance({
         balance : 0});
    user.save();
});

app.get('/transaction-history/:id', async (req, res) => {
    const user = await Users.findById(req.params.id);
    res.json(user.transactionHistory);
});

app.post('/deposit-funds/:id', async (req, res) => {
    const user = await Users.findById(req.params.id);
    const balance = parseFloat(user.balance) + parseFloat(req.body.amount);
    user.balance = balance;

    user.transactionHistory.push({ description: "USER DEPOSITED MONEY", amount: req.body.amount });

    user.save();
    
    const redirectURL = `http://${req.headers.host}/home?id=${user.id}&message=Successfully Deposited Money!`;
    res.status(201).redirect(redirectURL);

});

app.get('/home', async (req, res) => {
    let id = req.query.id;

    const user = await Users.findById(id);

    let firstname = user.firstname;
    let balance = user.balance;
    let message = req.query.message;
    

    res.status(201).render('home', {
        firstname,
        balance,
        id,
        message
    });

});

app.post('/buy-electricity/:id', async (req, res) => {
    const user = await Users.findById(req.params.id);
    const token = 12345432123;
    if (user.balance - req.body.amount < 0){
        res.json("User does'nt have enough funds");
    }else{
        user.balance = user.balance - req.body.amount;

        user.transactionHistory.push({ description: "Successfully Bought ELECTRICITY", amount: req.body.amount });

    }
    user.save();
    let message = 'Successfully Bought Electricity!';
    const redirectURL = `http://${req.headers.host}/home?id=${user.id}&message=${message}`;
    res.status(201).redirect(redirectURL);

});

app.post('/buy-airtime/:id', async (req, res) => {
    const user = await Users.findById(req.params.id);
    const { amount, network } = req.body;
    const voucher = 12345676543223456;

    if (user.balance - amount < 0) {
        res.json("User doesn't have enough funds");
    } else {
        user.balance = user.balance - amount;
        user.transactionHistory.push({ description: `Successfully Bought AIRTIME for ${network}`, amount: req.body.amount });
    }

    user.save();
    const redirectURL = `http://${req.headers.host}/home?id=${user.id}&message=Successfully Bought Airtime!`;
    res.status(201).redirect(redirectURL);
});

app.post('/send-money/:id', async (req, res) => {
    // try {
        const senderId = req.params.id;
        const receiverPhoneNumber = req.body.phone_number;
        const amount = req.body.amount;

        // const balance = parseFloat(user.balance) + parseFloat(req.body.amount);
        let balance = 0;

        const receiver = await Users.findOne({ phone_number: receiverPhoneNumber });

        if (!receiver) {
            return res.status(404).json("Receiver not found");
        }

        const sender = await Users.findById(senderId);

        if (!sender) {
            return res.status(404).json("Sender not found");
        }

        if (parseFloat(sender.balance) < parseFloat(amount)) {
            return res.status(400).json("Sender doesn't have enough funds");
        }

        balance = parseFloat(receiver.balance) + parseFloat(amount)
        receiver.balance = balance;
        receiver.transactionHistory.push({ description: `Money in +R${amount}`, amount: req.body.amount });

        balance = parseFloat(sender.balance) - parseFloat(amount)
        sender.balance = balance;
        sender.transactionHistory.push({ description: `Money out -R${amount}`, amount: req.body.amount });
        
        receiver.save();
        sender.save();

        const redirectURL = `http://${req.headers.host}/home?id=${sender.id}&message=Successfully Transfered Money!`;
        res.status(201).redirect(redirectURL);
    //  } catch (error) {
    //      return res.status(500).json("Error processing the request");
    //  }
});



app.listen(3001, () => console.log("Server started on port 3001"));