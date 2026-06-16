import CSVUpload from '../models/CSVUpload.js';

export const validateStudentNumber = async (year, rollNumber) => {
  try {
    let csvType;
    let numberField;

    if (year === '1st Year') {
      csvType = 'adminNumbers';
      numberField = 'administration number';
    } else {
      csvType = 'rollNumbers';
      numberField = 'roll number';
    }

    const csvUpload = await CSVUpload.findOne({
      where: { type: csvType, isActive: true },
    });

    if (!csvUpload) {
      return {
        isValid: false,
        message: `No ${numberField}s have been uploaded yet for ${year} students. Please contact faculty to upload the CSV file.`,
      };
    }

    const numbers = Array.isArray(csvUpload.numbers) ? csvUpload.numbers : [];
    const numberExists = numbers.includes(rollNumber);

    if (!numberExists) {
      return {
        isValid: false,
        message: `The ${numberField} "${rollNumber}" is not found in the uploaded CSV file for ${year} students. Please check your ${numberField} or contact faculty.`,
      };
    }

    return {
      isValid: true,
      message: 'Number validated successfully',
    };
  } catch (error) {
    console.error('Error validating student number:', error);
    return {
      isValid: false,
      message: 'Error validating number. Please try again.',
    };
  }
};
