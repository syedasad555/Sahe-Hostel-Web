import CSVUpload from '../models/CSVUpload.js';

// Validate roll number or administration number against uploaded CSV files
export const validateStudentNumber = async (year, rollNumber) => {
  try {
    console.log('Starting validation for:', { year, rollNumber });
    
    let csvType;
    let numberField;
    
    // Determine CSV type and field based on year
    if (year === '1st Year') {
      csvType = 'adminNumbers';
      numberField = 'administration number';
    } else {
      csvType = 'rollNumbers';
      numberField = 'roll number';
    }
    
    console.log('Looking for CSV upload:', { csvType, numberField });
    
    // Find the active CSV upload for this type
    const csvUpload = await CSVUpload.findOne({ 
      type: csvType, 
      isActive: true 
    });
    
    console.log('CSV upload found:', csvUpload ? 'Yes' : 'No');
    if (csvUpload) {
      console.log('CSV upload details:', {
        type: csvUpload.type,
        numbersCount: csvUpload.numbers.length,
        firstFewNumbers: csvUpload.numbers.slice(0, 5),
        isActive: csvUpload.isActive
      });
    }
    
    if (!csvUpload) {
      return {
        isValid: false,
        message: `No ${numberField}s have been uploaded yet for ${year} students. Please contact faculty to upload the CSV file.`
      };
    }
    
    // Check if the number exists in the uploaded CSV
    const numberExists = csvUpload.numbers.includes(rollNumber);
    console.log('Number exists check:', { rollNumber, numberExists });
    
    if (!numberExists) {
      return {
        isValid: false,
        message: `The ${numberField} "${rollNumber}" is not found in the uploaded CSV file for ${year} students. Please check your ${numberField} or contact faculty.`
      };
    }
    
    return {
      isValid: true,
      message: 'Number validated successfully'
    };
    
  } catch (error) {
    console.error('Error validating student number:', error);
    return {
      isValid: false,
      message: 'Error validating number. Please try again.'
    };
  }
};
