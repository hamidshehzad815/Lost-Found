import jwt from "jsonwebtoken";

export default async function (user) {
  const payload = {
    ...user,
  };
  const option = {
    expiresIn: "1h",
  };

  return jwt.sign(payload, process.env.SECRET_KEY, option);
}
