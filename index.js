const express = require("express");
const cors = require("cors");
require("dotenv").config();
require('./db/config');
const User = require("./db/User");
const ShortUrl = require("./db/shortUrl")

const Jwt = require('jsonwebtoken');
const jwtKey = process.env.jwtKey;

const app = express();
app.use(cors());
const port = process.env.PORT || 5000;

//const corsOptions = {
// origin: 'https://e-com-dasboard.netlify.app',
// optionsSuccessStatus: 200,
//};

// app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/register", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: "Something went wrong,Please try after sometime." })
        }
        resp.send({ result, auth: token })
    })
})

app.post("/login", async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something went wrong,Please try after sometime." })
                }
                resp.send({ user, auth: token })
            })
        } else {
            resp.send({ result: "No user found" })
        }
    } else {
        resp.send({ result: "No user found" })
    }
});

app.get('/shortUrls', async (req, res) => {
    try {
      const shortUrls = await ShortUrl.find();
      res.json(shortUrls);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/shortUrls', async (req, res) => {
    const { fullUrl } = req.body;
    try {
      const shortUrl = await ShortUrl.create({ full: fullUrl });
      res.status(201).json(shortUrl);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    try {
      const url = await ShortUrl.findOne({ short: shortUrl });
      if (url == null) return res.sendStatus(404);
      url.clicks++;
      await url.save();
      res.redirect(url.full);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});