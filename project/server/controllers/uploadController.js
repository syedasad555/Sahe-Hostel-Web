import fs from 'fs';
import csv from 'csv-parser';
import CSVUpload from '../models/CSVUpload.js';

// Process CSV upload
export const processCsvUpload = async (req, res) => {
  try {
    const { type } = req.body;
    const csvFile = req.file;

    if (!csvFile) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    if (!type || !['rollNumbers', 'adminNumbers'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload type specified'
      });
    }

    const results = [];
    const filePath = csvFile.path;

    // Read and parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          // Process the CSV data based on type
          let processedData;
          
          if (type === 'rollNumbers') {
            processedData = processRollNumbers(results);
          } else if (type === 'adminNumbers') {
            processedData = processAdminNumbers(results);
          }

          // Save to database
          console.log('Saving to database:', {
            type,
            numbersCount: processedData.map(item => item.rollNumber || item.adminNumber).length,
            firstFewNumbers: processedData.map(item => item.rollNumber || item.adminNumber).slice(0, 5)
          });

          const result = await CSVUpload.findOneAndUpdate(
            { type, isActive: true },
            { 
              type, 
              numbers: processedData.map(item => item.rollNumber || item.adminNumber),
              uploadDate: new Date(),
              isActive: true 
            },
            { upsert: true, new: true }
          );

          console.log('Database save result:', result);

          // Clean up uploaded file
          fs.unlinkSync(filePath);

          res.status(200).json({
            success: true,
            message: `Successfully processed and saved ${processedData.length} records`,
            data: processedData
          });

        } catch (error) {
          console.error('Error processing CSV data:', error);
          
          // Clean up uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          res.status(500).json({
            success: false,
            message: 'Error processing CSV data: ' + error.message
          });
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        
        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        res.status(500).json({
          success: false,
          message: 'Error reading CSV file: ' + error.message
        });
      });

  } catch (error) {
    console.error('Error in processCsvUpload:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// Process roll numbers CSV (2nd, 3rd, 4th year)
const processRollNumbers = (data) => {
  return data.map((row, index) => {
    // Only extract roll number from the first column
    const rollNumber = row[Object.keys(row)[0]] || '';
    return {
      rollNumber: rollNumber.trim(),
      type: 'roll'
    };
  }).filter(item => item.rollNumber); // Filter out empty rows
};

// Process administration numbers CSV (1st year)
const processAdminNumbers = (data) => {
  return data.map((row, index) => {
    // Only extract administration number from the first column
    const adminNumber = row[Object.keys(row)[0]] || '';
    return {
      adminNumber: adminNumber.trim(),
      type: 'admin'
    };
  }).filter(item => item.adminNumber); // Filter out empty rows
};
