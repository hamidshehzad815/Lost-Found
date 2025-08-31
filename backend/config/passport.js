import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/Index.js";

export default function initializePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:4500/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            where: { google_id: profile.id },
          });

          if (user) {
            if (!user.is_active) {
              return done(
                new Error(
                  "Account has been deactivated. Please contact support to reactivate your account."
                ),
                null
              );
            }

            return done(null, user);
          } else {
            let existingUser = await User.findOne({
              where: { email: profile.emails[0].value },
            });

            if (existingUser) {
              if (!existingUser.is_active) {
                return done(
                  new Error(
                    "Account has been deactivated. Please contact support to reactivate your account."
                  ),
                  null
                );
              }

              existingUser.google_id = profile.id;
              existingUser.profile_picture_url = profile.photos[0]?.value;
              await existingUser.save();
              return done(null, existingUser);
            } else {
              const newUser = await User.create({
                google_id: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                profile_picture_url: profile.photos[0]?.value,
                is_verified: true, // Google accounts are pre-verified
                provider: "google",
                is_active: true, // New accounts are active by default
              });
              return done(null, newUser);
            }
          }
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
