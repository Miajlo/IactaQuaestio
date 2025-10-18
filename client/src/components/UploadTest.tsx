import { useEffect, useState } from "react";
import { Upload, FileText, Calendar, BookOpen, CheckCircle, AlertCircle, Building2, Filter, GraduationCap, ArrowLeft } from "lucide-react";
import "../styles/UploadTest.css"
import axiosInstance from "../utils/axiosInstance.ts";
import { useNavigate } from "react-router-dom";

interface Faculty {
  _id: string;
  name: string;
  code: string;
  modules: Module[];
}

interface Module {
  name: string;
  code: string;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
  year: number;
}

function UploadTestForm() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const [examPeriod, setExamPeriod] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [testType, setTestType] = useState("regular");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (selectedModule && selectedYear) {
      fetchSubjects();
    }
  }, [selectedModule, selectedYear]);

  const fetchFaculties = async () => {
    try {
      const res = await axiosInstance.get("/faculties");
      setFaculties(res.data);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
  };

   const fetchSubjects = async () => {
    if (!selectedModule) return;
    try {
      const res = await axiosInstance.get(`/subjects`, {
        params: {
          module_code: selectedModule.code,
          year: selectedYear
        }
      });
      setSubjects(res.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

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

    if (!selectedSubject) {
      setMessage("Please select a subject first.");
      setIsSuccess(false);
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("subject_code", selectedSubject.code);
    formData.append("exam_period", examPeriod);
    formData.append("academic_year", academicYear);
    formData.append("test_type", testType);
    formData.append("file", file);
    
    try {
      const res = await axiosInstance.post("/tests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setMessage("Test uploaded successfully!");
      setIsSuccess(true);
      
      setTimeout(() => {
        setSelectedFaculty(null);
        setSelectedModule(null);
        setSelectedSubject(null);
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
      <button className="back-to-home-btn" onClick={() => navigate("/")}>
          <ArrowLeft />
          Back to home
      </button>
      <div className="upload-header">
        <h1 className="upload-title">Upload Test</h1>
        <p className="upload-subtitle">Share your exam materials to help the community</p>
      </div>

      <div className="upload-content">
        <div className="upload-card">
          <form onSubmit={handleSubmit}>
            <div className="selection-section">
              <h3 className="section-title">
                <BookOpen />
                Select Subject
              </h3>
              
              <div className="form-row-enhanced">
                <div className="form-group-enhanced">
                  <label className="form-label-enhanced">
                    <Building2 size={16} />
                    Faculty
                  </label>
                  <select
                    value={selectedFaculty?.code || ""}
                    onChange={(e) => {
                      const faculty = faculties.find(f => f.code === e.target.value);
                      setSelectedFaculty(faculty || null);
                      setSelectedModule(null);
                      setSelectedSubject(null);
                    }}
                    className="form-select"
                    required
                  >
                    <option value="">Select faculty...</option>
                    {faculties.map(f => (
                      <option key={f._id} value={f.code}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-enhanced">
                  <label className="form-label-enhanced">
                    <Filter size={16} />
                    Module
                  </label>
                  <select
                    value={selectedModule?.code || ""}
                    onChange={(e) => {
                      const module = selectedFaculty?.modules.find(m => m.code === e.target.value);
                      setSelectedModule(module || null);
                      setSelectedSubject(null);
                    }}
                    className="form-select"
                    disabled={!selectedFaculty}
                    required
                  >
                    <option value="">Select module...</option>
                    {selectedFaculty?.modules.map((m, i) => (
                      <option key={i} value={m.code}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-enhanced">
                <div className="form-group-enhanced">
                  <label className="form-label-enhanced">
                    <GraduationCap size={16} />
                    Year
                  </label>
                  <div className="year-buttons">
                    {[1, 2, 3, 4].map(year => (
                      <button
                        key={year}
                        type="button"
                        className={`year-button ${selectedYear === year ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedYear(year);
                          setSelectedSubject(null);
                        }}
                        disabled={!selectedModule}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-enhanced">
                  <label className="form-label-enhanced">
                    <BookOpen size={16} />
                    Subject
                  </label>
                  <select
                    value={selectedSubject?.code || ""}
                    onChange={(e) => {
                      const subject = subjects.find(s => s.code === e.target.value);
                      setSelectedSubject(subject || null);
                    }}
                    className="form-select"
                    disabled={!selectedModule || subjects.length === 0}
                    required
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="details-section">
              <h3 className="section-title">
                <FileText />
                Test Details
              </h3>

              <div className="form-row-enhanced">
                <div className="form-group-enhanced">
                  <label className="form-label-enhanced">
                    <Calendar size={16} />
                    Exam Period
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Januarski 2024"
                    value={examPeriod}
                    onChange={(e) => setExamPeriod(e.target.value)}
                    className="form-input-upload"
                    required
                  />
                </div>

                <div className="form-group-enhanced">
                  <label className="form-label-enhanced">
                    <Calendar size={16} />
                    Academic Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2023/2024"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="form-input-upload"
                    required
                  />
                </div>
              </div>

              <div className="form-group-enhanced">
                <label className="form-label-enhanced">
                  <FileText size={16} />
                  Test Type
                </label>
                <div className="test-type-buttons">
                  {[
                    { value: "regular", label: "Regular" },
                    { value: "midterm", label: "Midterm" },
                    { value: "final", label: "Final" }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTestType(type.value)}
                      className={`test-type-button ${testType === type.value ? 'active' : ''}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="upload-section">
              <h3 className="section-title">
                <Upload />
                Upload File
              </h3>
              
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
                    <div className="file-info">
                      <p className="file-name">{file.name}</p>
                      <p className="file-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="file-placeholder">
                      <p className="file-instruction">
                        Drop your file here or click to browse
                      </p>
                      <p className="file-formats">
                        Supports: Images (JPG, PNG) and PDF files
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading || !selectedSubject}
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
                  Uploading & Processing...
                </span>
              ) : (
                <>
                  <Upload size={20} />
                  Upload Test
                </>
              )}
            </button>

            {message && (
              <div className={`message-box ${isSuccess ? 'success' : 'error'}`}>
                {isSuccess ? <CheckCircle /> : <AlertCircle />}
                <p className="message-text">{message}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadTestForm;