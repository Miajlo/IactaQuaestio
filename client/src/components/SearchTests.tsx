import { useState, useEffect } from "react";
import { Search, ChevronRight, FileText, Calendar, BookOpen, Filter, X, ArrowLeft } from "lucide-react";
import "../styles/SearchTests.css";
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
  description?: string;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
  faculty_code: string;
  module_code: string;
  year: number;
  semester: number;
  mandatory: boolean;
  espb: number;
}

interface Test {
  _id: string;
  subject_code: string;
  exam_period: string;
  academic_year: string;
  test_type: string;
  full_text: string;
}

function SearchTests() {
  const [step, setStep] = useState(1);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [allTests, setAllTests] = useState<Test[]>([]);
  
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const [facultySearch, setFacultySearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [testTextSearch, setTestTextSearch] = useState("");
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

  
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculties();
  }, []);

 const formatTestText = (text: string) => {
    if (!text) return [];

    let firstQuestionMatch = text.match(/\n\s*1\.\s*\(/);
    let startIndex = 0;
    let hasParenthesis = true;

    if (firstQuestionMatch) {
      startIndex = text.indexOf(firstQuestionMatch[0]);
    } else {
      firstQuestionMatch = text.match(/^\s*1\.\s+/m);
      if (!firstQuestionMatch) {
        return []; 
      }
      startIndex = text.indexOf(firstQuestionMatch[0]);
      hasParenthesis = false;
    }

    const cleanedText = text.substring(startIndex).trim();
    
    const questionParts = hasParenthesis
      ? cleanedText.split(/\n\s*(?=\d+\.\s*\()/).filter(part => part.trim())
      : cleanedText.split(/\n\s*(?=\d+\.\s+)/).filter(part => part.trim());

    const questions = questionParts.map(q => {
      const withoutNumber = q.replace(/^\d+\.\s*/, '');
      
      return withoutNumber
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join(' ')
        .trim();
    });

    return questions;
  };

  const toggleTest = (testId: string) => {
    setExpandedTests(prev => ({
      ...prev,
      [testId]: !prev[testId]
    }));
  };

  const fetchFaculties = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/faculties");
      setFaculties(res.data);
    } catch (error) {
      console.error("Error fetching faculties:", error);
    }
    setIsLoading(false);
  };

  const handleSelectFaculty = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setSelectedModule(null);
    setSelectedSubject(null);
    setStep(2);
  };

  const handleSelectModule = async (module: Module) => {
    setSelectedModule(module);
    setSelectedSubject(null);
    setStep(3);
    
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/subjects`, {
        params: {
          module_code: module.code,
          year: selectedYear
        }
      });
      setSubjects(res.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
    setIsLoading(false);
  };

  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    if (selectedModule) {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get(`/subjects`, {
          params: {
            module_code: selectedModule.code,
            year: year
          }
        });
        setSubjects(res.data);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
      setIsLoading(false);
    }
  };

  const handleSelectSubject = async (subject: Subject) => {
    setSelectedSubject(subject);
    setStep(4);
    
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/tests/find`, {
        params: {
          subject_code: subject.code
        }
      });
      setAllTests(res.data);
      setTests(res.data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
    setIsLoading(false);
  };

   const handleTestSearch = async () => {
    if (!selectedSubject) return;

    const query = testTextSearch.trim().toLowerCase();

    if (!query) {
      setTests(allTests);
      return;
    }
    
    setIsLoading(true);
    try {
      const filtered = allTests.filter(test => 
        test.full_text.toLowerCase().includes(query)
      );
      setTests(filtered);
    } catch (error) {
      console.error("Error searching tests:", error);
    }
    setIsLoading(false);
  };

  const resetSearch = () => {
    setStep(1);
    setSelectedFaculty(null);
    setSelectedModule(null);
    setSelectedSubject(null);
    setFacultySearch("");
    setModuleSearch("");
    setSubjectSearch("");
    setTestTextSearch("");
    setTests([]);
    setSubjects([]);
  };

  const filteredFaculties = faculties.filter(f =>
    f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
    f.code.toLowerCase().includes(facultySearch.toLowerCase())
  );

  const filteredModules = selectedFaculty?.modules.filter(m =>
    m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
    m.code.toLowerCase().includes(moduleSearch.toLowerCase())
  ) || [];

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <div className="search-container">
      <button className="back-to-home-btn" onClick={() => navigate("/")}>
          <ArrowLeft />
          Back to home
      </button>
      <div className="search-header">
        <h1 className="search-title">Search Tests</h1>
        <p className="search-subtitle">Find exam questions and past tests</p>
      </div>

      <div className="search-content">
        <div className="breadcrumb">
          <button 
            className={`breadcrumb-item ${step >= 1 ? 'active' : ''}`}
            onClick={() => setStep(1)}
          >
            Faculty
          </button>
          <ChevronRight className="breadcrumb-arrow" />
          <button 
            className={`breadcrumb-item ${step >= 2 ? 'active' : ''} ${!selectedFaculty ? 'disabled' : ''}`}
            onClick={() => selectedFaculty && setStep(2)}
            disabled={!selectedFaculty}
          >
            Module
          </button>
          <ChevronRight className="breadcrumb-arrow" />
          <button 
            className={`breadcrumb-item ${step >= 3 ? 'active' : ''} ${!selectedModule ? 'disabled' : ''}`}
            onClick={() => selectedModule && setStep(3)}
            disabled={!selectedModule}
          >
            Subject
          </button>
          <ChevronRight className="breadcrumb-arrow" />
          <button 
            className={`breadcrumb-item ${step >= 4 ? 'active' : ''} ${!selectedSubject ? 'disabled' : ''}`}
            onClick={() => selectedSubject && setStep(4)}
            disabled={!selectedSubject}
          >
            Tests
          </button>
        </div>

        {(selectedFaculty || selectedModule || selectedSubject) && (
          <div className="selection-summary">
            {selectedFaculty && (
              <div className="selection-chip">
                <span className="chip-label">Faculty:</span>
                <span className="chip-value">{selectedFaculty.name}</span>
              </div>
            )}
            {selectedModule && (
              <div className="selection-chip">
                <span className="chip-label">Module:</span>
                <span className="chip-value">{selectedModule.name}</span>
              </div>
            )}
            {selectedSubject && (
              <div className="selection-chip">
                <span className="chip-label">Subject:</span>
                <span className="chip-value">{selectedSubject.name}</span>
              </div>
            )}
            <button onClick={resetSearch} className="reset-btn">
              <X />
              Reset
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="step-section">
            <div className="step-header">
              <h2>Select Your Faculty</h2>
              <div className="search-box">
                <Search />
                <input
                  type="text"
                  placeholder="Search faculties..."
                  value={facultySearch}
                  onChange={(e) => setFacultySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="cards-grid">
              {filteredFaculties.map((faculty) => (
                <div
                  key={faculty._id}
                  className="select-card"
                  onClick={() => handleSelectFaculty(faculty)}
                >
                  <div className="card-icon faculty-icon">
                    <BookOpen />
                  </div>
                  <h3>{faculty.name}</h3>
                  <span className="card-code">{faculty.code}</span>
                  <p className="card-meta">{faculty.modules.length} modules</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedFaculty && (
          <div className="step-section">
            <div className="step-header">
              <h2>Select Module</h2>
              <div className="search-box">
                <Search />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="cards-grid">
              {filteredModules.map((module, index) => (
                <div
                  key={index}
                  className="select-card"
                  onClick={() => handleSelectModule(module)}
                >
                  <div className="card-icon module-icon">
                    <Filter />
                  </div>
                  <h3>{module.name}</h3>
                  <span className="card-code">{module.code}</span>
                  {module.description && <p className="card-desc">{module.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && selectedModule && (
          <div className="step-section">
            <div className="step-header">
              <h2>Select Subject</h2>
              <div className="controls-row">
                <div className="year-selector">
                  <label>Year:</label>
                  {[1, 2, 3, 4].map(year => (
                    <button
                      key={year}
                      className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                      onClick={() => handleYearChange(year)}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                <div className="search-box">
                  <Search />
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="cards-grid">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject._id}
                  className="select-card subject-card"
                  onClick={() => handleSelectSubject(subject)}
                >
                  <div className="card-icon subject-icon">
                    <FileText />
                  </div>
                  <h3>{subject.name}</h3>
                  <span className="card-code">{subject.code}</span>
                  <div className="subject-meta">
                    <span className="meta-item">Year {subject.year}</span>
                    <span className="meta-item">Sem {subject.semester}</span>
                    <span className="meta-item">{subject.espb} ECTS</span>
                  </div>
                  {subject.mandatory ? (
                    <span className="mandatory-badge">Mandatory</span>
                  ) : (
                    <span className="mandatory-badge badge optional">Not Mandatory</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && selectedSubject && (
          <div className="step-section">
            <div className="step-header">
              <h2>Tests for {selectedSubject.name}</h2>
              <div className="search-box-large">
                <Search />
                <input
                  type="text"
                  placeholder="Search in test questions..."
                  value={testTextSearch}
                  onChange={(e) => setTestTextSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
                />
                <button onClick={handleTestSearch} className="search-action-btn">
                  Search
                </button>
              </div>
            </div>
            <div className="tests-list">
              {tests.map((test) => {
                const questions = formatTestText(test.full_text);
                const isExpanded = expandedTests[test._id];
                const fullText = test.full_text;
                const shouldTruncate = fullText.length > 300;

                return (
                  <div key={test._id} className="test-card">
                    <div className="test-header">
                      <div className="test-icon">
                        <FileText />
                      </div>
                      <div className="test-info">
                        <h3>{test.exam_period}</h3>
                        <p className="test-meta">
                          <Calendar size={14} />
                          {test.academic_year} • {test.test_type}
                        </p>
                      </div>
                    </div>
                    <div className="test-content">
                      <ol className={`test-questions ${isExpanded ? 'expanded' : ''}`}>
                        {questions.map((q, index) => (
                          <li key={index}>
                            <div className="test-text">
                              {q}
                            </div>
                          </li>
                        ))}
                      </ol>
                      {shouldTruncate && (
                        <button
                          className={`view-full-btn ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleTest(test._id)}
                        >
                          {isExpanded ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {tests.length === 0 && !isLoading && (
                <div className="no-results">
                  <FileText size={48} />
                  <p>No tests found for this subject</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchTests;