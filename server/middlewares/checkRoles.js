exports.checkRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const roleUsernya = req.user.role.split(",");

    const bolehMasuk = roleUsernya.some((role) => {
      return allowedRoles.includes(role);
    });

    console.log(bolehMasuk);

    if (!bolehMasuk) {
      return res.status(403).json({
        status: "error",
        message: "Forbidden Role",
      });
    }

    next();
  };
};
