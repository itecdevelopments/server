const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Region = require("../models/regionModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = (id, role = "ENG") => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user._id, user.role);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
  };

  res.cookie("jwt", token, cookieOptions);
  const populatedUser = await user.populate("region");
  populatedUser.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user: populatedUser },
  });
};

// ---------------- AUTH CONTROLLERS ----------------

exports.signup = catchAsync(async (req, res, next) => {
  const existingUser = await User.findOne({ username: req.body.username });
  if (existingUser) return next(new AppError("Username already exists!", 400));

  const region = await Region.findOne({ code: req.body.region });
  if (!region) return next(new AppError("Invalid region code!", 400));

  const newUser = await User.create({
    name: req.body.name,
    username: req.body.username,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    region: region._id,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password)
    return next(new AppError("Please provide username and password!", 400));

  const user = await User.findOne({ username }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError("Incorrect username or password", 401));

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 1️⃣ Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 2️⃣ Find user and populate region info
  const currentUser = await User.findById(decoded.id).populate(
    "region",
    "name code"
  );

  if (!currentUser)
    return next(new AppError("User belonging to token no longer exists.", 401));

  // 3️⃣ Check password change
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    next();
  };
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1️⃣ Get user from database
  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  // 2️⃣ Verify current password
  const correct = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!correct) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3️⃣ Update to new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); // triggers password hashing middleware

  // 4️⃣ Send success response (no token creation)
  res.status(200).json({
    status: "success",
    message: "Password updated successfully.",
  });
});
