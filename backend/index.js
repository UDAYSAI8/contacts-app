import express, { json } from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./models/userModel.js";
import Contact from "./models/contactModel.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(json());

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://budaysaireddy:Uday2286@cluster0.eajzt7u.mongodb.net/Contact-app")
.then(() => {console.log("Database connected successfully");});

app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "API running successfully!",
  });
});

const generateToken = (user_id) => {
  const token = jwt.sign(
    {
      user_id,
    },
    "secret",
    { expiresIn: "1d" }
  );

  return token;
};

const checkToken = (req, res, next) => {
  // console.log("hi");

  // console.log(req.headers);

  let token = req.headers.authorization;

  // token present or not
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized!",
    });
  }

  // console.log(token);

  // check validity of the token
  try {
    token = token.split(" ")[1];

    let decodedToken = jwt.verify(token, "secret");

    req.user_id = decodedToken.user_id;

    next();
  } catch {
    return res.status(401).json({
      message: "Unauthorized!",
    });
  }
};

// USER API
app.post("/register", (req, res) => {
  const name = req.body.name;
  const username = req.body.username;
  const password = req.body.password;

  if (!name || !username || !password) {
    return res.status(400).json({
      message: "Please fill all fields!",
    });
  }

  User.findOne({
    username: username,
  }).then((data, err) => {
    if (err) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    if (data) {
      return res.status(409).json({
        message: "Username already used",
      });
    } else {
      const saltRounds = 10;
      const salt = bcrypt.genSaltSync(saltRounds);
      const encryptedPassword = bcrypt.hashSync(password, salt);

      User.create({
        name: name,
        username: username,
        password: encryptedPassword,
      }).then((data, err) => {
        if (err) {
          return res.status(500).json({
            message: "Internal Server Error",
          });
        }

        return res.status(201).json({
          message: "User registered successfully!",
          user: data,
          token: generateToken(data._id),
        });
      });
    }
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      message: "Please fill all fields!",
    });
  }

  User.findOne({
    username: username,
  }).then((data, err) => {
    if (err) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    if (data) {
      const isMatch = bcrypt.compareSync(password, data.password);

      if (isMatch) {
        return res.status(200).json({
          message: "User validated successfully!",
          user: data,
          token: generateToken(data._id),
        });
      } else {
        return res.status(401).json({
          message: "Invalid Credentials",
        });
      }
    } else {
      return res.status(404).json({
        message: "User not found!",
      });
    }
  });
});

// CONTACTS API
app.get("/get-contacts", checkToken, (req, res) => {
  // assuming we are getting _id of logged in person
  const user_id = req.user_id;
  // const user_id = req.params.user_id;

  Contact.find({
    user_id,
  }).then((data, err) => {
    if (err) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    if (data) {
      return res.status(200).json({
        message: "Contacts fetched successfully!",
        contacts: data,
      });
    }
  });
});

app.post("/add-contact", checkToken, (req, res) => {
  // const user_id = req.params.user_id;
  const user_id = req.user_id;
  const name = req.body.name;
  const number = req.body.number;

  Contact.create({
    user_id,
    name,
    number,
  }).then((data, err) => {
    if (err) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    if (data) {
      return res.status(201).json({
        message: "Contact added successfully!",
        contact: data,
      });
    }
  });
});

// change http method later
app.patch("/update-contact/:contact_id", checkToken, (req, res) => {
  const contact_id = req.params.contact_id;
  const number = req.body.number;

  if (!contact_id || !number) {
    return res.status(400).json({
      message: "Please provide all fields.",
    });
  }

  Contact.findById({ _id: contact_id }).then((data, err) => {
    if (err) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    if (data) {
      if (data.user_id !== req.user_id) {
        return res.status(404).json({
          message: "Contact not found!",
        });
      } else {
        Contact.findByIdAndUpdate(
          {
            _id: contact_id,
          },
          {
            number,
          },
          {
            new: true,
          }
        ).then((data, err) => {
          if (err) {
            return res.status(500).json({
              message: "Internal Server Error",
            });
          }

          if (data) {
            return res.status(200).json({
              message: "Contact updated successfully!",
              contact: data,
            });
          }
        });
      }
    }
  });
});

app.delete("/delete-contact/:contact_id", checkToken, (req, res) => {
  const contact_id = req.params.contact_id;

  Contact.findById({ _id: contact_id }).then((data, err) => {
    if (err) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    if (data) {
      if (data.user_id !== req.user_id) {
        return res.status(404).json({
          message: "Contact not found!",
        });
      } else {
        Contact.findByIdAndDelete({ _id: contact_id }).then((data, err) => {
          if (err) {
            return res.status(500).json({
              message: "Internal Server Error",
            });
          }

          if (data) {
            return res.status(200).json({
              message: "Contact deleted successfully!",
              contact: data,
            });
          } else {
            return res.status(404).json({
              message: "Contact not found!",
            });
          }
        });
      }
    } else {
      return res.status(404).json({
        message: "Contact not found!",
      });
    }
  });
});

app.get("/get-contact/:contact_id", checkToken, (req, res) => {
  const contact_id = req.params.contact_id;

  Contact.findById({ _id: contact_id }).then((data, err) => {
    if (err) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }

    if (data) {
      if (data.user_id !== req.user_id) {
        return res.status(404).json({
          message: "Contact not found!",
        });
      }

      return res.status(200).json({
        message: "Contact fetched successfully!",
        contact: data,
      });
    } else {
      return res.status(404).json({
        message: "Contact not found!",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log("Listening on PORT:" + PORT);
});
