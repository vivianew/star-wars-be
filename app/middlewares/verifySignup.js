const db = require('../models');
const User = db.user;

checkDuplicateUsernameOrEmail = async (req, res, next) => {
  const existingUser = await User.findOne({
    username: req.body.username,
  })

  if (existingUser) {
    return res.status(500).send({ message: 'User already exists', errorCode: 'USER_EXISTS' })
  }

  next();
};

const verifySignup = {
  checkDuplicateUsernameOrEmail,
};

module.exports = verifySignup;