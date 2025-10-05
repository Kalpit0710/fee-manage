export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validators = {
  required: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return { field: fieldName, message: `${fieldName} is required` };
    }
    return null;
  },

  email: (value: string, fieldName: string = 'Email'): ValidationError | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: 'Please enter a valid email address' };
    }
    return null;
  },

  phone: (value: string, fieldName: string = 'Phone'): ValidationError | null => {
    if (!value) return null;
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(value.replace(/[\s-]/g, ''))) {
      return { field: fieldName, message: 'Please enter a valid 10-digit phone number' };
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): ValidationError | null => {
    if (!value) return null;
    if (value.length < min) {
      return { field: fieldName, message: `${fieldName} must be at least ${min} characters` };
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): ValidationError | null => {
    if (!value) return null;
    if (value.length > max) {
      return { field: fieldName, message: `${fieldName} must be less than ${max} characters` };
    }
    return null;
  },

  number: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') return null;
    if (isNaN(Number(value))) {
      return { field: fieldName, message: `${fieldName} must be a valid number` };
    }
    return null;
  },

  positiveNumber: (value: any, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return { field: fieldName, message: `${fieldName} must be a positive number` };
    }
    return null;
  },

  min: (value: number, min: number, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined) return null;
    if (Number(value) < min) {
      return { field: fieldName, message: `${fieldName} must be at least ${min}` };
    }
    return null;
  },

  max: (value: number, max: number, fieldName: string): ValidationError | null => {
    if (value === null || value === undefined) return null;
    if (Number(value) > max) {
      return { field: fieldName, message: `${fieldName} must be at most ${max}` };
    }
    return null;
  },

  date: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { field: fieldName, message: `${fieldName} must be a valid date` };
    }
    return null;
  },

  pastDate: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { field: fieldName, message: `${fieldName} must be a valid date` };
    }
    if (date > new Date()) {
      return { field: fieldName, message: `${fieldName} cannot be in the future` };
    }
    return null;
  },

  futureDate: (value: string, fieldName: string): ValidationError | null => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { field: fieldName, message: `${fieldName} must be a valid date` };
    }
    if (date < new Date()) {
      return { field: fieldName, message: `${fieldName} cannot be in the past` };
    }
    return null;
  },

  admissionNumber: (value: string, fieldName: string = 'Admission Number'): ValidationError | null => {
    if (!value) return null;
    if (value.length < 3 || value.length > 20) {
      return { field: fieldName, message: 'Admission number must be between 3 and 20 characters' };
    }
    return null;
  },

  amount: (value: any, fieldName: string = 'Amount'): ValidationError | null => {
    if (value === null || value === undefined || value === '') return null;
    const amount = Number(value);
    if (isNaN(amount)) {
      return { field: fieldName, message: `${fieldName} must be a valid number` };
    }
    if (amount < 0) {
      return { field: fieldName, message: `${fieldName} cannot be negative` };
    }
    if (amount > 10000000) {
      return { field: fieldName, message: `${fieldName} seems unusually high` };
    }
    return null;
  },

  chequeNumber: (value: string, fieldName: string = 'Cheque Number'): ValidationError | null => {
    if (!value) return null;
    if (!/^\d{6}$/.test(value)) {
      return { field: fieldName, message: 'Cheque number must be 6 digits' };
    }
    return null;
  },

  upiId: (value: string, fieldName: string = 'UPI Transaction ID'): ValidationError | null => {
    if (!value) return null;
    if (value.length < 10) {
      return { field: fieldName, message: 'UPI transaction ID seems too short' };
    }
    return null;
  }
};

export const validateForm = (rules: Array<ValidationError | null>): ValidationResult => {
  const errors = rules.filter((error): error is ValidationError => error !== null);
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateStudent = (data: any): ValidationResult => {
  return validateForm([
    validators.required(data.name, 'Student Name'),
    validators.minLength(data.name, 2, 'Student Name'),
    validators.maxLength(data.name, 100, 'Student Name'),
    validators.required(data.admission_no, 'Admission Number'),
    validators.admissionNumber(data.admission_no, 'Admission Number'),
    validators.required(data.class_id, 'Class'),
    data.parent_email ? validators.email(data.parent_email, 'Parent Email') : null,
    data.parent_contact ? validators.phone(data.parent_contact, 'Parent Contact') : null,
    data.date_of_birth ? validators.pastDate(data.date_of_birth, 'Date of Birth') : null,
    data.concession_amount ? validators.positiveNumber(data.concession_amount, 'Concession Amount') : null
  ]);
};

export const validatePayment = (data: any): ValidationResult => {
  const baseValidation = [
    validators.required(data.student_id, 'Student'),
    validators.required(data.quarter_id, 'Quarter'),
    validators.required(data.amount_paid, 'Amount'),
    validators.amount(data.amount_paid, 'Amount Paid'),
    validators.min(data.amount_paid, 1, 'Amount Paid'),
    validators.required(data.payment_mode, 'Payment Mode')
  ];

  if (data.payment_mode === 'cheque') {
    baseValidation.push(
      validators.required(data.cheque_number, 'Cheque Number'),
      validators.chequeNumber(data.cheque_number, 'Cheque Number'),
      validators.required(data.cheque_date, 'Cheque Date'),
      validators.date(data.cheque_date, 'Cheque Date'),
      validators.required(data.bank_name, 'Bank Name')
    );
  }

  if (data.payment_mode === 'upi') {
    baseValidation.push(
      validators.required(data.payment_reference, 'UPI Transaction ID'),
      validators.upiId(data.payment_reference, 'UPI Transaction ID')
    );
  }

  if (data.payment_mode === 'online') {
    baseValidation.push(
      validators.required(data.payment_reference, 'Transaction Reference')
    );
  }

  return validateForm(baseValidation);
};

export const validateFeeStructure = (data: any): ValidationResult => {
  return validateForm([
    validators.required(data.class_id, 'Class'),
    validators.required(data.quarter_id, 'Quarter'),
    validators.required(data.tuition_fee, 'Tuition Fee'),
    validators.positiveNumber(data.tuition_fee, 'Tuition Fee'),
    validators.positiveNumber(data.examination_fee, 'Examination Fee'),
    validators.positiveNumber(data.other_fee, 'Other Fee')
  ]);
};

export const validateExtraCharge = (data: any): ValidationResult => {
  return validateForm([
    validators.required(data.charge_name, 'Charge Name'),
    validators.minLength(data.charge_name, 2, 'Charge Name'),
    validators.required(data.amount, 'Amount'),
    validators.positiveNumber(data.amount, 'Amount'),
    validators.min(data.amount, 1, 'Amount'),
    validators.required(data.quarter_id, 'Quarter')
  ]);
};

export const validateQuarter = (data: any): ValidationResult => {
  return validateForm([
    validators.required(data.quarter_name, 'Quarter Name'),
    validators.minLength(data.quarter_name, 2, 'Quarter Name'),
    validators.required(data.academic_year, 'Academic Year'),
    validators.required(data.start_date, 'Start Date'),
    validators.date(data.start_date, 'Start Date'),
    validators.required(data.end_date, 'End Date'),
    validators.date(data.end_date, 'End Date'),
    validators.required(data.due_date, 'Due Date'),
    validators.date(data.due_date, 'Due Date')
  ]);
};
