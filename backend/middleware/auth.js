import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader)
    return res.status(400).send({ message: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(400).send({ message: "Bearer token missing" });

  jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).send({ message: "Token expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).send({ message: "Invalid token" });
      }
      return res.status(401).send({ message: "Token verification failed" });
    }
    req.user = decodedToken;
    next();
  });
};
