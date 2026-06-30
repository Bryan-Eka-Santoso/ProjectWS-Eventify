const validate = (schemas = {}) => {
  return (req, res, next) => {
    const options = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true,
    };

    const segments = ["params", "query", "body"];

    for (const segment of segments) {
      if (!schemas[segment]) continue;

      const { error, value } = schemas[segment].validate(
        req[segment],
        options
      );

      if (error) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          source: segment,
          errors: error.details.map((detail) => ({
            field: detail.path.join("."),
            message: detail.message,
          })),
        });
      }

      req[segment] = value;
    }

    if (schemas.file) {
      const {
        required = false,
        allowedMimeTypes = [],
        maxSize = null,
        fieldName = "file",
      } = schemas.file;

      if (required && !req.file) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          source: fieldName,
          errors: [
            {
              field: fieldName,
              message: `${fieldName} is required`,
            },
          ],
        });
      }

      if (req.file && allowedMimeTypes.length > 0) {
        const isAllowed = allowedMimeTypes.includes(req.file.mimetype);

        if (!isAllowed) {
          return res.status(422).json({
            success: false,
            message: "Validation failed",
            source: fieldName,
            errors: [
              {
                field: fieldName,
                message: `${fieldName} must be one of: ${allowedMimeTypes.join(
                  ", "
                )}`,
              },
            ],
          });
        }
      }

      if (req.file && maxSize && req.file.size > maxSize) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          source: fieldName,
          errors: [
            {
              field: fieldName,
              message: `${fieldName} cannot exceed ${Math.floor(
                maxSize / 1024 / 1024
              )}MB`,
            },
          ],
        });
      }
    }

    return next();
  };
};

module.exports = validate;