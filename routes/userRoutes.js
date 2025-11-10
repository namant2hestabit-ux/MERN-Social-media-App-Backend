const express = require("express");
const { getUserData, signUpUser, loginUser, logoutUser, editProfile, editPassword, fetchAllUsers, refreshTokens, googleLogin, deleteAnyUser, editAnyUser } = require("../controllers/userController");
const { userAuth, adminAuth, } = require("../middlewares/auth");

const userRouter = express.Router();

userRouter.post("/login", loginUser);

userRouter.post("/signup", signUpUser);

userRouter.post("/logout", logoutUser);

userRouter.get("/profile", userAuth, getUserData);

userRouter.patch("/edit-profile", userAuth, editProfile);

userRouter.patch("/edit-password", userAuth, editPassword);

userRouter.get("/users", userAuth, fetchAllUsers);

userRouter.post("/refresh-token", refreshTokens);

userRouter.post("/auth/google", googleLogin);

// Admin Routes
userRouter.delete("/admin/user/:userId", userAuth, adminAuth, deleteAnyUser);

userRouter.patch("/admin/user/:userId", userAuth, adminAuth, editAnyUser);



module.exports = userRouter;