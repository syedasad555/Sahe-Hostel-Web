import Complaint from '../models/Complaint.js';
import { toApiJson, toApiJsonList } from '../utils/apiSerialize.js';
import { parseId } from '../utils/queryHelpers.js';

const STATUS_VALUES = ['open', 'in_review', 'resolved'];

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
      id: String(complaint.id),
    });
  } catch (error) {
    console.error('createComplaint:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not submit complaint. Please try again later.',
    });
  }
};

export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: toApiJsonList(complaints) });
  } catch (error) {
    console.error('getComplaints:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not load complaints.',
    });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use open, in_review, or resolved.',
      });
    }

    const id = parseId(req.params.id);
    const complaint = id ? await Complaint.findByPk(id) : null;
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    complaint.status = status;
    await complaint.save();

    return res.json({ success: true, data: toApiJson(complaint) });
  } catch (error) {
    console.error('updateComplaintStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not update complaint.',
    });
  }
};
