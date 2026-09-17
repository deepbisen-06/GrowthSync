// Unified Validation Rules matching Backend Pydantic Schemas

export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistrationForm(formData) {
  const errors = {};

  // Full Name
  if (!formData.full_name || formData.full_name.trim().length < 2) {
    errors.full_name = "Full Name must be at least 2 characters.";
  }

  // Email
  if (!formData.email || !EMAIL_REGEX.test(formData.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  // Password
  if (!formData.password) {
    errors.password = "Password is required.";
  } else if (formData.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (!/(?=.*[A-Za-z])/.test(formData.password)) {
    errors.password = "Password must contain at least 1 letter.";
  } else if (!/(?=.*\d)/.test(formData.password)) {
    errors.password = "Password must contain at least 1 number.";
  }

  // Confirm Password
  if (formData.password !== formData.confirm_password) {
    errors.confirm_password = "Passwords do not match.";
  }

  // Age
  const ageNum = parseInt(formData.age, 10);
  if (!formData.age || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
    errors.age = "Please enter a valid age between 13 and 120.";
  }

  // Gender
  if (!formData.gender) {
    errors.gender = "Please select your gender.";
  }

  // Education Level
  if (!formData.education_level) {
    errors.education_level = "Please select your education level.";
  }

  // Course / Branch
  if (!formData.course || formData.course.trim().length < 2) {
    errors.course = "Course / Branch is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
