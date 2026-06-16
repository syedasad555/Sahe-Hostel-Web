import CSVUpload from '../models/CSVUpload.js';

export const processCsvUpload = async (req, res) => {
  try {
    const { type } = req.body;
    const csvFile = req.file;

    if (!csvFile) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded',
      });
    }

    if (!type || !['rollNumbers', 'adminNumbers'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload type specified',
      });
    }

    const results = [];
    const filePath = csvFile.path;

    const fs = await import('fs');
    const csv = (await import('csv-parser')).default;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          let processedData;

          if (type === 'rollNumbers') {
            processedData = processRollNumbers(results);
          } else {
            processedData = processAdminNumbers(results);
          }

          const numbers = processedData.map((item) => item.rollNumber || item.adminNumber);

          const [record] = await CSVUpload.findOrCreate({
            where: { type, isActive: true },
            defaults: {
              type,
              numbers,
              uploadDate: new Date(),
              isActive: true,
            },
          });

          if (record) {
            await record.update({
              numbers,
              uploadDate: new Date(),
              isActive: true,
            });
          }

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.status(200).json({
            success: true,
            message: `Successfully processed and saved ${processedData.length} records`,
            data: processedData,
          });
        } catch (error) {
          console.error('Error processing CSV data:', error);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.status(500).json({
            success: false,
            message: `Error processing CSV data: ${error.message}`,
          });
        }
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.status(500).json({
          success: false,
          message: `Error reading CSV file: ${error.message}`,
        });
      });
  } catch (error) {
    console.error('Error in processCsvUpload:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
    });
  }
};

const processRollNumbers = (data) =>
  data
    .map((row) => ({
      rollNumber: String(row[Object.keys(row)[0]] || '').trim(),
      type: 'roll',
    }))
    .filter((item) => item.rollNumber);

const processAdminNumbers = (data) =>
  data
    .map((row) => ({
      adminNumber: String(row[Object.keys(row)[0]] || '').trim(),
      type: 'admin',
    }))
    .filter((item) => item.adminNumber);
