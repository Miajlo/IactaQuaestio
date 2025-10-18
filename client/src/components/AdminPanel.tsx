import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building2, BookOpen, X, Save, Search, MapPin, Users, Shield, ShieldOff, UserX, ArrowLeft } from "lucide-react";
import "../styles/AdminPanel.css";
import axiosInstance from "../utils/axiosInstance.ts";
import userService, { User } from "../services/userService.ts";
import { useNavigate } from "react-router-dom";

interface Address {
  street_name: string;
  street_number: number;
  city: string;
  postal_code: string;
}

interface Faculty {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  address: Address;
  modules: Module[];
}

interface Module {
  name: string;
  code: string;
  description?: string;
}

interface Subject {
  _id?: string;
  code: string;
  name: string;
  faculty_code: string;
  module_code: string;
  year: number;
  semester: number;
  mandatory: boolean;
  espb: number;
  description?: string;
}

type EntityType = 'faculty' | 'subject' | 'module' | 'user';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<EntityType>('faculty');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string, type: EntityType} | null>(null);

  const navigate = useNavigate();

  const [facultyForm, setFacultyForm] = useState<Faculty>({
    name: "", code: "", description: "", address: { street_name: "", street_number: 1, city: "", postal_code: "" }, modules: []
  });
  const [subjectForm, setSubjectForm] = useState<Subject>({
    code: "", name: "", faculty_code: "", module_code: "", year: 1, semester: 1, mandatory: true, espb: 0, description: ""
  });
  const [moduleForm, setModuleForm] = useState<Module>({
    name: "", code: "", description: ""
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (showModal && activeTab === 'subject' && faculties.length === 0) {
      axiosInstance.get("/faculties")
        .then(res => setFaculties(res.data))
        .catch(err => console.error("Error fetching faculties:", err));
    }
  }, [showModal, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'faculty') {
        const res = await axiosInstance.get("/faculties");
        setFaculties(res.data);
      } else if (activeTab === 'subject') {
        const res = await axiosInstance.get("/subjects");
        setSubjects(res.data);
      } else if (activeTab === 'user') {
        const usersData = await userService.getAllUsers();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleCreate = () => {
    setEditingItem(null);
    if (activeTab === 'faculty') {
      setFacultyForm({ name: "", code: "", description: "", address: { street_name: "", street_number: 1, city: "", postal_code: "" }, modules: [] });
    } else if (activeTab === 'subject') {
      setSubjectForm({ code: "", name: "", faculty_code: "", module_code: "", year: 1, semester: 1, mandatory: true, espb: 0, description: "" });
    } else {
      setModuleForm({ name: "", code: "", description: "" });
    }
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'faculty') {
      setFacultyForm(item);
    } else if (activeTab === 'subject') {
      setSubjectForm(item);
    }
    setShowModal(true);
  };

  const handleDeleteClick = (id: string, name: string, type: EntityType) => {
    setDeleteTarget({ id, name, type });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'faculty') {
        await axiosInstance.delete(`/faculties/${deleteTarget.id}`);
      } else if (deleteTarget.type === 'subject') {
        await axiosInstance.delete(`/subjects/${deleteTarget.id}`);
      } else if (deleteTarget.type === 'user') {
        await userService.deleteUser(deleteTarget.id);
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (error: any) {
      if(error.response?.data?.detail === "You cannot delete your own account") {
        alert("You cannot delete your own account");
      }
      console.error("Error deleting:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (activeTab === 'faculty') {
        if (editingItem) {
          await axiosInstance.put(`/faculties/${editingItem._id}`, facultyForm);
        } else {
          await axiosInstance.post("/faculties", facultyForm);
        }
      } else if (activeTab === 'subject') {
        if (editingItem) {
          await axiosInstance.put(`/subjects/${editingItem._id}`, subjectForm);
        } else {
          await axiosInstance.post("/subjects/", subjectForm);
        }
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await userService.toggleAdmin(userId, !currentStatus);
      fetchData();
    } catch (error: any) {
      if(error.response?.data?.detail === "You cannot remove your own admin privileges") {
        alert("You cannot remove your own admin privileges.");
      }
      console.error("Error toggling admin status:", error);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await userService.toggleActive(userId, !currentStatus);
      fetchData();
    } catch (error: any ) {
      if(error.response?.data?.detail === "You cannot deactivate your own account") {
        alert("You cannot deactivate your own account");
      }
      console.error("Error toggling active status:", error);
    }
  };

  const addModuleToFaculty = () => {
    if (!moduleForm.name || !moduleForm.code) {
      alert("Please fill in module name and code");
      return;
    }
    setFacultyForm({
      ...facultyForm,
      modules: [...facultyForm.modules, { ...moduleForm }]
    });
    setModuleForm({ name: "", code: "", description: "" });
  };

  const removeModuleFromFaculty = (index: number) => {
    setFacultyForm({
      ...facultyForm,
      modules: facultyForm.modules.filter((_, i) => i !== index)
    });
  };

  const filteredFaculties = faculties.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedFaculty = faculties.find(f => f.code === subjectForm.faculty_code);
  const availableModules = selectedFaculty?.modules || [];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="admin-title">Admin Panel</h1>
        <p className="admin-subtitle">Manage faculties, subjects, modules, and users</p>
        <button className="back-to-home-btn" onClick={() => navigate("/")}>
          <ArrowLeft />
          Back to home
        </button>
      </div>

      <div className="admin-content">
        <div className="admin-controls">
          <div className="admin-tabs">
            <button
              onClick={() => setActiveTab('faculty')}
              className={`admin-tab ${activeTab === 'faculty' ? 'active' : ''}`}
            >
              <Building2 />
              Faculties
            </button>
            <button
              onClick={() => setActiveTab('subject')}
              className={`admin-tab ${activeTab === 'subject' ? 'active' : ''}`}
            >
              <BookOpen />
              Subjects
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`admin-tab ${activeTab === 'user' ? 'active' : ''}`}
            >
              <Users />
              Users
            </button>
          </div>

          <div className="admin-actions">
            <div className="search-box">
              <Search />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {activeTab !== 'user' && (
              <button onClick={handleCreate} className="add-btn">
                <Plus />
                Add New
              </button>
            )}
          </div>
        </div>

        <div className="admin-grid">
          {activeTab === 'faculty' && filteredFaculties.map((faculty) => (
            <div key={faculty._id} className="admin-card">
              <div className="card-header">
                <div className="card-icon-admin faculty-icon">
                  <Building2 />
                </div>
                <div className="card-info">
                  <h3>{faculty.name}</h3>
                  <span className="card-code">{faculty.code}</span>
                </div>
              </div>
              
              <p className="card-description">{faculty.description}</p>
              
              <div className="card-address">
                <div className="address-icon">
                  <MapPin size={16} />
                </div>
                <div className="address-content">
                  <p className="address-street">{faculty.address.street_name} {faculty.address.street_number}</p>
                  <p className="address-city">{faculty.address.postal_code} {faculty.address.city}</p>
                </div>
              </div>

              <div className="card-modules">
                <span className="modules-label">Modules: {faculty.modules.length}</span>
                <div className="module-tags">
                  {faculty.modules.slice(0, 3).map((mod, i) => (
                    <span key={i} className="module-tag">{mod.code}</span>
                  ))}
                  {faculty.modules.length > 3 && (
                    <span className="module-tag">+{faculty.modules.length - 3}</span>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button onClick={() => handleEdit(faculty)} className="edit-btn">
                  <Edit />
                </button>
                <button onClick={() => handleDeleteClick(faculty._id!, faculty.name, 'faculty')} className="delete-btn">
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'subject' && filteredSubjects.map((subject) => (
            <div key={subject._id} className="admin-card">
              <div className="card-header">
                <div className="card-icon-admin subject-icon">
                  <BookOpen />
                </div>
                <div className="card-info">
                  <h3>{subject.name}</h3>
                  <span className="card-code">{subject.code}</span>
                </div>
              </div>
              <div className="subject-details">
                <div className="detail-item">
                  <span className="detail-label">Faculty:</span>
                  <span className="detail-value">{subject.faculty_code}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Module:</span>
                  <span className="detail-value">{subject.module_code}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Year/Semester:</span>
                  <span className="detail-value">{subject.year}/{subject.semester}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ECTS:</span>
                  <span className="detail-value">{subject.espb}</span>
                </div>
              </div>
              <div className="card-badges">
                {subject.mandatory ? (
                    <span className="badge mandatory">Mandatory</span>
                ) : (
                    <span className="badge optional">Elective</span>
                )}
              </div>
              <div className="card-actions">
                <button onClick={() => handleEdit(subject)} className="edit-btn">
                  <Edit />
                </button>
                <button onClick={() => handleDeleteClick(subject._id!, subject.name, 'subject')} className="delete-btn">
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}

          {activeTab === 'user' && filteredUsers.map((user) => (
            <div key={user.id} className="admin-card user-card">
              <div className="card-header">
                <div className={`card-icon-admin ${user.is_admin ? 'admin-user-icon' : 'regular-user-icon'}`}>
                  {user.is_admin ? <Shield /> : <Users />}
                </div>
                <div className="card-info">
                  <h3>{user.email}</h3>
                  <span className="card-date">Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="user-details">
                <div className="user-status-badges">
                  {user.is_admin && (
                    <span className="badge admin-badge-card">Admin</span>
                  )}
                  {user.is_active ? (
                    <span className="badge active-badge">Active</span>
                  ) : (
                    <span className="badge inactive-badge">Inactive</span>
                  )}
                </div>
              </div>

              <div className="card-actions user-actions">
                <button 
                  onClick={() => handleToggleAdmin(user.id, user.is_admin)} 
                  className={user.is_admin ? "revoke-admin-btn" : "grant-admin-btn"}
                  title={user.is_admin ? "Revoke admin privileges" : "Grant admin privileges"}
                >
                  {user.is_admin ? <ShieldOff /> : <Shield />}
                  {user.is_admin ? "Revoke Admin" : "Make Admin"}
                </button>
                <button 
                  onClick={() => handleToggleActive(user.id, user.is_active)} 
                  className="toggle-active-btn"
                  title={user.is_active ? "Deactivate user" : "Activate user"}
                >
                  <UserX />
                  {user.is_active ? "Deactivate" : "Activate"}
                </button>
                <button 
                  onClick={() => handleDeleteClick(user.id, user.email, 'user')} 
                  className="delete-btn"
                  title="Delete user"
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit' : 'Create'} {activeTab === 'faculty' ? 'Faculty' : 'Subject'}</h2>
              <button onClick={() => setShowModal(false)} className="modal-close">
                <X />
              </button>
            </div>

            <div className="modal-body">
              {activeTab === 'faculty' ? (
                <>
                  <div className="form-row">
                    <div className="form-group-admin">
                      <label>Name</label>
                      <input
                        type="text"
                        value={facultyForm.name}
                        onChange={(e) => setFacultyForm({...facultyForm, name: e.target.value})}
                        placeholder="Faculty name"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Code</label>
                      <input
                        type="text"
                        value={facultyForm.code}
                        onChange={(e) => setFacultyForm({...facultyForm, code: e.target.value})}
                        placeholder="Faculty code"
                      />
                    </div>
                  </div>

                  <div className="form-group-admin">
                    <label>Description</label>
                    <textarea
                      value={facultyForm.description}
                      onChange={(e) => setFacultyForm({...facultyForm, description: e.target.value})}
                      placeholder="Description"
                    />
                  </div>
                  
                  <div className="form-group-admin">
                    <label className="section-label">Address</label>
                    <div className="form-row">
                      <input
                        type="text"
                        value={facultyForm.address.street_name}
                        onChange={(e) => setFacultyForm({...facultyForm, address: {...facultyForm.address, street_name: e.target.value}})}
                        placeholder="Street Name"
                      />
                      <input
                        type="text"
                        value={facultyForm.address.street_number}
                        onChange={(e) => setFacultyForm({...facultyForm, address: {...facultyForm.address, street_number: e.target.value === "" ? 0 : Number(e.target.value)}})}
                        placeholder="Number"
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="text"
                        value={facultyForm.address.city}
                        onChange={(e) => setFacultyForm({...facultyForm, address: {...facultyForm.address, city: e.target.value}})}
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={facultyForm.address.postal_code}
                        onChange={(e) => setFacultyForm({...facultyForm, address: {...facultyForm.address, postal_code: e.target.value}})}
                        placeholder="Postal Code"
                      />
                    </div>
                  </div>

                  <div className="form-group-admin">
                    <label className="section-label">Modules</label>
                    <div className="modules-list">
                      {facultyForm.modules.length > 0 ? (
                        facultyForm.modules.map((mod, index) => (
                          <div key={index} className="module-item">
                            <div>
                              <strong>{mod.name}</strong>
                              <span className="module-code">({mod.code})</span>
                              {mod.description && <p className="module-desc">{mod.description}</p>}
                            </div>
                            <button 
                              onClick={() => removeModuleFromFaculty(index)}
                              className="remove-module-btn"
                              type="button"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="no-modules">No modules added yet</p>
                      )}
                    </div>
                    
                    <div className="module-form-grid">
                      <input
                        type="text"
                        value={moduleForm.name}
                        onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                        placeholder="Module name"
                      />
                      <input
                        type="text"
                        value={moduleForm.code}
                        onChange={(e) => setModuleForm({...moduleForm, code: e.target.value})}
                        placeholder="Module code"
                      />
                      <button 
                        onClick={addModuleToFaculty} 
                        className="add-module-btn"
                        type="button"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                      placeholder="Module description (optional)"
                      className="module-desc-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group-admin">
                      <label>Code</label>
                      <input
                        type="text"
                        value={subjectForm.code}
                        onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                        placeholder="Subject code"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Name</label>
                      <input
                        type="text"
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                        placeholder="Subject name"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group-admin">
                      <label>Faculty Code</label>
                      <input
                        type="text"
                        value={subjectForm.faculty_code}
                        onChange={(e) => setSubjectForm({...subjectForm, faculty_code: e.target.value})}
                        placeholder="Faculty code"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Module Code</label>
                      <input
                        type="text"
                        value={subjectForm.module_code}
                        onChange={(e) => setSubjectForm({...subjectForm, module_code: e.target.value})}
                        placeholder="Module code"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group-admin">
                      <label>Year</label>
                      <input
                        type="text"
                        value={subjectForm.year === 0 ? "" : subjectForm.year.toString()}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) { 
                                setSubjectForm({...subjectForm, year: val === "" ? 0 : Number(val)});
                            }
                        }}
                        placeholder="Enter year"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>Semester</label>
                      <input
                        type="text"
                        value={subjectForm.semester === 0 ? "" : subjectForm.semester.toString()}
                         onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) {
                                setSubjectForm({...subjectForm, semester: val === "" ? 0 : Number(val)});
                            }
                        }}
                        placeholder="Enter semester"
                      />
                    </div>
                    <div className="form-group-admin">
                      <label>ECTS</label>
                      <input
                        type="text"
                        value={subjectForm.espb === 0 ? "" : subjectForm.espb.toString()}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) {
                                setSubjectForm({
                                    ...subjectForm,
                                    espb: val === "" ? 0 : Number(val),
                                });
                            }
                        }}
                        placeholder="Enter ECTS"
                      />
                    </div>
                  </div>
                  <div className="form-group-admin">
                    <label>Description</label>
                    <textarea
                      value={subjectForm.description || ""}
                      onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                      placeholder="Subject description (optional)"
                    />
                  </div>
                  <div className="form-group-admin checkbox-group">
                    <label className="checkbox-label">
                      <span className="checkbox-text">Mandatory Subject</span>
                      <input
                        type="checkbox"
                        checked={subjectForm.mandatory}
                        onChange={(e) => setSubjectForm({...subjectForm, mandatory: e.target.checked})}
                        className="checkbox-input"
                      />
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleSubmit} className="save-btn">
                <Save />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && deleteTarget && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete {deleteTarget.type === 'faculty' ? 'Faculty' : deleteTarget.type === 'subject' ? 'Subject' : 'User'}</h2>
              <button onClick={() => setShowDeleteModal(false)} className="modal-close">
                <X />
              </button>
            </div>
            <div className="modal-body delete-body">
              <p className="delete-message">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmDelete} className="delete-confirm-btn">
                <Trash2 />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
