exports.checkRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const roleUsernya = req.yanglogin.roles.split(",");

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