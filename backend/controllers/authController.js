const AuthService = require("../services/authService");

/**
 * Authentication Controller
 * Handles user registration, login, and profile fetching.
 */

/**
 * Register a new passenger.
 */
exports.register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res
      .status(201)
      .json({ id: result.id, message: "User registered successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user and return JWT.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    // Frontend expects: { token, user: { ... } }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get the current authenticated user's profile.
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getMe(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
