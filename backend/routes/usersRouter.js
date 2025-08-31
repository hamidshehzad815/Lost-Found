import express from "express";
import {
  Login,
  Signup,
  Profile,
  UpdateProfile,
  VerifyEmail,
  ForgotPassword,
  ResetPassword,
  DeactivateAccount,
  ReactivateAccount,
  Logout,
  UploadProfilePicture,
} from "../controller/users.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/mutlerUpload.js";

const router = express.Router();

router.post("/login", Login);
router.post("/signup", Signup);
router.get("/profile", auth, Profile);
router.put("/profile", auth, UpdateProfile);
router.post(
  "/upload-profile-picture",
  auth,
  upload.single("profilePicture"),
  UploadProfilePicture
);
router.get("/verify-email/:token", VerifyEmail);
router.post("/forgot-password", ForgotPassword);
router.post("/reset-password", ResetPassword);
router.post("/deactivate", auth, DeactivateAccount);
router.post("/reactivate", ReactivateAccount);
router.post("/logout", Logout);

export default router;
