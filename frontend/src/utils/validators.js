export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const validateName = (name) => {
  return name.trim().length >= 2;
};

export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach((field) => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && !value) {
      errors[field] = `${fieldRules.label} обязательно`;
    } else if (fieldRules.validate && value) {
      const isValid = fieldRules.validate(value);
      if (!isValid) {
        errors[field] = fieldRules.message;
      }
    }
  });
  
  return errors;
};