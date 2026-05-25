import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Image as ImageIcon, Download, Trash2 } from 'lucide-react';
import ConfirmationDialog from '../components/ConfirmationDialog';

/** Cross-tab + in-app: Faculty list refetches when a student is removed from DB */
const STUDENT_DELETED_EVENT = 'studentRecordDeleted';
const STUDENT_DELETED_STORAGE_KEY = 'studentRecordDeletedSync';

const broadcastStudentDeleted = (studentId) => {
  try {
    window.dispatchEvent(
      new CustomEvent(STUDENT_DELETED_EVENT, { detail: { id: studentId } })
    );
    localStorage.setItem(
      STUDENT_DELETED_STORAGE_KEY,
      JSON.stringify({ id: studentId, t: Date.now() })
    );
  } catch (_) {
    /* ignore private mode / quota */
  }
};

const DocumentCard = ({ title, file, type }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        {type === 'document' && file && (
          <a
            href={`/uploads/${file}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800"
            title="View Document"
          >
            <FileText className="h-5 w-5" />
          </a>
        )}
      </div>
      <div className="mt-2">
        {type === 'image' ? (
          file ? (
            <a href={`/uploads/${file}`} target="_blank" rel="noopener noreferrer">
              <img
                src={`/uploads/${file}`}
                alt={title}
                className="h-32 w-full object-cover rounded"
              />
            </a>
          ) : (
            <div className="h-32 bg-gray-100 rounded flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="h-8 w-8 mb-2" />
              <span className="text-xs">No {title.toLowerCase()}</span>
            </div>
          )
        ) : file ? (
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto text-gray-400" />
              <a
                href={`/uploads/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </div>
          </div>
        ) : (
          <div className="h-32 bg-gray-50 rounded flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto" />
              <span className="text-xs block mt-1">No document uploaded</span>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const StudentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteInFlightRef = useRef(false);

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await axios.get(`/api/students/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        });
        
        if (response.data?.success) {
          setStudent(response.data.data);
        } else {
          setError(response.data?.error || 'Failed to load student details');
        }
      } catch (err) {
        console.error('Error fetching student details:', err);
        setError('Failed to load student details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [id]);

  const handleDeleteRecord = async () => {
    if (deleteInFlightRef.current) return;
    deleteInFlightRef.current = true;
    try {
      setIsDeleting(true);
      const response = await axios.delete(`/api/students/${id}`, {
        validateStatus: (s) => s < 500,
      });
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Delete failed');
      }
      broadcastStudentDeleted(id);
      setShowDeleteDialog(false);
      setStudent(null);
      navigate('/', { replace: true });
      try {
        window.close();
      } catch (_) {
        /* ignore — e.g. tab not opened by script */
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message || 'Could not delete student record.');
    } finally {
      setIsDeleting(false);
      deleteInFlightRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Student Data</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested student record could not be found.'}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const renderTableSection = (title, data) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100 transition-all duration-300 hover:shadow-xl">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <span className="bg-white/20 p-1.5 rounded-lg mr-3">
            {title === 'Personal Information' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            {title === 'Academic Information' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>}
            {title === 'Parent/Guardian Information' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            {title === 'Fee Details' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          </span>
          {title}
        </h2>
      </div>
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <tbody className="divide-y divide-gray-100">
            {Object.entries(data).map(([key, value], index) => (
              <tr key={key} className="hover:bg-blue-50/50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 w-1/3 border-r border-gray-100">
                  <div className="flex items-center">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                    {key}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 font-medium">
                  {value || <span className="text-gray-400">Not provided</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const personalInfo = {
    'Full Name': student.studentName,
    'Email': student.email,
    'Phone': student.phone,
    'Date of Birth': student.dateOfBirth ? formatDate(student.dateOfBirth) : (student.dob ? formatDate(student.dob) : 'N/A'),
    'Gender': student.gender,
    'Blood Group': student.bloodGroup,
    'Emergency Contact': student.emergencyContact,
    ...(student.hasHealthIssues === 'yes'
      ? {
          'Health Issues': 'Yes',
          'Health issue description':
            typeof student.healthIssuesDescription === 'string' &&
            student.healthIssuesDescription.trim()
              ? student.healthIssuesDescription
              : 'Not provided',
        }
      : { 'Health Issues': 'No' }),
    'Address': [
      student.address,
      student.city,
      student.state,
      student.pincode
    ].filter(Boolean).join(', ') || 'N/A'
  };

  const rollAdminLabel = student.year === '1st Year' ? 'Administration Number' : 'Roll Number';

  const academicInfo = {
    Branch: student.branch,
    Year: student.year,
    [rollAdminLabel]: student.rollNumber || 'N/A',
    Section: student.section,
    CGPA: student.cgpa || 'N/A',
    Backlogs: student.backlogs === 'yes' ? `Yes (${student.backlogCount ?? 0})` : 'No',
    'Aadhar Number': student.aadharNumber || 'N/A',
  };

  const parentInfo = {
    "Father's Name": student.fatherName,
    'Parent / Guardian Phone': student.parentPhone,
    'Parent Occupation': student.parentOccupation,
    'Guardian Name': student.guardianName,
    'Guardian Phone': student.guardianPhone,
  };

  const paymentStatusDisplay =
    student.paymentStatus === 'Done'
      ? 'Paid'
      : student.pendingAmount != null &&
          student.pendingAmount !== '' &&
          Number.isFinite(Number(student.pendingAmount))
        ? `Pending — ₹${Number(student.pendingAmount).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}`
        : 'Pending';

  const feeInfo = {
    'Payment Status': paymentStatusDisplay,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border border-gray-100">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              {student.studentPhoto ? (
                <div className="relative">
                  <img
                    className="h-16 w-16 rounded-xl object-cover border-4 border-white shadow-md"
                    src={`/uploads/${student.studentPhoto}`}
                    alt={student.studentName}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
                    {student.year?.charAt(0) || 'S'}
                  </div>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {student.studentName?.charAt(0) || 'S'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{student.studentName}</h1>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                  <span className="text-sm text-gray-600 flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {student.rollNumber}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    {student.branch}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {student.year}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-lg ${student.paymentStatus === 'Done' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} text-sm font-semibold flex flex-wrap items-center gap-1 max-w-xs`}>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${student.paymentStatus === 'Done' ? 'bg-green-500' : 'bg-amber-500'} mr-1`}></span>
              {student.paymentStatus === 'Done'
                ? 'Fees Paid'
                : student.pendingAmount != null &&
                    student.pendingAmount !== '' &&
                    Number.isFinite(Number(student.pendingAmount))
                  ? `Pending — ₹${Number(student.pendingAmount).toLocaleString('en-IN', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}`
                  : 'Payment Pending'}
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
              Delete this record
            </button>
          </div>
        </div>

        <ConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => !isDeleting && setShowDeleteDialog(false)}
          onConfirm={handleDeleteRecord}
          isDeleteDialog
          title="Delete student record"
          message={
            student
              ? `Permanently delete ${student.studentName}'s registration? This cannot be undone.`
              : 'Permanently delete this registration?'
          }
        />

        {/* Personal Information Table */}
        {renderTableSection('Personal Information', personalInfo)}

        {/* Academic Information Table */}
        {renderTableSection('Academic Information', academicInfo)}

        {/* Parent/Guardian Information Table */}
        {renderTableSection('Parent/Guardian Information', parentInfo)}

        {/* Fee Information Table */}
        {renderTableSection('Fee Details', feeInfo)}

        {/* Documents */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-indigo-50 to-blue-50">
            <h2 className="text-lg font-medium text-gray-900">Documents</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DocumentCard 
                title="Student Photo" 
                file={student.studentPhoto} 
                type="image" 
              />
              <DocumentCard 
                title="Parent Photo" 
                file={student.parentPhoto} 
                type="image" 
              />
              <DocumentCard 
                title="10th Certificate" 
                file={student.tenthCertificate} 
                type="document" 
              />
              <DocumentCard 
                title="Aadhar Card" 
                file={student.aadharCard} 
                type="document" 
              />
              <DocumentCard 
                title="Payment Receipt" 
                file={student.paymentReceipt} 
                type="document" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsPage;
