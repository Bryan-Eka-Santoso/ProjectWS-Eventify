const checkRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const roleUsernya = req.yanglogin.roles;

    const bolehMasuk = allowedRoles.includes(roleUsernya);

    if (!bolehMasuk) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden Role",
      });
    }

    next();
  };
};

module.exports = checkRoles;
