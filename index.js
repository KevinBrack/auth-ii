const express = require("express");
const server = express();
const bcrypt = require("bcryptjs");
const db = require("./data/db");
const jwt = require("jsonwebtoken");
const secret = "nobody tosses a dwarf!";

// token generator
function generateToken(user) {
  const payload = {
    username: user.user_name
  };

  const options = {
    expiresIn: "4h"
  };

  return jwt.sign(payload, secret, options);
}

// protected function
function protected(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, secret, (err, decodedToken) => {
      if (err) {
        res.status(401).json({ error: "You shall not pass!" });
      }

      req.jwtToken = decodedToken;
      next();
    });
  } else {
    res.status(401).json({ error: "You shall not pass!" });
  }
}

// use middleware
server.use(express.json());

// endpoints
server.get("/", (req, res) => {
  res.status(200).json("up and running...");
});

// POST /api/register
server.post("/api/register", (req, res) => {
  const new_user = req.body;
  const hash = bcrypt.hashSync(new_user.password, 10);
  new_user.password = hash;
  db("users")
    .insert(new_user)
    .into("users")
    .then(user_id => {
      // generate the token
      const token = generateToken(new_user);
      // attatch the token to the response
      res.status(200).json({ token, user_id });
    })
    .catch(error => res.status(500).json(error.message));
});

// POST /api/login
server.post("/api/login", (req, res) => {
  const credentials = req.body;

  db("users")
    .where({ user_name: credentials.user_name })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(credentials.password, user.password)) {
        // generate the token
        const token = generateToken(user);

        // attach the token to the response
        res.json(token);
      } else {
        return res.status(401).json({ error: "You shall not pass!" });
      }
    })
    .catch(error => res.status(500).json(error.message));
});

// GET /api/users
server.get("/api/users", protected, (req, res) => {
  console.log("token", req.jwtToken);
  db("users")
    .then(users => {
      res.json(users);
    })
    .catch(err => res.status(500).json(error.message));
});

// run server
const port = 8000;
server.listen(port, () => {
  console.log(`\n=== WEEB API LISTENING ON HTTP://LOCALHOST:${port} ===`);
});
