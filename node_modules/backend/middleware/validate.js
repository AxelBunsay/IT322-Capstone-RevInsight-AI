const validateRegister = (req, res, next) => {
  const { email, password, firstName, lastName, phoneNumber } = req.body;

  if (!email || !password || !firstName || !lastName || !phoneNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { firstName, lastName, phoneNumber, profileImage, preferences } = req.body;

  if (firstName === '' || lastName === '' || phoneNumber === '') {
    return res.status(400).json({ message: 'Fields cannot be empty' });
  }

  next();
};

const validateCreateMechanic = (req, res, next) => {
  const { email, password, firstName, lastName, phoneNumber, specialization, yearsOfExperience } = req.body;

  if (!email || !password || !firstName || !lastName || !phoneNumber || !specialization || yearsOfExperience === undefined) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const validSpecializations = ['general', 'engine', 'transmission', 'electrical', 'suspension', 'brakes'];
  if (!validSpecializations.includes(specialization)) {
    return res.status(400).json({ message: 'Invalid specialization' });
  }

  if (yearsOfExperience < 0) {
    return res.status(400).json({ message: 'Years of experience cannot be negative' });
  }

  next();
};

const validateUpdateMechanic = (req, res, next) => {
  const { firstName, lastName, phoneNumber, specialization, yearsOfExperience, availabilityStatus, successRate } = req.body;

  if (firstName === '' || lastName === '' || phoneNumber === '') {
    return res.status(400).json({ message: 'Fields cannot be empty' });
  }

  if (specialization) {
    const validSpecializations = ['general', 'engine', 'transmission', 'electrical', 'suspension', 'brakes'];
    if (!validSpecializations.includes(specialization)) {
      return res.status(400).json({ message: 'Invalid specialization' });
    }
  }

  if (yearsOfExperience !== undefined && yearsOfExperience < 0) {
    return res.status(400).json({ message: 'Years of experience cannot be negative' });
  }

  if (availabilityStatus) {
    const validStatuses = ['available', 'busy', 'on-leave'];
    if (!validStatuses.includes(availabilityStatus)) {
      return res.status(400).json({ message: 'Invalid availability status' });
    }
  }

  if (successRate !== undefined && (successRate < 0 || successRate > 100)) {
    return res.status(400).json({ message: 'Success rate must be between 0 and 100' });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateCreateMechanic,
  validateUpdateMechanic
};
