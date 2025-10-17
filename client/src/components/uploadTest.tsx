import { useState } from "react";
import { Upload, FileText, Calendar, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import "../styles/UploadTest.css"
import axiosInstance from "../utils/axiosInstance.ts";

function UploadTestForm() {
  const [subjectCode, setSubjectCode] = useState("");
  const [examPeriod, setExamPeriod] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [testType, setTestType] = useState("regular");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setMessage("");

    if (!file) {
      setMessage("Please select a file first.");
      setIsSuccess(false);
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("subject_code", subjectCode);
    formData.append("exam_period", examPeriod);
    formData.append("academic_year", academicYear);
    formData.append("test_type", testType);
    formData.append("file", file);

    try {

      const res = await axiosInstance.post("/tests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMessage("Test uploaded successfully!");
      setIsSuccess(true);
      
      setTimeout(() => {
        setSubjectCode("");
        setExamPeriod("");
        setAcademicYear("");
        setTestType("regular");
        setFile(null);
        setMessage("");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.detail || "Upload failed");
      setIsSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <div className="upload-header">
          <div className="header-title">
            <Upload />
            <h1>Upload Test</h1>
          </div>
          <p className="header-subtitle">Submit your exam materials for archival</p>
        </div>

        <div className="upload-form">
          <div className="form-group">
            <label className="form-label">
              <BookOpen />
              Subject Code
            </label>
            <input
              type="text"
              placeholder="e.g., CS101"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                <Calendar />
                Exam Period
              </label>
              <input
                type="text"
                placeholder="e.g., January"
                value={examPeriod}
                onChange={(e) => setExamPeriod(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar />
                Academic Year
              </label>
              <input
                type="text"
                placeholder="e.g., 2024/2025"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <FileText />
              Test Type
            </label>
            <div className="test-type-grid">
              {[
                { value: "regular", label: "Regular" },
                { value: "midterm", label: "Midterm" },
                { value: "final", label: "Final" }
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setTestType(type.value)}
                  className={`test-type-btn ${testType === type.value ? 'active' : 'inactive'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Upload />
              Upload File
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file-input"
                id="file-upload"
              />
              <div className="file-drop-content">
                <Upload className="file-drop-icon" />
                {file ? (
                  <div>
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="file-instruction">
                      Drop your file here or click to browse
                    </p>
                    <p className="file-formats">
                      Supports: Images and PDF files
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            onClick={handleSubmit}
            className="submit-btn"
          >
            {isUploading ? (
              <span className="loading-spinner">
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle
                    className="spinner-circle"
                    cx="12"
                    cy="12"
                    r="10"
                  />
                  <path
                    className="spinner-path"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload Test"
            )}
          </button>

          {message && (
            <div className={`message-box ${isSuccess ? 'success' : 'error'}`}>
              {isSuccess ? <CheckCircle /> : <AlertCircle />}
              <p className="message-text">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadTestForm;