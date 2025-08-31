import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();


router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


router.get(
  "/auth/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err) {
        console.error("Google OAuth authentication error:", err);

        
        if (err.message && err.message.includes("deactivated")) {
          return res.redirect(
            `${process.env.FRONTEND_URL}/auth/success?error=account_deactivated`
          );
        }

        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/success?error=oauth_failed`
        );
      }

      if (!user) {
        console.error("No user found in OAuth callback");
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/success?error=no_user`
        );
      }

      
      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      const user = req.user;
      console.log("Google OAuth callback - User:", user);

      
      if (!user.is_active) {
        console.error("User account is deactivated:", user.email);
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/success?error=account_deactivated`
        );
      }

      
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
        },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );

      console.log("Generated token for user:", user.email);

      
      user.last_login = new Date();
      await user.save();

      
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/success?token=${token}`;
      console.log("Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/success?error=oauth_failed`
      );
    }
  }
);


router.get("/auth/google/failure", (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
});

export default router;
