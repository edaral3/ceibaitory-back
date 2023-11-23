import jwt from "jsonwebtoken";
import config from "../config/config";

const validateToken = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    const token = req.headers["authorization"];
    jwt.verify(token, config.secret, (error, decoded) => {
      if (error) {
        return res.status(400).json({
          message: "Invalid token",
        });
      }
      if (!roles.includes(decoded.type)) {
        return res.status(400).json({
          message:
            "Permissions error",
        });
      }
      req.userId = decoded.userId;
      req.companyName = decoded.companyName;
      next();
    });
  };
};

export { validateToken };
