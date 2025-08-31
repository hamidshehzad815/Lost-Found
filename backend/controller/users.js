import { User } from "../models/Index.js";
import generateToken from "../utils/generateToken.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPasswordChangeConfirmation,
} from "../utils/emailService.js";
import bcrypt from "bcrypt";
import _ from "lodash";
// import client from "../database/redisClient.js";
import crypto from "crypto";
import { Op } from "sequelize";

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExists = await User.findOne({
      where: { email },
    });

    if (!userExists) {
      return res.status(404).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!userExists.is_active) {
      return res.status(403).send({
        success: false,
        message:
          "Your account has been deactivated. Please contact support to reactivate your account.",
      });
    }

    const user = userExists;

    if (!user.is_verified) {
      return res.status(401).send({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(404).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    await user.update({ last_login: new Date() });

    const token = await generateToken(
      _.pick(user, ["user_id", "name", "email"])
    );

    res.setHeader("Authorization", `Bearer ${token}`);

    return res.status(200).send({
      success: true,
      token,
      message: "Login Successful",
      user: _.pick(user, [
        "user_id",
        "name",
        "email",
        "phone",
        "profile_picture_url",
      ]),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const Signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: "Email already exists",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      phone,
      verification_token: verificationToken,
    });

    try {
      await sendVerificationEmail(email, verificationToken);
      console.log(`✅ Verification email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send verification email to ${email}:`,
        emailError
      );
    }

    return res.status(201).send({
      success: true,
      message:
        "User created successfully. Please check your email for verification.",
      user: _.pick(newUser, ["user_id", "name", "email", "phone"]),
    });
  } catch (error) {
    console.error("Signup error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const Profile = async (req, res) => {
  try {
    const user = req.user;

    const fullUser = await User.findOne({
      where: { user_id: user.user_id },
      attributes: {
        exclude: [
          "password_hash",
          "verification_token",
          "reset_password_token",
        ],
      },
    });

    if (!fullUser) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const userData = fullUser.toJSON();
    if (
      userData.profile_picture_url &&
      userData.profile_picture_url.startsWith("/uploads/")
    ) {
      userData.profile_picture_url = `http://localhost:4500${userData.profile_picture_url}`;
    }

    return res.status(200).send({
      success: true,
      user: userData,
      message: "Profile retrieved successfully",
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const UpdateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, phone, profile_picture_url } = req.body;

    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profile_picture_url)
      updateData.profile_picture_url = profile_picture_url;

    await user.update(updateData);

    const userResponse = _.pick(user, [
      "user_id",
      "name",
      "email",
      "phone",
      "profile_picture_url",
    ]);

    if (
      userResponse.profile_picture_url &&
      userResponse.profile_picture_url.startsWith("/uploads/")
    ) {
      userResponse.profile_picture_url = `http://localhost:4500${userResponse.profile_picture_url}`;
    }

    return res.status(200).send({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const VerifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    console.log("🔍 Verification attempt:", {
      token: token,
      tokenLength: token?.length,
      timestamp: new Date().toISOString(),
    });

    const user = await User.findOne({
      where: {
        verification_token: token,
        is_verified: false,
      },
    });

    console.log("📊 Database query result:", {
      userFound: !!user,
      userId: user?.user_id,
      userEmail: user?.email,
      isVerified: user?.is_verified,
      hasToken: !!user?.verification_token,
    });

    if (!user) {
      console.log("❌ No unverified user found with this token");

      const anyRecentlyVerifiedUser = await User.findOne({
        where: {
          is_verified: true,
          updatedAt: {
            [Op.gte]: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
        order: [["updatedAt", "DESC"]],
      });

      if (anyRecentlyVerifiedUser) {
        console.log(
          "✅ Found recently verified user, assuming this token was already used successfully"
        );
        return res.status(200).send({
          success: true,
          message: "Email already verified! You can now login to your account.",
          alreadyVerified: true,
        });
      }

      return res.status(400).send({
        success: false,
        message:
          "Invalid or expired verification token. This link may have already been used or has expired.",
      });
    }

    console.log("✅ User found, updating verification status");
    await user.update({
      is_verified: true,
      verification_token: null,
    });

    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log(`✅ Welcome email sent successfully to ${user.email}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send welcome email to ${user.email}:`,
        emailError
      );
    }

    console.log("🎉 Verification completed successfully");
    return res.status(200).send({
      success: true,
      message: "Email verified successfully! Welcome to LostFound.",
    });
  } catch (error) {
    console.error("💥 Verify email error:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
};

const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).send({
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000);

    await user.update({
      reset_password_token: resetToken,
      reset_password_expires: resetExpires,
    });

    try {
      await sendPasswordResetEmail(email, resetToken);
      console.log(`✅ Password reset email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send password reset email to ${email}:`,
        emailError
      );
    }

    return res.status(200).send({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const ResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res
        .status(400)
        .send({ message: "Invalid or expired reset token" });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).send({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await user.update({
      password_hash: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null,
    });

    try {
      await sendPasswordChangeConfirmation(user.email, user.name);
      console.log(`✅ Password change confirmation sent to ${user.email}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send password change confirmation to ${user.email}:`,
        emailError
      );
    }

    return res.status(200).send({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const DeactivateAccount = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findOne({
      where: {
        user_id: userId,
        is_active: true,
      },
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found or already deactivated",
      });
    }

    await User.update(
      {
        is_active: false,
      },
      { where: { user_id: userId } }
    );

    return res.status(200).send({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const Logout = async (req, res) => {
  try {
    res.setHeader("Authorization", `Bearer `);
    return res.status(200).send({ message: "Logout Successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const UploadProfilePicture = async (req, res) => {
  try {
    console.log("Profile picture upload request received");
    console.log("User ID:", req.user?.user_id);
    console.log("File received:", !!req.file);
    console.log(
      "File details:",
      req.file
        ? {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
          }
        : "No file"
    );

    const userId = req.user.user_id;

    if (!req.file) {
      console.log("No file uploaded in request");
      return res.status(400).send({
        success: false,
        message: "No file uploaded",
      });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;
    console.log("Generated profile picture URL:", profilePictureUrl);

    const user = await User.findByPk(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    console.log("Updating user profile picture URL in database");
    await user.update({ profile_picture_url: profilePictureUrl });
    console.log("Profile picture URL updated successfully");

    const fullProfilePictureUrl = `http://localhost:4500${profilePictureUrl}`;

    return res.status(200).send({
      success: true,
      message: "Profile picture uploaded successfully",
      profilePictureUrl: fullProfilePictureUrl,
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const ReactivateAccount = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: {
        email,
        is_active: false,
      },
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found or account is already active",
      });
    }

    await User.update(
      {
        is_active: true,
        last_login: new Date(),
      },
      { where: { user_id: user.user_id } }
    );

    return res.status(200).send({
      success: true,
      message: "Account reactivated successfully",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile_picture_url: user.profile_picture_url
          ? `http://localhost:4500${user.profile_picture_url}`
          : null,
        is_verified: user.is_verified,
        last_login: new Date(),
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Reactivate account error:", error);
    return res.status(500).send({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export {
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
};
