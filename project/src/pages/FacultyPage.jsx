import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, ChevronLeft, ChevronRight, Trash2, AlertTriangle, Utensils, Upload, FileText, MessageSquare, Plane, Loader2, Download, Plus } from 'lucide-react';
import ConfirmationDialog from '../components/ConfirmationDialog';
import FacultyMealStatsPage from './FacultyMealStatsPage';

const STUDENT_DELETED_EVENT = 'studentRecordDeleted';
const STUDENT_DELETED_STORAGE_KEY = 'studentRecordDeletedSync';

const FacultyPage = () => {
  const [activeTab, setActiveTab] = useState('students');
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    branch: '',
    paymentStatus: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [csvFiles, setCsvFiles] = useState({
    rollNumbers: null,
    adminNumbers: null
  });
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPaymentCsvMenu, setShowPaymentCsvMenu] = useState(false);
  const [isDownloadingPaymentCsv, setIsDownloadingPaymentCsv] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const params = new URLSearchParams({
        page,
        limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.branch && { branch: filters.branch }),
        ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus })
      });

      const response = await axios.get(`/api/students?${params}`);
      console.log('API Response:', response.data); // Debug log
      console.log('First student data:', response.data.data[0]); // Log first student's data
      const { data, totalPages, currentPage, count } = response.data;

      setStudents(data);
      setPagination(prev => ({
        ...prev,
        total: count,
        totalPages,
        page: currentPage
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  /** Stay in sync when a student is deleted from the details page (same window or another tab) */
  useEffect(() => {
    const onDeleted = () => {
      fetchStudents();
    };
    const onStorage = (ev) => {
      if (ev.key === STUDENT_DELETED_STORAGE_KEY && ev.newValue) {
        fetchStudents();
      }
    };
    window.addEventListener(STUDENT_DELETED_EVENT, onDeleted);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(STUDENT_DELETED_EVENT, onDeleted);
      window.removeEventListener('storage', onStorage);
    };
  }, [fetchStudents]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      setIsDeleting(true);
      const studentId = studentToDelete._id;
      const studentName = studentToDelete.studentName;
      console.log('Attempting to delete student with ID:', studentId);
      
      // Store current state in case we need to revert
      const previousState = {
        students: [...students],
        pagination: { ...pagination }
      };
      
      // Optimistically update the UI
      setStudents(prev => prev.filter(student => student._id !== studentId));
      
      try {
        console.log('Sending DELETE request to server...');
        const response = await axios.delete(`/api/students/${studentId}`, {
          validateStatus: status => status < 500 // Don't throw for 4xx/5xx responses
        });

        console.log('Server response:', response.data);

        if (!response.data || !response.data.success) {
          throw new Error(response.data?.error || 'Failed to delete student');
        }

        try {
          window.dispatchEvent(
            new CustomEvent(STUDENT_DELETED_EVENT, { detail: { id: studentId } })
          );
          localStorage.setItem(
            STUDENT_DELETED_STORAGE_KEY,
            JSON.stringify({ id: studentId, t: Date.now() })
          );
        } catch (_) {
          /* ignore */
        }

        // Update the pagination total count
        const newTotal = Math.max(0, pagination.total - 1);
        setPagination(prev => ({
          ...prev,
          total: newTotal
        }));

        // If we're on the last page and it becomes empty after deletion, go to previous page
        if (students.length === 1 && pagination.page > 1) {
          setPagination(prev => ({ ...prev, page: prev.page - 1 }));
        } else if (newTotal <= (pagination.page - 1) * pagination.limit) {
          // If the last item on the current page was deleted, go to previous page
          setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
        } else {
          // Otherwise, refresh the current page
          fetchStudents();
        }
        
        // Show success message
        alert(`Successfully deleted ${studentName}'s record`);
        
      } catch (apiError) {
        // Revert to previous state if API call fails
        console.error('API Error:', apiError);
        setStudents(previousState.students);
        setPagination(previousState.pagination);
        throw apiError;
      }
      
    } catch (error) {
      console.error('Delete operation failed:', error);
      const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Failed to delete student. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
  };

  const viewStudentDetails = (studentId) => {
    // Open in new tab
    window.open(`/students/${studentId}`, '_blank');
  };

  const handleCsvFileChange = (type, file) => {
    setCsvFiles(prev => ({
      ...prev,
      [type]: file
    }));
    setUploadStatus(null);
  };

  const handleCsvUpload = async (type) => {
    const file = csvFiles[type];
    if (!file) {
      setUploadStatus({ type: 'error', message: 'Please select a CSV file first' });
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setUploadStatus({ type: 'error', message: 'Please upload a CSV file' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('type', type);

      const response = await axios.post('/api/upload/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadStatus({ 
        type: 'success', 
        message: `${type === 'rollNumbers' ? 'Roll numbers' : 'Administration numbers'} uploaded successfully!` 
      });
      setCsvFiles(prev => ({ ...prev, [type]: null }));
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Upload failed. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatYear = (year) => {
    if (!year) return 'N/A';
    if (typeof year === 'string') return year;
    if (year === 1) return '1st Year';
    if (year === 2) return '2nd Year';
    if (year === 3) return '3rd Year';
    if (year === 4) return '4th Year';
    return 'N/A';
  };

  const formatPaymentStatusLabel = (student) => {
    if (student.paymentStatus === 'Done') {
      return 'Paid';
    }
    if (
      student.pendingAmount != null &&
      student.pendingAmount !== '' &&
      Number.isFinite(Number(student.pendingAmount))
    ) {
      return `Pending - ₹${Number(student.pendingAmount).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }
    return 'Pending';
  };

  const htmlEscape = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const fetchStudentsForExcel = async (paymentMode) => {
    const normalizedPaymentFilter =
      paymentMode === 'paid' ? 'Done' : paymentMode === 'pending' ? 'Not Done' : '';
    const pageLimit = 200;
    let page = 1;
    let totalPages = 1;
    const collected = [];

    do {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageLimit),
        ...(searchTerm && { search: searchTerm }),
        ...(filters.branch && { branch: filters.branch }),
        ...(normalizedPaymentFilter && { paymentStatus: normalizedPaymentFilter })
      });
      const response = await axios.get(`/api/students?${params.toString()}`);
      const payload = response.data || {};
      collected.push(...(payload.data || []));
      totalPages = Number(payload.totalPages || 1);
      page += 1;
    } while (page <= totalPages);

    return collected;
  };

  const handlePaymentStatusExcelDownload = async (paymentMode) => {
    setShowPaymentCsvMenu(false);
    try {
      setIsDownloadingPaymentCsv(true);
      const rows = await fetchStudentsForExcel(paymentMode);
      if (!rows.length) {
        alert('No matching students found for the selected payment status.');
        return;
      }

      const tableRows = rows
        .map(
          (student) => `
            <tr>
              <td>${htmlEscape(student.studentName || '')}</td>
              <td>${htmlEscape(student.branch || '')}</td>
              <td>${htmlEscape(formatYear(student.year))}</td>
              <td>${htmlEscape(student.rollNumber || 'N/A')}</td>
              <td>${htmlEscape(student.phone || '')}</td>
              <td>${htmlEscape(formatPaymentStatusLabel(student))}</td>
            </tr>`
        )
        .join('');

      const excelHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <table border="1">
      <thead>
        <tr>
          <th>Name</th>
          <th>Branch</th>
          <th>Year</th>
          <th>Roll/Admin No.</th>
          <th>Phone</th>
          <th>Payment Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;

      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const suffix =
        paymentMode === 'paid' ? 'paid' : paymentMode === 'pending' ? 'pending' : 'both';
      anchor.href = objectUrl;
      anchor.download = `payment-status-${suffix}.xls`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Failed to download payment status Excel:', error);
      alert('Could not download payment status Excel file. Please try again.');
    } finally {
      setIsDownloadingPaymentCsv(false);
    }
  };

  const branchOptions = [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-4 pb-6 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6 pb-4 border-b border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            SAHE - Hostel Statistics
          </h1>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="-mb-px flex flex-nowrap gap-6 sm:gap-8 min-w-min pb-px">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`${
                activeTab === 'students'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Student Management
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className={`${
                activeTab === 'complaints'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Complaints
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meals')}
              className={`${
                activeTab === 'meals'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Utensils className="mr-2 h-4 w-4" />
              Meal Statistics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('csv')}
              className={`${
                activeTab === 'csv'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Upload className="mr-2 h-4 w-4" />
              CSV Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('outing')}
              className={`${
                activeTab === 'outing'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Plane className="mr-2 h-4 w-4" />
              Outgoing Services
            </button>
          </nav>
        </div>

        {/* Content Area */}
        {activeTab === 'meals' ? (
          <FacultyMealStatsPage
            totalStudentsInManagement={pagination.total}
            studentsListLoading={loading}
          />
        ) : activeTab === 'complaints' ? (
          <FacultyComplaintsPanel navigate={navigate} />
        ) : activeTab === 'outing' ? (
          <OutgoingServicesPanel navigate={navigate} />
        ) : activeTab === 'csv' ? (
          <CSVUploadSection 
            csvFiles={csvFiles}
            onFileChange={handleCsvFileChange}
            onUpload={handleCsvUpload}
            uploadStatus={uploadStatus}
            isUploading={isUploading}
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-gray-800"
                  title="Total student records matching your current search and filters (all pages)."
                >
                  <span className="text-gray-600 whitespace-nowrap">Total students</span>
                  <span className="font-bold tabular-nums text-amber-900 min-w-[1.5ch] text-center">
                    {loading ? '…' : pagination.total}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Back to Home
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <button
                        type="submit"
                        className="px-4 h-full bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </form>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      name="branch"
                      value={filters.branch}
                      onChange={handleFilterChange}
                      className="pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">All Branches</option>
                      {branchOptions.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    name="paymentStatus"
                    value={filters.paymentStatus}
                    onChange={handleFilterChange}
                    className="pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">All Payments</option>
                    <option value="Done">Payment Done</option>
                    <option value="Not Done">Payment Pending</option>
                  </select>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPaymentCsvMenu((prev) => !prev)}
                      disabled={isDownloadingPaymentCsv}
                      className="pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {isDownloadingPaymentCsv ? 'Downloading...' : 'Payment Status Excel'}
                    </button>
                    {showPaymentCsvMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                        <button
                          type="button"
                          onClick={() => handlePaymentStatusExcelDownload('pending')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaymentStatusExcelDownload('paid')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePaymentStatusExcelDownload('both')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Both
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {students.some(s => s.year === '1st Year') ? 'Roll/Admin No.' : 'Roll No.'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '200px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center">
                          Loading...
                        </td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr
                          key={student._id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {student.studentPhoto ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={`/uploads/${student.studentPhoto}`}
                                    alt={student.studentName}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                    {student.studentName?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.studentName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.branch}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.year ? 
                              typeof student.year === 'string' ? student.year :
                              student.year === 1 ? '1st Year' :
                              student.year === 2 ? '2nd Year' :
                              student.year === 3 ? '3rd Year' :
                              student.year === 4 ? '4th Year' : 'N/A'
                            : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.rollNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.phone}
                          </td>
                          <td className="px-6 py-4 text-sm max-w-[14rem]">
                            <span
                              className={`px-2.5 py-1 inline-flex text-xs leading-snug font-semibold rounded-lg ${
                                student.paymentStatus === 'Done'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {student.paymentStatus === 'Done'
                                ? 'Paid'
                                : student.pendingAmount != null &&
                                    student.pendingAmount !== '' &&
                                    Number.isFinite(Number(student.pendingAmount))
                                  ? `Pending — ₹${Number(student.pendingAmount).toLocaleString('en-IN', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 2,
                                    })}`
                                  : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-10">
                              <button
                                onClick={() => viewStudentDetails(student._id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View Details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(student);
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Student"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.page === 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pagination.page === pageNum
                                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            pagination.page === pagination.totalPages
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Student Record"
        message={`Are you sure you want to delete ${studentToDelete?.studentName || 'this student'}'s record? This action cannot be undone.`}
        isDeleteDialog
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        confirmButtonStyle="bg-red-600 hover:bg-red-700"
        cancelButtonStyle="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
      />
    </div>
  );
};

const MAX_OUTING_MEMBERS = 30;

/** Matches SMS / college context (India). */
const OUTING_DISPLAY_TZ = 'Asia/Kolkata';

/** Date as DD-MMM-YYYY (e.g. 11-May-2026). */
function formatOutingDateDisplay(value) {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return String(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: OUTING_DISPLAY_TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d);
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  if (!day || !month || !year) {
    return d.toLocaleString('en-IN', { timeZone: OUTING_DISPLAY_TZ });
  }
  return `${day}-${month}-${year}`;
}

/** Time as 12-hour with minutes (e.g. 12:00 PM). */
function formatOutingTimeDisplay(value) {
  if (value == null || value === '') return '';
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: OUTING_DISPLAY_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

function OutingWhenCell({ value }) {
  const dateLine = formatOutingDateDisplay(value);
  const timeLine = formatOutingTimeDisplay(value);
  if (dateLine === '—' && !timeLine) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-col gap-0.5 leading-snug">
      <span className="font-medium text-gray-900 tabular-nums">{dateLine}</span>
      {timeLine ? (
        <span className="text-gray-600 tabular-nums">{timeLine}</span>
      ) : null}
    </div>
  );
}

const emptyOutingRow = () => ({
  _key:
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `outing-row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  roll: '',
  studentName: '',
  studentPhone: '',
  parentPhone: '',
  block: '',
  lookupError: '',
  lookupLoading: false,
});

/** Stable row id for permission list: one member = one checkbox row. */
function outingMemberRowKey(permissionId, rollNumber) {
  const r = String(rollNumber ?? '').trim().toUpperCase();
  return `${String(permissionId)}:${encodeURIComponent(r)}`;
}

function parseOutingMemberRowKey(key) {
  const s = String(key);
  const idx = s.indexOf(':');
  if (idx <= 0 || idx >= s.length - 1) return null;
  const permissionId = s.slice(0, idx);
  try {
    const rollNumber = decodeURIComponent(s.slice(idx + 1)).trim();
    if (!rollNumber) return null;
    return { permissionId, rollNumber };
  } catch {
    return null;
  }
}

function OutgoingServicesPanel({ navigate }) {
  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('facultyToken')}`,
    'Content-Type': 'application/json',
  });

  const [phase, setPhase] = useState('list');
  const [rows, setRows] = useState([]);
  const [outingOut, setOutingOut] = useState('');
  const [outingIn, setOutingIn] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');
  const [permissionsSearch, setPermissionsSearch] = useState('');
  const [permissionsStatus, setPermissionsStatus] = useState('both'); // ongoing | completed | both
  const [permissionsPage, setPermissionsPage] = useState(1);
  const [permissionsLimit] = useState(10);
  const [permissionsTotal, setPermissionsTotal] = useState(0);
  const [permissionsTotalPages, setPermissionsTotalPages] = useState(1);
  const [selectedRows, setSelectedRows] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  /** Sum of members on every saved outing permission until the user deletes the record (not reduced when return time passes). */
  const [savedOutingMemberCount, setSavedOutingMemberCount] = useState(0);
  /** In-app remove confirm: bulk member rows or one member */
  const [outingDeleteTarget, setOutingDeleteTarget] = useState(null);

  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const fetchPermissions = useCallback(
    async (status = permissionsStatus, page = permissionsPage) => {
      setPermissionsError('');
      setPermissionsLoading(true);
      try {
        const token = localStorage.getItem('facultyToken');
        if (!token) {
          setPermissionsError('Please log in as faculty.');
          setPermissions([]);
          return;
        }
        const params = new URLSearchParams({
          status,
          page: String(page),
          limit: String(permissionsLimit),
          ...(permissionsSearch.trim() ? { search: permissionsSearch.trim() } : {}),
        });
        const { data } = await axios.get(`/api/outing/permissions?${params.toString()}`, {
          headers: authHeaders(),
        });
        if (data?.success) {
          setPermissions(data.data || []);
          setPermissionsTotal(Number(data.total || 0));
          setPermissionsTotalPages(Number(data.totalPages || 1));
          setPermissionsPage(Number(data.currentPage || 1));
          setPermissionsStatus(status);
        }
        else setPermissionsError(data?.message || 'Failed to load permissions.');
      } catch (e) {
        setPermissionsError(e.response?.data?.message || 'Failed to load permissions.');
        setPermissions([]);
      } finally {
        setPermissionsLoading(false);
      }
    },
    [permissionsSearch, permissionsLimit, permissionsPage, permissionsStatus]
  );

  const permissionRows = useCallback(() => {
    const items = [];
    for (const p of permissions) {
      for (const r of p.members || []) {
        items.push({
          permissionId: p._id,
          createdAt: p.createdAt,
          outingOut: p.outingOut,
          outingIn: p.outingIn,
          rollNumber: r.rollNumber || '',
          studentName: r.studentName || '',
          studentPhone: r.studentPhone || '',
          parentPhone: r.parentPhone || '',
          block: r.block != null && r.block !== undefined ? String(r.block) : '',
          ok: !!r.ok,
        });
      }
    }
    return items;
  }, [permissions]);

  useEffect(() => {
    if (phase !== 'list') {
      setSavedOutingMemberCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem('facultyToken');
      if (!token) {
        setSavedOutingMemberCount(0);
        return;
      }
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      try {
        let n = 0;
        let page = 1;
        let totalPages = 1;
        const pageSize = 200;
        const maxPages = 50;
        do {
          const params = new URLSearchParams({
            status: 'both',
            page: String(page),
            limit: String(pageSize),
          });
          const { data } = await axios.get(`/api/outing/permissions?${params.toString()}`, {
            headers,
          });
          if (cancelled) return;
          if (!data?.success) {
            setSavedOutingMemberCount(0);
            return;
          }
          for (const p of data.data || []) {
            n += Array.isArray(p.members) ? p.members.length : 0;
          }
          totalPages = Math.max(1, Number(data.totalPages || 1));
          page += 1;
        } while (page <= totalPages && page <= maxPages);
        if (!cancelled) setSavedOutingMemberCount(n);
      } catch {
        if (cancelled) return;
        let n = 0;
        for (const p of permissions) {
          n += Array.isArray(p.members) ? p.members.length : 0;
        }
        setSavedOutingMemberCount(n);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, permissions]);

  useEffect(() => {
    if (phase !== 'list') return;
    fetchPermissions(permissionsStatus, permissionsPage);
  }, [phase, fetchPermissions]);

  const toggleSelectAllVisible = (visibleKeys) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      const allSelected = visibleKeys.every((k) => next.has(k));
      if (allSelected) visibleKeys.forEach((k) => next.delete(k));
      else visibleKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const toggleRow = (key) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const deleteSelected = () => {
    if (selectedRows.size === 0) return;
    const members = Array.from(selectedRows)
      .map((k) => parseOutingMemberRowKey(k))
      .filter(Boolean);
    if (members.length === 0) return;
    setOutingDeleteTarget({ kind: 'bulkMembers', members });
  };

  const executeOutingPermissionDelete = async (target) => {
    if (!target) return;
    setDeleting(true);
    try {
      if (target.kind === 'bulkMembers') {
        for (const { permissionId, rollNumber } of target.members) {
          const rollSeg = encodeURIComponent(String(rollNumber || '').trim().toUpperCase());
          await axios.delete(`/api/outing/permissions/${permissionId}/members/${rollSeg}`, {
            headers: authHeaders(),
          });
        }
        setSelectedRows(new Set());
      } else if (target.kind === 'singleMember') {
        const rollSeg = encodeURIComponent(String(target.rollNumber || '').trim().toUpperCase());
        await axios.delete(`/api/outing/permissions/${target.permissionId}/members/${rollSeg}`, {
          headers: authHeaders(),
        });
        setSelectedRows((prev) => {
          const n = new Set(prev);
          n.delete(outingMemberRowKey(target.permissionId, target.rollNumber));
          return n;
        });
      }
      await fetchPermissions(permissionsStatus, Math.max(1, permissionsPage));
    } catch (e) {
      alert(e.response?.data?.message || 'Could not remove member(s).');
    } finally {
      setDeleting(false);
    }
  };

  const downloadExcel = async (status) => {
    setShowDownloadMenu(false);
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        status,
        page: '1',
        limit: '100',
        ...(permissionsSearch.trim() ? { search: permissionsSearch.trim() } : {}),
      });
      const { data } = await axios.get(`/api/outing/permissions?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (!data?.success) throw new Error(data?.message || 'Download failed');

      const flat = [];
      for (const p of data.data || []) {
        for (const m of p.members || []) {
          flat.push({
            outingOut: p.outingOut,
            outingIn: p.outingIn,
            rollNumber: m.rollNumber || '',
            studentName: m.studentName || '',
            studentPhone: m.studentPhone || '',
            parentPhone: m.parentPhone || '',
            block: m.block != null && m.block !== undefined ? String(m.block) : '',
            sms: m.ok ? 'Sent' : 'Failed',
          });
        }
      }
      if (flat.length === 0) {
        alert('No permissions found for this filter.');
        return;
      }

      const rowsHtml = flat
        .map(
          (r) => `<tr>
  <td>${escapeHtml(formatOutingDateDisplay(r.outingOut))}<br/>${escapeHtml(formatOutingTimeDisplay(r.outingOut))}</td>
  <td>${escapeHtml(formatOutingDateDisplay(r.outingIn))}<br/>${escapeHtml(formatOutingTimeDisplay(r.outingIn))}</td>
  <td>${escapeHtml(r.rollNumber)}</td>
  <td>${escapeHtml(r.studentName)}</td>
  <td>${escapeHtml(r.studentPhone)}</td>
  <td>${escapeHtml(r.parentPhone)}</td>
  <td>${escapeHtml(r.block)}</td>
  <td>${escapeHtml(r.sms)}</td>
</tr>`
        )
        .join('');

      const excelHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /></head><body>
<table border="1">
<thead><tr>
  <th>Outing</th>
  <th>Return</th>
  <th>Roll / Admin</th>
  <th>Student</th>
  <th>Student phone</th>
  <th>Parent phone</th>
  <th>Block</th>
  <th>SMS</th>
</tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
</body></html>`;

      const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outgoing-permissions-${status}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || 'Could not download.');
    } finally {
      setDownloading(false);
    }
  };

  const startNewPermission = () => {
    setFormError('');
    setOutingOut('');
    setOutingIn('');
    setRows([emptyOutingRow()]);
    setPhase('form');
  };

  const addOutingMember = () => {
    setRows((prev) =>
      prev.length >= MAX_OUTING_MEMBERS ? prev : [...prev, emptyOutingRow()]
    );
  };

  const removeOutingMember = (idx) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateRow = (idx, patch) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const handleRollChange = (idx, value) => {
    updateRow(idx, {
      roll: value.toUpperCase(),
      studentName: '',
      studentPhone: '',
      parentPhone: '',
      block: '',
      lookupError: '',
    });
  };

  const lookupRollForValue = async (idx, rawValue) => {
    const roll = String(rawValue ?? '').trim().toUpperCase();
    if (!roll) {
      updateRow(idx, {
        lookupLoading: false,
        studentName: '',
        studentPhone: '',
        parentPhone: '',
        lookupError: '',
      });
      return;
    }

    updateRow(idx, { lookupLoading: true, lookupError: '' });

    try {
      const token = localStorage.getItem('facultyToken');
      if (!token) {
        updateRow(idx, {
          lookupLoading: false,
          studentName: '',
          studentPhone: '',
          parentPhone: '',
          lookupError: 'Please log in as faculty.',
        });
        return;
      }

      const { data } = await axios.get(`/api/outing/lookup/${encodeURIComponent(roll)}`, {
        headers: authHeaders(),
      });

      if (data.success && data.data) {
        updateRow(idx, {
          roll: String(data.data.rollNumber || roll).toUpperCase(),
          studentName: data.data.studentName || '',
          studentPhone: data.data.studentPhone || '',
          parentPhone: data.data.parentPhone || '',
          lookupError: '',
          lookupLoading: false,
        });
      } else {
        updateRow(idx, {
          studentName: '',
          studentPhone: '',
          parentPhone: '',
          lookupLoading: false,
          lookupError: data.message || 'Student not found.',
        });
      }
    } catch (e) {
      const status = e?.response?.status;
      const apiMessage = e?.response?.data?.message;
      let friendlyError = apiMessage || e.message || 'Lookup failed.';
      if (status === 404 && !apiMessage) {
        friendlyError = `No student found for "${roll}". Check roll/admin number.`;
      } else if (status === 404 && apiMessage) {
        friendlyError = `${apiMessage} (Entered: ${roll})`;
      } else if (status === 401) {
        friendlyError = 'Faculty session expired. Please login again.';
      } else if (status === 400) {
        friendlyError = apiMessage || 'Enter a valid roll/admin number.';
      }
      updateRow(idx, {
        studentName: '',
        studentPhone: '',
        parentPhone: '',
        lookupLoading: false,
        lookupError: friendlyError,
      });
    }
  };

  const handleSubmitOuting = async (e) => {
    e.preventDefault();
    setFormError('');
    const token = localStorage.getItem('facultyToken');
    if (!token) {
      setFormError('Please log in as faculty to send SMS.');
      return;
    }

    const trimmed = rows.map((r) => String(r.roll || '').trim().toUpperCase());
    const filled = trimmed.filter(Boolean);
    if (filled.length === 0) {
      setFormError('Enter at least one roll / administration number.');
      return;
    }
    const uniq = new Set(filled);
    if (uniq.size !== filled.length) {
      setFormError('Remove duplicate roll numbers before submitting.');
      return;
    }

    if (!outingOut || !outingIn) {
      setFormError('Enter both outing “out” and “return” date & time.');
      return;
    }

    const outTime = new Date(outingOut);
    const inTime = new Date(outingIn);
    if (!Number.isFinite(outTime.getTime()) || !Number.isFinite(inTime.getTime())) {
      setFormError('Please enter valid outing “out” and “return” date & time.');
      return;
    }
    if (inTime.getTime() <= outTime.getTime()) {
      setFormError('Return date/time must be after outing date/time.');
      return;
    }

    const outingMembers = rows
      .filter((r) => String(r.roll || '').trim())
      .map((r) => ({
        rollNumber: String(r.roll || '').trim().toUpperCase(),
        block: String(r.block || '').trim(),
      }));

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        '/api/outing/notify',
        {
          outingMembers,
          rollNumbers: filled,
          outingOut,
          outingIn,
        },
        { headers: authHeaders() }
      );

      if (!data.success) {
        setFormError(data.message || 'SMS request failed.');
        return;
      }

      if (data.permission?._id) {
        try {
          const plain = JSON.parse(JSON.stringify(data.permission));
          setPermissions((prev) => [plain, ...prev]);
        } catch {
          await fetchPermissions(permissionsStatus, permissionsPage);
        }
      } else {
        await fetchPermissions(permissionsStatus, permissionsPage);
      }

      setPhase('list');
    } catch (err) {
      setFormError(
        err.response?.data?.message || err.message || 'Could not send SMS.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outgoing Services</h1>
          <p className="text-gray-600 mt-1">
            Create outing permissions and view SMS delivery status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {phase === 'list' && (
            <>
              <div
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-gray-800"
                title="All members on saved outing permission records. The number only goes down when you delete a permission (or members are removed with the record). It does not change when outing or return times pass."
              >
                <span className="text-gray-600 whitespace-nowrap">Total members</span>
                <span className="font-bold tabular-nums text-amber-900 min-w-[1.5ch] text-center">
                  {savedOutingMemberCount}
                </span>
              </div>
              <button
                type="button"
                onClick={startNewPermission}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
              >
                New permission
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => (phase === 'form' ? setPhase('list') : navigate('/'))}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            {phase === 'form' ? 'Back to previous page' : 'Back to Home'}
          </button>
        </div>
      </div>

      {phase === 'list' && (
        <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Outgoing permissions</h2>
                  <p className="text-sm text-gray-600">
                    Search and review permissions you created with SMS status.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={permissionsSearch}
                    onChange={(e) => setPermissionsSearch(e.target.value)}
                    placeholder="Search roll, name, phone..."
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-56"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPermissionsPage(1);
                      fetchPermissions(permissionsStatus, 1);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                  >
                    Search
                  </button>
                  <select
                    value={permissionsStatus}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPermissionsPage(1);
                      fetchPermissions(next, 1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                    title="Filter permissions by status"
                  >
                    <option value="both">Both</option>
                    <option value="ongoing">Currently ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    disabled={deleting || selectedRows.size === 0}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Removing…' : `Remove (${selectedRows.size})`}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDownloadMenu((p) => !p)}
                      disabled={downloading}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? 'Downloading…' : 'Download Excel'}
                    </button>
                    {showDownloadMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                        <button
                          type="button"
                          onClick={() => downloadExcel('ongoing')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Currently ongoing permissions
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadExcel('completed')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Completed permissions
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadExcel('both')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Both
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {permissionsError && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                  {permissionsError}
                </div>
              )}

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const visible = permissionRows()
                              .filter((x) => {
                                const q = permissionsSearch.trim().toLowerCase();
                                if (!q) return true;
                                return (
                                  String(x.rollNumber).toLowerCase().includes(q) ||
                                  String(x.studentName).toLowerCase().includes(q) ||
                                  String(x.studentPhone).toLowerCase().includes(q) ||
                                  String(x.parentPhone).toLowerCase().includes(q) ||
                                  String(x.block).toLowerCase().includes(q)
                                );
                              })
                              .map((x) => outingMemberRowKey(x.permissionId, x.rollNumber));
                            toggleSelectAllVisible(visible);
                          }}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outing</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll / Admin</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SMS</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {permissionsLoading ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                          Loading…
                        </td>
                      </tr>
                    ) : permissionRows().length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                          No permissions found.
                        </td>
                      </tr>
                    ) : (
                      permissionRows()
                        .map((x) => {
                          const rowKey = outingMemberRowKey(x.permissionId, x.rollNumber);
                          return (
                          <tr key={rowKey} className="hover:bg-gray-50 align-top">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(rowKey)}
                                onChange={() => toggleRow(rowKey)}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 align-top">
                              <OutingWhenCell value={x.outingOut} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 align-top">
                              <OutingWhenCell value={x.outingIn} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{x.rollNumber || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{x.studentName || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{x.studentPhone || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{x.parentPhone || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{x.block ? x.block : '—'}</td>
                            <td className="px-4 py-3 text-sm max-w-[14rem]">
                              {x.ok ? (
                                <span className="text-green-700 font-semibold">Sent</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span
                                    className="text-red-700 font-semibold cursor-help border-b border-dotted border-red-400"
                                    title={x.feedback || 'SMS was not accepted by Twilio. Hover for details or check server logs.'}
                                  >
                                    Failed
                                  </span>
                                  {x.feedback ? (
                                    <p
                                      className="text-xs text-red-600 leading-snug line-clamp-2 break-words"
                                      title={x.feedback}
                                    >
                                      {x.feedback}
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  setOutingDeleteTarget({
                                    kind: 'singleMember',
                                    permissionId: x.permissionId,
                                    rollNumber: x.rollNumber,
                                  })
                                }
                                disabled={deleting}
                                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Remove this member from the outing"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination (similar to Student Management) */}
              {permissionsTotalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(permissionsPage - 1) * permissionsLimit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(permissionsPage * permissionsLimit, permissionsTotal)}
                        </span>{' '}
                        of <span className="font-medium">{permissionsTotal}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          type="button"
                          onClick={() => fetchPermissions(permissionsStatus, Math.max(1, permissionsPage - 1))}
                          disabled={permissionsPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            permissionsPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: Math.min(5, permissionsTotalPages) }, (_, i) => {
                          let pageNum;
                          if (permissionsTotalPages <= 5) pageNum = i + 1;
                          else if (permissionsPage <= 3) pageNum = i + 1;
                          else if (permissionsPage >= permissionsTotalPages - 2) pageNum = permissionsTotalPages - 4 + i;
                          else pageNum = permissionsPage - 2 + i;
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => fetchPermissions(permissionsStatus, pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                permissionsPage === pageNum
                                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => fetchPermissions(permissionsStatus, Math.min(permissionsTotalPages, permissionsPage + 1))}
                          disabled={permissionsPage === permissionsTotalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            permissionsPage === permissionsTotalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
        </div>
      )}

      {phase === 'form' && (
        <form
          onSubmit={handleSubmitOuting}
          className="bg-white shadow rounded-lg p-6 space-y-6"
        >
          <h2 className="text-lg font-semibold text-gray-900">New outing permission</h2>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {formError}
            </div>
          )}

          <div className="grid gap-6">
            <div className="grid gap-4">
              <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1">
                <span className="col-span-2">Roll / Admin No.</span>
                <span className="col-span-3">Student (from DB)</span>
                <span className="col-span-2">Student phone (from DB)</span>
                <span className="col-span-2">Parent phone (from DB)</span>
                <span className="col-span-3">Block</span>
              </div>
              {rows.map((row, idx) => (
                <div
                  key={row._key}
                  className="border border-gray-200 rounded-lg p-4 md:p-3 md:grid md:grid-cols-12 md:gap-2 md:items-start space-y-3 md:space-y-0 bg-gray-50/50 relative"
                >
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOutingMember(idx)}
                      className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100"
                      title="Remove this member row"
                      aria-label="Remove member row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="md:col-span-2 pr-8 md:pr-0">
                    <label className="md:hidden text-xs font-medium text-gray-500 block mb-1">
                      Roll / Admin No.
                    </label>
                    <input
                      type="text"
                      value={row.roll}
                      onChange={(e) => handleRollChange(idx, e.target.value)}
                      onBlur={(e) => lookupRollForValue(idx, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm uppercase"
                      placeholder="e.g. 23CS101"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={submitting}
                    />
                    {row.lookupLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600 mt-2" />
                    )}
                    {row.lookupError && (
                      <p className="mt-2 text-xs text-red-600">{row.lookupError}</p>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <label className="md:hidden text-xs font-medium text-gray-500 block mb-1">
                      Student name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={row.studentName}
                      placeholder="—"
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs font-medium text-gray-500 block mb-1">
                      Student phone
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={row.studentPhone}
                      placeholder="—"
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-800"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs font-medium text-gray-500 block mb-1">
                      Parent phone
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={row.parentPhone}
                      placeholder="Enter roll then tab away"
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white text-gray-800"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="md:hidden text-xs font-medium text-gray-500 block mb-1">
                      Block
                    </label>
                    <input
                      type="text"
                      value={row.block}
                      onChange={(e) => updateRow(idx, { block: e.target.value })}
                      placeholder="Eg. Krishna"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-800"
                      disabled={submitting}
                      autoComplete="off"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOutingMember}
              disabled={rows.length >= MAX_OUTING_MEMBERS || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add a member
            </button>
            {rows.length >= MAX_OUTING_MEMBERS && (
              <p className="text-xs text-gray-500">
                Maximum {MAX_OUTING_MEMBERS} members per permission.
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outing out (date & time)
              </label>
              <input
                type="datetime-local"
                required
                value={outingOut}
                onChange={(e) => setOutingOut(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return in (date & time)
              </label>
              <input
                type="datetime-local"
                required
                value={outingIn}
                onChange={(e) => setOutingIn(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending SMS…' : 'Submit & send SMS to parents'}
          </button>

          {/* After submit, go back to list where status is shown */}
        </form>
      )}

      <ConfirmationDialog
        isOpen={!!outingDeleteTarget}
        onClose={() => setOutingDeleteTarget(null)}
        onConfirm={() => {
          const t = outingDeleteTarget;
          if (t) void executeOutingPermissionDelete(t);
        }}
        title="Remove member"
        message={
          outingDeleteTarget?.kind === 'bulkMembers'
            ? `Remove ${outingDeleteTarget.members.length} selected member(s)? Others on the same outing stay listed. Removing the last member deletes the whole permission row.`
            : `Remove ${outingDeleteTarget?.rollNumber ? `${String(outingDeleteTarget.rollNumber).trim()} ` : ''}from this outing permission? Other members on the same outing are not removed.`
        }
        isDeleteDialog
      />
    </div>
  );
}

function FacultyComplaintsPanel({ navigate }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('facultyToken')}`,
    'Content-Type': 'application/json',
  });

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('facultyToken');
      if (!token) {
        setError('Please log in as faculty to view complaints.');
        setComplaints([]);
        return;
      }
      const { data } = await axios.get('/api/complaints', { headers: authHeaders() });
      if (data.success) setComplaints(data.data || []);
      else setError(data.message || 'Failed to load complaints.');
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        (e.code === 'ERR_NETWORK'
          ? 'Cannot reach the server. Ensure the API is running on port 5000 and the dev/preview proxy is configured.'
          : 'Failed to load complaints.');
      setError(msg);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await axios.patch(`/api/complaints/${id}`, { status }, { headers: authHeaders() });
      if (data.success && data.data) {
        setComplaints((prev) => prev.map((c) => (c._id === id ? { ...c, ...data.data } : c)));
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Could not update status.');
    }
  };

  const statusClass = (s) => {
    if (s === 'resolved') return 'bg-green-100 text-green-800';
    if (s === 'in_review') return 'bg-blue-100 text-blue-800';
    return 'bg-amber-100 text-amber-800';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student complaints</h1>
          <p className="text-gray-600 mt-1">Submissions from the home page complaint box</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Home
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll no.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No complaints yet.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.rollNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{c.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-md">
                      <span className="line-clamp-4 whitespace-pre-wrap">{c.message}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={c.status || 'open'}
                        onChange={(e) => handleStatusChange(c._id, e.target.value)}
                        className={`text-xs font-semibold rounded-lg border-0 py-1.5 pl-2 pr-8 ${statusClass(c.status)}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_review">In review</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// CSV Upload Component
const CSVUploadSection = ({ csvFiles, onFileChange, onUpload, uploadStatus, isUploading }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CSV Upload</h1>
          <p className="text-gray-600 mt-2">Upload roll numbers and admission numbers for students</p>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Home
        </button>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`mb-6 p-4 rounded-lg border ${
          uploadStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="font-medium">{uploadStatus.message}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Roll Numbers Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Roll Numbers (2nd, 3rd, 4th Year)</h3>
              <p className="text-sm text-gray-600">Upload CSV file with roll numbers for senior students</p>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => onFileChange('rollNumbers', e.target.files[0])}
              className="hidden"
              id="rollNumbersCsv"
            />
            <label htmlFor="rollNumbersCsv" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                {csvFiles.rollNumbers ? csvFiles.rollNumbers.name : 'Click to upload CSV file'}
              </p>
              <p className="text-sm text-gray-500">CSV files only</p>
            </label>
          </div>
          
          <button
            onClick={() => onUpload('rollNumbers')}
            disabled={!csvFiles.rollNumbers || isUploading}
            className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload Roll Numbers'}
          </button>
        </div>

        {/* Administration Numbers Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Admission Numbers (1st Year)</h3>
              <p className="text-sm text-gray-600">Upload CSV file with admission numbers for students</p>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => onFileChange('adminNumbers', e.target.files[0])}
              className="hidden"
              id="adminNumbersCsv"
            />
            <label htmlFor="adminNumbersCsv" className="cursor-pointer">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                {csvFiles.adminNumbers ? csvFiles.adminNumbers.name : 'Click to upload CSV file'}
              </p>
              <p className="text-sm text-gray-500">CSV files only</p>
            </label>
          </div>
          
          <button
            onClick={() => onUpload('adminNumbers')}
            disabled={!csvFiles.adminNumbers || isUploading}
            className="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload Administration Numbers'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">CSV Format Instructions:</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-2">Roll Numbers CSV (2nd, 3rd, 4th Year):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Column 1: Roll Number</li>
              <li>Each row should contain only one roll number</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Administration Numbers CSV (1st Year):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Column 1: Administration Number</li>
              <li>Each row should contain only one administration number</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-100 rounded text-yellow-800 text-sm">
          <strong>Note:</strong> CSV files should contain only roll numbers or administration numbers. No additional student information is required.
        </div>
      </div>
    </div>
  );
};

export default FacultyPage;
