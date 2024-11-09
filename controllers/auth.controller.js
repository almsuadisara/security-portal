const User = require('../models/auth.model');
const LoginAttempt = require('../models/loginAttempt.model');
//const expressJwt = require('express-jwt');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const { validationResult } = require('express-validator');

const { expressjwt: expressJwt } = require('express-jwt');
const jwt = require('jsonwebtoken');

const { errorHandler } = require('../helpers/dbErrorHandling');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.MAIL_KEY);
// تخزين محاولات تسجيل الدخول في الذاكرة
const loginAttempts = new Map();

// الحد الأقصى لعدد المحاولات ومدة الحظر
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 3 * 60 * 1000; // 3 دقائق
require('dotenv').config({
  path: './config/config.env'
})


exports.registerController = (req, res) => {
  const { name, email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map(error => error.msg)[0];
    return res.status(422).json({
      errors: firstError
    });
  } else {
    // التحقق من قوة كلمة المرور
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,}$/;
    if (!passwordRegex.test(password)) {
      console.log('Password validation failed'); // تحقق من أن الرسالة يتم تسجيلها
      return res.status(400).json({
        errors: 'Password must be at least 9 characters long, contain at least one uppercase letter, one number, and one special character'
      });
    }

    User.findOne({ email }).exec((err, user) => {
      if (user) {
        // إذا كان المستخدم موجودًا، أرسل رسالة الخطأ وتوقف
        return res.status(400).json({
          errors: 'Email is taken'
        });
      }

      // إذا لم يكن هناك مستخدم، تابع عملية التسجيل
      const token = jwt.sign(
        {
          name,
          email,
          password
        },
        process.env.JWT_ACCOUNT_ACTIVATION,
        {
          expiresIn: '5m'
        }
      );

      const emailData = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Account activation link',
        html: `
                <h1>Please use the following link to activate your account</h1>
                <p>${process.env.CLIENT_URL}/users/activate/${token}</p>
                <hr />
                <p>This email may contain sensitive information</p>
                <p>${process.env.CLIENT_URL}</p>
            `
      };

      sgMail
        .send(emailData)
        .then(sent => {
          return res.json({
            message: `Email has been sent to ${email}`
          });
        })
        .catch(err => {
          return res.status(400).json({
            success: false,
            errors: errorHandler(err) // استخدام errorHandler لعرض التفاصيل
          });
        });
    });
  }
};
exports.activationController = (req, res) => {
  const { token } = req.body;

  if (token) {
    jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded) => {
      if (err) {
        console.log('Activation error');
        return res.status(401).json({
          errors: 'Expired link. Signup again'
        });
      } else {
        const { name, email, password } = jwt.decode(token);

        console.log(email);
        const user = new User({
          name,
          email,
          password
        });

        user.save((err, user) => {
          if (err) {
            console.log('Save error', errorHandler(err));
            return res.status(401).json({
              errors: errorHandler(err)
            });
          } else {
            return res.json({
              success: true,
              message: user,
              message: 'Signup success'
            });
          }
        });
      }
    });
  } else {
    return res.json({
      message: 'error happening please try again'
    });
  }
};

exports.signinController = (req, res) => {
  const { email, password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map(error => error.msg)[0];
    return res.status(422).json({ errors: firstError });
  } else {
    // التحقق من محاولات تسجيل الدخول من قاعدة البيانات
    LoginAttempt.findOne({ email }).then(userAttempts => {
      if (!userAttempts) {
        userAttempts = new LoginAttempt({ email });
      }

      // التحقق من حالة الحظر
      if (userAttempts.locked) {
        const timeSinceLastAttempt = Date.now() - new Date(userAttempts.lastAttempt).getTime();
        if (timeSinceLastAttempt < LOCK_TIME) {
          return res.status(429).json({
            errors: `تم حظر الحساب لمدة 3 دقائق بسبب محاولات تسجيل دخول متكررة`
          });
        } else {
          // إعادة تعيين المحاولات بعد انتهاء مدة الحظر
          userAttempts.attempts = 0;
          userAttempts.locked = false;
        }
      }

      User.findOne({ email }).exec((err, user) => {
        if (err || !user) {
          return res.status(400).json({
            errors: 'User with that email does not exist. Please signup'
          });
        }

        if (!user.authenticate(password)) {
          userAttempts.attempts += 1;
          userAttempts.lastAttempt = Date.now();
          userAttempts.locked = userAttempts.attempts >= MAX_ATTEMPTS;

          userAttempts.save().then(() => {
            return res.status(400).json({
              errors: 'Email and password do not match'
            });
          }).catch(err => {
            return res.status(500).json({ errors: 'Database error' });
          });
        } else {
          const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.SESSION_EXPIRY });
          const { _id, name, email, role } = user;

          // إعادة تعيين المحاولات بعد نجاح تسجيل الدخول
          LoginAttempt.deleteOne({ email }).then(() => {
            return res.json({
              token,
              user: {
                _id,
                name,
                email,
                role
              }
            });
          }).catch(err => {
            return res.status(500).json({ errors: 'Database error' });
          });
        }
      });
    }).catch(err => {
      return res.status(500).json({ errors: 'Database error' });
    });
  }
};

exports.requireSignin = expressJwt({
  secret: process.env.JWT_SECRET ,
  algorithms: [process.env.JWT_ALGORITHM] // req.user._id
});

exports.adminMiddleware = (req, res, next) => {
  User.findById({
    _id: req.user._id
  }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({
        error: 'Admin resource. Access denied.'
      });
    }

    req.profile = user;
    next();
  });
};

exports.forgotPasswordController = (req, res) => {
  const { email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map(error => error.msg)[0];
    return res.status(422).json({
      errors: firstError
    });
  } else {
    User.findOne(
      {
        email
      },
      (err, user) => {
        if (err || !user) {
          return res.status(400).json({
            error: 'User with that email does not exist'
          });
        }

        const token = jwt.sign(
          {
            _id: user._id
          },
          process.env.JWT_RESET_PASSWORD,
          {
            expiresIn: '10m'
          }
        );

        const emailData = {
          from: process.env.EMAIL_FROM,
          to: email,
          subject: `Password Reset link`,
          html: `
                    <h1>Please use the following link to reset your password</h1>
                    <p>${process.env.CLIENT_URL}/users/password/reset/${token}</p>
                    <hr />
                    <p>This email may contain sensetive information</p>
                    <p>${process.env.CLIENT_URL}</p>
                `
        };

        return user.updateOne(
          {
            resetPasswordLink: token
          },
          (err, success) => {
            if (err) {
              console.log('RESET PASSWORD LINK ERROR', err);
              return res.status(400).json({
                error:
                  'Database connection error on user password forgot request'
              });
            } else {
              sgMail
                .send(emailData)
                .then(sent => {
                  // console.log('SIGNUP EMAIL SENT', sent)
                  return res.json({
                    message: `Email has been sent to ${email}. Follow the instruction to activate your account`
                  });
                })
                .catch(err => {
                  // console.log('SIGNUP EMAIL SENT ERROR', err)
                  return res.json({
                    message: err.message
                  });
                });
            }
          }
        );
      }
    );
  }
};

exports.resetPasswordController = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array().map(error => error.msg)[0];
    return res.status(422).json({
      errors: firstError
    });
  } else {
    if (resetPasswordLink) {
      jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function(
        err,
        decoded
      ) {
        if (err) {
          return res.status(400).json({
            error: 'Expired link. Try again'
          });
        }

        User.findOne(
          {
            resetPasswordLink
          },
          (err, user) => {
            if (err || !user) {
              return res.status(400).json({
                error: 'Something went wrong. Try later'
              });
            }

            const updatedFields = {
              password: newPassword,
              resetPasswordLink: ''
            };

            user = _.extend(user, updatedFields);

            user.save((err, result) => {
              if (err) {
                return res.status(400).json({
                  error: 'Error resetting user password'
                });
              }
              res.json({
                message: `Great! Now you can login with your new password`
              });
            });
          }
        );
      });
    }
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT);
// Google Login
exports.googleController = (req, res) => {
  const { idToken } = req.body;

  client
    .verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT })
    .then(response => {
      // console.log('GOOGLE LOGIN RESPONSE',response)
      const { email_verified, name, email } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '7d'
            });
            const { _id, email, name, role } = user;
            return res.json({
              token,
              user: { _id, email, name, role }
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                console.log('ERROR GOOGLE LOGIN ON USER SAVE', err);
                return res.status(400).json({
                  error: 'User signup failed with google'
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
              );
              const { _id, email, name, role } = data;
              return res.json({
                token,
                user: { _id, email, name, role }
              });
            });
          }
        });
      } else {
        return res.status(400).json({
          error: 'Google login failed. Try again'
        });
      }
    });
};

exports.facebookController = (req, res) => {
  console.log('FACEBOOK LOGIN REQ BODY', req.body);
  const { userID, accessToken } = req.body;

  const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;

  return (
    fetch(url, {
      method: 'GET'
    })
      .then(response => response.json())
      // .then(response => console.log(response))
      .then(response => {
        const { email, name } = response;
        User.findOne({ email }).exec((err, user) => {
          if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
              expiresIn: '7d'
            });
            const { _id, email, name, role } = user;
            return res.json({
              token,
              user: { _id, email, name, role }
            });
          } else {
            let password = email + process.env.JWT_SECRET;
            user = new User({ name, email, password });
            user.save((err, data) => {
              if (err) {
                console.log('ERROR FACEBOOK LOGIN ON USER SAVE', err);
                return res.status(400).json({
                  error: 'User signup failed with facebook'
                });
              }
              const token = jwt.sign(
                { _id: data._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
              );
              const { _id, email, name, role } = data;
              return res.json({
                token,
                user: { _id, email, name, role }
              });
            });
          }
        });
      })
      .catch(error => {
        res.json({
          error: 'Facebook login failed. Try later'
        });
      })
  );
};
