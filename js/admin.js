// Admin Dashboard Logic
import { db } from "./firebase-config.js";
import { 
    collection, 
    doc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy 
} from "./firebase-config.js";
import { protectRoute, showToast, showLoader, hideLoader, watchAuthState, clerkLoadedPromise } from "./auth.js";

// Initialize admin protection
protectRoute("admin");

let allStudents = [];
let allMessages = [];
let allAnnouncements = [];
let editingAnnouncementId = null;

// Load Admin Data on authentication state confirmed
watchAuthState(async (user) => {
    if (!user) return;
    
    showLoader();
    try {
        // Mount Clerk User Button in navbar
        const clerk = await clerkLoadedPromise;
        const userBtnContainer = document.getElementById("clerk-user-button");
        if (userBtnContainer) {
            clerk.mountUserButton(userBtnContainer);
        }

        await loadAdminStats();
        await loadStudentsTable();
        await loadContactsList();
        await loadAnnouncementsCrud();
    } catch (error) {
        console.error("Admin data loading error:", error);
        showToast("Failed to load admin dashboard data.", "danger");
    } finally {
        hideLoader();
    }
});

// Student table search filter
const searchInput = document.getElementById("student-search");
if (searchInput) {
    searchInput.addEventListener("input", filterStudentsTable);
}

// Student status filter select
const statusFilter = document.getElementById("student-status-filter");
if (statusFilter) {
    statusFilter.addEventListener("change", filterStudentsTable);
}

// Announcement Form Submit (Create or Edit)
const announcementForm = document.getElementById("announcement-form");
if (announcementForm) {
    announcementForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const title = document.getElementById("announce-title").value.trim();
        const description = document.getElementById("announce-desc").value.trim();

        if (!title || !description) {
            showToast("All fields are required.", "danger");
            return;
        }

        showLoader();
        try {
            if (editingAnnouncementId) {
                // Update announcement
                const announceDocRef = doc(db, "announcements", editingAnnouncementId);
                await updateDoc(announceDocRef, {
                    title,
                    description
                });
                showToast("Announcement updated successfully!", "success");
                editingAnnouncementId = null;
                document.getElementById("btn-submit-announce").textContent = "Publish Announcement";
            } else {
                // Create announcement
                await addDoc(collection(db, "announcements"), {
                    title,
                    description,
                    createdAt: new Date()
                });
                showToast("Announcement published successfully!", "success");
            }

            announcementForm.reset();
            
            // Hide modal if using Bootstrap modal
            const modalEl = document.getElementById('announcementModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }

            await loadAnnouncementsCrud();
        } catch (error) {
            console.error("Announcement Error:", error);
            showToast("Failed to save announcement.", "danger");
        } finally {
            hideLoader();
        }
    });
}

// Modal close reset
const modalEl = document.getElementById('announcementModal');
if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', () => {
        editingAnnouncementId = null;
        document.getElementById("announcement-form").reset();
        document.getElementById("btn-submit-announce").textContent = "Publish Announcement";
        document.getElementById("announcementModalLabel").textContent = "Create New Announcement";
    });
}

// Load summary numbers/statistics
async function loadAdminStats() {
    try {
        const usersSnap = await getDocs(collection(db, "users"));
        let totalRegistrations = 0;
        let totalStudents = 0; // Approved students
        
        usersSnap.forEach(doc => {
            const u = doc.data();
            if (u.role === "student") {
                totalRegistrations++;
                if (u.status === "approved") {
                    totalStudents++;
                }
            }
        });

        const contactsSnap = await getDocs(collection(db, "contacts"));
        const totalMessages = contactsSnap.size;

        document.getElementById("stat-total-registrations").textContent = totalRegistrations;
        document.getElementById("stat-total-students").textContent = totalStudents;
        document.getElementById("stat-total-messages").textContent = totalMessages;
        document.getElementById("stat-active-users").textContent = usersSnap.size; // Total signed up accounts
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// Load and render students table list
async function loadStudentsTable() {
    const tableBody = document.getElementById("student-table-body");
    if (!tableBody) return;

    try {
        const q = query(collection(db, "users"), where("role", "==", "student"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allStudents = [];
        querySnapshot.forEach(docSnap => {
            allStudents.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderStudentsTable(allStudents);
    } catch (error) {
        console.error("Error loading students table:", error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error loading data. Make sure index rules are set if needed.</td></tr>`;
    }
}

// Render student array to HTML table
function renderStudentsTable(students) {
    const tableBody = document.getElementById("student-table-body");
    if (!tableBody) return;

    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No students found.</td></tr>`;
        return;
    }

    let html = "";
    students.forEach((student, index) => {
        const date = student.createdAt ? new Date(student.createdAt.seconds * 1000).toLocaleDateString() : "N/A";
        
        let statusBadge = "";
        if (student.status === "pending") statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
        else if (student.status === "approved") statusBadge = `<span class="badge bg-success">Approved</span>`;
        else if (student.status === "rejected") statusBadge = `<span class="badge bg-danger">Rejected</span>`;

        html += `
            <tr class="align-middle">
                <td>${index + 1}</td>
                <td>
                    <div class="fw-bold">${student.fullName}</div>
                    <div class="text-muted small">${student.email}</div>
                </td>
                <td>${student.phone}</td>
                <td>
                    <div class="small fw-semibold">${student.college}</div>
                    <div class="text-muted small" style="font-size: 0.75rem;">${student.department} (${student.year})</div>
                </td>
                <td>${date}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-success btn-approve" data-id="${student.id}" title="Approve" ${student.status === 'approved' ? 'disabled' : ''}>
                            <i class="bi bi-check-lg"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning btn-reject" data-id="${student.id}" title="Reject" ${student.status === 'rejected' ? 'disabled' : ''}>
                            <i class="bi bi-x-lg"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info btn-view-details" data-id="${student.id}" title="View Purpose Statement" data-bs-toggle="modal" data-bs-target="#viewStudentModal">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-delete-student" data-id="${student.id}" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    // Attach event listeners to action buttons
    document.querySelectorAll(".btn-approve").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            await updateStudentStatus(id, "approved");
        });
    });

    document.querySelectorAll(".btn-reject").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            await updateStudentStatus(id, "rejected");
        });
    });

    document.querySelectorAll(".btn-view-details").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const student = allStudents.find(s => s.id === id);
            if (student) {
                document.getElementById("modal-student-name").textContent = student.fullName;
                document.getElementById("modal-student-college").textContent = student.college;
                document.getElementById("modal-student-reason").textContent = student.reason || "No statement provided.";
            }
        });
    });

    document.querySelectorAll(".btn-delete-student").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (confirm("Are you sure you want to delete this student registration? This action is permanent.")) {
                await deleteStudent(id);
            }
        });
    });
}

// Handle Student status update
async function updateStudentStatus(uid, newStatus) {
    showLoader();
    try {
        const studentDocRef = doc(db, "users", uid);
        await updateDoc(studentDocRef, {
            status: newStatus
        });
        showToast(`Student registration ${newStatus}!`, "success");
        await loadAdminStats();
        await loadStudentsTable();
    } catch (error) {
        console.error("Error updating status:", error);
        showToast("Failed to update status.", "danger");
    } finally {
        hideLoader();
    }
}

// Delete student registration
async function deleteStudent(uid) {
    showLoader();
    try {
        await deleteDoc(doc(db, "users", uid));
        showToast("Student registration deleted.", "success");
        await loadAdminStats();
        await loadStudentsTable();
    } catch (error) {
        console.error("Error deleting student:", error);
        showToast("Failed to delete student registration.", "danger");
    } finally {
        hideLoader();
    }
}

// Filter students client-side
function filterStudentsTable() {
    const searchQuery = document.getElementById("student-search").value.toLowerCase();
    const statusVal = document.getElementById("student-status-filter").value;

    const filtered = allStudents.filter(student => {
        const matchesSearch = 
            student.fullName.toLowerCase().includes(searchQuery) ||
            student.email.toLowerCase().includes(searchQuery) ||
            student.phone.toLowerCase().includes(searchQuery) ||
            student.college.toLowerCase().includes(searchQuery);
        
        const matchesStatus = (statusVal === "all") || (student.status === statusVal);

        return matchesSearch && matchesStatus;
    });

    renderStudentsTable(filtered);
}

// Load contact message inquiries list
async function loadContactsList() {
    const listBody = document.getElementById("contacts-list-body");
    if (!listBody) return;

    try {
        const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allMessages = [];
        querySnapshot.forEach(docSnap => {
            allMessages.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderContactsList(allMessages);
    } catch (error) {
        console.error("Error loading contacts:", error);
        listBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error loading messages.</td></tr>`;
    }
}

// Render contacts to UI table
function renderContactsList(messages) {
    const listBody = document.getElementById("contacts-list-body");
    if (!listBody) return;

    if (messages.length === 0) {
        listBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No messages received yet.</td></tr>`;
        return;
    }

    let html = "";
    messages.forEach((msg, index) => {
        const date = msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleString() : "N/A";
        html += `
            <tr class="align-middle">
                <td>${index + 1}</td>
                <td>
                    <div class="fw-bold">${msg.name}</div>
                    <div class="text-muted small">${msg.email}</div>
                    <div class="text-muted small">${msg.phone || 'No Phone'}</div>
                </td>
                <td><p class="mb-0 text-wrap-custom" style="max-width: 350px; white-space: pre-wrap; font-size: 0.85rem;">${msg.message}</p></td>
                <td><span class="small text-muted">${date}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger btn-delete-msg" data-id="${msg.id}" title="Delete Message">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    listBody.innerHTML = html;

    // Attach deletion handlers
    document.querySelectorAll(".btn-delete-msg").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (confirm("Are you sure you want to delete this inquiry message?")) {
                await deleteContactMessage(id);
            }
        });
    });
}

// Delete inquiry message
async function deleteContactMessage(id) {
    showLoader();
    try {
        await deleteDoc(doc(db, "contacts", id));
        showToast("Inquiry message deleted.", "success");
        await loadAdminStats();
        await loadContactsList();
    } catch (error) {
        console.error("Error deleting contact message:", error);
        showToast("Failed to delete message.", "danger");
    } finally {
        hideLoader();
    }
}

// Load and handle CRUD list for announcements
async function loadAnnouncementsCrud() {
    const listEl = document.getElementById("announcement-admin-list");
    if (!listEl) return;

    try {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allAnnouncements = [];
        querySnapshot.forEach(docSnap => {
            allAnnouncements.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderAnnouncementsCrud(allAnnouncements);
    } catch (error) {
        console.error("Error loading admin announcements:", error);
        listEl.innerHTML = `<p class="text-danger small">Error loading announcements.</p>`;
    }
}

// Render announcements in list with edit/delete buttons
function renderAnnouncementsCrud(announcements) {
    const listEl = document.getElementById("announcement-admin-list");
    if (!listEl) return;

    if (announcements.length === 0) {
        listEl.innerHTML = `
            <div class="text-center py-4 text-muted">
                <p class="mb-0">No announcements posted. Use the 'Create Announcement' button to add one.</p>
            </div>
        `;
        return;
    }

    let html = "";
    announcements.forEach((announce) => {
        const date = announce.createdAt ? new Date(announce.createdAt.seconds * 1000).toLocaleDateString() : "N/A";
        html += `
            <div class="mb-3 p-3 border rounded bg-white">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 class="mb-0 fw-bold text-gradient">${announce.title}</h6>
                        <span class="text-muted small" style="font-size: 0.75rem;"><i class="bi bi-calendar-event me-1"></i> Posted on ${date}</span>
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary btn-edit-announce" data-id="${announce.id}" data-bs-toggle="modal" data-bs-target="#announcementModal" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-delete-announce" data-id="${announce.id}" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-muted mb-0 small" style="white-space: pre-wrap;">${announce.description}</p>
            </div>
        `;
    });

    listEl.innerHTML = html;

    // Attach edit and delete handlers
    document.querySelectorAll(".btn-edit-announce").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const announce = allAnnouncements.find(a => a.id === id);
            if (announce) {
                editingAnnouncementId = id;
                document.getElementById("announce-title").value = announce.title;
                document.getElementById("announce-desc").value = announce.description;
                document.getElementById("btn-submit-announce").textContent = "Update Announcement";
                document.getElementById("announcementModalLabel").textContent = "Edit Announcement";
            }
        });
    });

    document.querySelectorAll(".btn-delete-announce").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            if (confirm("Are you sure you want to delete this announcement?")) {
                await deleteAnnouncement(id);
            }
        });
    });
}

// Delete announcement
async function deleteAnnouncement(id) {
    showLoader();
    try {
        await deleteDoc(doc(db, "announcements", id));
        showToast("Announcement deleted successfully.", "success");
        await loadAnnouncementsCrud();
    } catch (error) {
        console.error("Error deleting announcement:", error);
        showToast("Failed to delete announcement.", "danger");
    } finally {
        hideLoader();
    }
}
