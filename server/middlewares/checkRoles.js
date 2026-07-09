exports.checkRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const roleValue = req.user?.role;

    if (!roleValue) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized. Role not found.",
      });
    }

    const roleUsernya = String(roleValue)
      .split(",")
      .map((role) => role.trim());

    const bolehMasuk = roleUsernya.some((role) => {
      return allowedRoles.includes(role);
    });

    if (!bolehMasuk) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden Role",
      });
    }

    next();
  };
};