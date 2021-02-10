const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;

/*
  Create a new user in database
 */

exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    password: bcrypt.hashSync(req.body.password, 8)
  });

  user.save((err, user) => {
    if (err) {
      return res.status(500).send({ message: err });
  }

    user.save(err => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      res.send({ message: "User was registered successfully!" });
    });
  });
};


/*
  Sign in user by comparing pw and generating a token
 */

exports.signin = (req, res) => {
  User.findOne({
    username: req.body.username,
  })
    .exec((err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      if (!user) {
        return res.status(404).send({ message: 'user not found', errorCode: 'USER_NOT_FOUND' });
      }

      const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: 'invalid password',
          errorCode: 'PASSWORD_INVALID'
        })
      }

      const token = jwt.sign({ id: user.id }, config.secret,  {
        expiresIn: 86400,
      });

      res.status(200).send({
       id: user._id,
       username: user.username,
       accessToken: token,
      });
    });
};

exports.forgot = (req, res) => {
  const token = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');

  User.findOne({
    email: req.body.email,
  })
    .exec((err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      if (!user) {
        return res.status(404).send({ message: 'email not found', errorCode: 'FORGOT_EMAIL_NOT_FOUND' });
      }

      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      user.save(err => {
        if (err) {
          return res.status(500).send({ message: err });
        }

        /*
        usually mail service called here to send email to user with reset token
         */
        res.send({ message: 'Forgot email has been sent', userResetToken: token });
      });
    });
}

exports.resetLink = (req, res) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
    .exec((err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      if (!user) {
        return res.status(404).send({ message: 'Invalid user', errorCode: 'RESET_INVALID' });
      }

      res.status(200).send({
        username: user.email,
      });
    });
}

exports.resetPassword = (req, res) => {
  User.findOne({
    resetPasswordToken: req.body.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
    .exec((err, user) => {
      if (err) {
        return res.status(500).send({ message: err });
      }

      if (!user) {
        return res.status(404).send({ message: 'Invalid user', errorCode: 'RESET_INVALID' });
      }

      user.password = bcrypt.hashSync(req.body.password, 8);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      user.save(err => {
        if (err) {
          return res.status(500).send({ message: err });
        }

        res.status(200).send({ message: 'Password reset success' });
      });
    });
}



