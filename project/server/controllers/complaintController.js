import Complaint from '../models/Complaint.js';

const STATUS_VALUES = ['open', 'in_review', 'resolved'];

// @desc    Submit a hostel complaint
// @route   POST /api/complaints
// @access  Public
export const createComplaint = async (req, res) => {
  try {
    const { name, rollNumber, phone, message } = req.body || {};

    if (!name?.trim() || !rollNumber?.trim() || !phone?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in name, roll number, phone number, and your complaint.',
      });
    }

    const complaint = await Complaint.create({
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      phone: phone.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Your complaint has been submitted. We will get back to you soon.',
      id: complaint._id,
    });
  } catch (error) {
    console.error('createComplaint:', error);
    return res.status(500).json({
      success: false,
      message:
        error.name === 'MongoServerError' || error.name === 'MongooseError'
          ? 'Database unavailable. Please try again later.'
          : 'Could not submit complaint. Please try again later.',
    });
  }
};

// @desc    List complaints (newest first)
// @route   GET /api/complaints
// @access  Faculty
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: complaints });
  } catch (error) {
    console.error('getComplaints:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not load complaints.',
    });
  }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id
// @access  Faculty
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use open, in_review, or resolved.',
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    return res.json({ success: true, data: complaint });
  } catch (error) {
    console.error('updateComplaintStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not update complaint.',
    });
  }
};
