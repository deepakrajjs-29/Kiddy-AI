// Student Dashboard Logic
import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, setDoc, collection, query, orderBy, getDocs } from "./firebase-config.js";
import { protectRoute, showToast, showLoader, hideLoader, watchAuthState, clerkLoadedPromise } from "./auth.js";
import { isClerkDemoConfig } from "./clerk-config.js";

// Initialize protection
protectRoute("student");

// Load profile and announcements on auth state confirmed
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

        await loadStudentData(user.uid);
    } catch (error) {
        console.error("Dashboard loading error:", error);
        showToast("Failed to load dashboard data.", "danger");
    } finally {
        hideLoader();
    }
});

// Handle Profile Form Update (Edit modal)
const editProfileForm = document.getElementById("edit-profile-form");
if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const clerk = await clerkLoadedPromise;
        if (!clerk.user) return;

        const currentUid = clerk.user.id;

        const fullName = document.getElementById("edit-fullName").value.trim();
        const phone = document.getElementById("edit-phone").value.trim();
        const college = document.getElementById("edit-college").value.trim();
        const department = document.getElementById("edit-department").value.trim();
        const year = document.getElementById("edit-year").value;
        const city = document.getElementById("edit-city").value.trim();
        const state = document.getElementById("edit-state").value.trim();

        if (!fullName || !phone || !college || !department || !year || !city || !state) {
            showToast("All fields are required.", "danger");
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            showToast("Please enter a valid 10-digit mobile number.", "danger");
            return;
        }

        showLoader();
        try {
            const userDocRef = doc(db, "users", currentUid);
            await updateDoc(userDocRef, {
                fullName,
                phone,
                college,
                department,
                year,
                city,
                state
            });
            
            showToast("Profile updated successfully!", "success");
            // Reload dashboard UI
            await loadStudentData(currentUid);
            
            // Close Modal (Bootstrap way)
            const modalEl = document.getElementById('editProfileModal');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            showToast("Error updating profile. Please try again.", "danger");
        } finally {
            hideLoader();
        }
    });
}

// Handle First-Time Onboarding Form Submit
const onboardingForm = document.getElementById("onboarding-form");
if (onboardingForm) {
    onboardingForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const clerk = await clerkLoadedPromise;
        if (!clerk.user) {
            showToast("Authentication required.", "danger");
            return;
        }

        const currentUid = clerk.user.id;

        const fullName = document.getElementById("onboard-fullName").value.trim();
        const phone = document.getElementById("onboard-phone").value.trim();
        const dob = document.getElementById("onboard-dob").value;
        const gender = document.getElementById("onboard-gender").value;
        const college = document.getElementById("onboard-college").value.trim();
        const department = document.getElementById("onboard-department").value.trim();
        const year = document.getElementById("onboard-year").value;
        const city = document.getElementById("onboard-city").value.trim();
        const state = document.getElementById("onboard-state").value.trim();
        const reason = document.getElementById("onboard-reason").value.trim();

        if (!fullName || !phone || !dob || !gender || !college || !department || !year || !city || !state || !reason) {
            showToast("Please fill in all fields.", "danger");
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            showToast("Please enter a valid 10-digit mobile number.", "danger");
            return;
        }

        showLoader();
        try {
            const email = clerk.user.primaryEmailAddress.emailAddress;
            const role = email.toLowerCase() === "admin@kiddyai.in" ? "admin" : "student";
            const status = role === "admin" ? "approved" : "pending";

            const userDocRef = doc(db, "users", currentUid);
            await setDoc(userDocRef, {
                uid: currentUid,
                fullName,
                email,
                phone,
                dob,
                gender,
                college,
                department,
                year,
                city,
                state,
                reason,
                role,
                status,
                createdAt: new Date()
            });

            showToast("Profile registration completed successfully!", "success");
            
            // Refresh dashboard UI
            await loadStudentData(currentUid);
        } catch (error) {
            console.error("Error submitting onboarding form:", error);
            showToast("Failed to submit onboarding profile.", "danger");
        } finally {
            hideLoader();
        }
    });
}

// Load student profile details
async function loadStudentData(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        // Toggle view containers
        document.getElementById("onboarding-container").style.display = "none";
        document.getElementById("main-dashboard-content").style.display = "block";

        const data = docSnap.data();

        // 1. Update Profile Card UI
        document.getElementById("user-name").textContent = data.fullName;
        document.getElementById("user-email").textContent = data.email;
        document.getElementById("user-phone").textContent = data.phone;
        document.getElementById("user-college").textContent = data.college;
        document.getElementById("user-dept-year").textContent = `${data.department} (${data.year})`;
        document.getElementById("user-location").textContent = `${data.city}, ${data.state}`;

        // Welcome back greeting
        const greetingName = document.getElementById("greeting-name");
        if (greetingName) {
            greetingName.textContent = data.fullName.split(" ")[0];
        }

        // 2. Update Registration Details UI
        document.getElementById("reg-id").textContent = data.uid.substring(0, 10).toUpperCase();
        document.getElementById("reg-date").textContent = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "N/A";
        
        // Status Badge Styling
        const statusEl = document.getElementById("reg-status");
        statusEl.className = "badge-status";
        
        if (data.status === "pending") {
            statusEl.classList.add("badge-pending");
            statusEl.textContent = "Pending Approval";
        } else if (data.status === "approved") {
            statusEl.classList.add("badge-approved");
            statusEl.textContent = "Approved";
        } else if (data.status === "rejected") {
            statusEl.classList.add("badge-rejected");
            statusEl.textContent = "Rejected";
        }

        // 3. Pre-fill Edit Profile inputs
        document.getElementById("edit-fullName").value = data.fullName;
        document.getElementById("edit-phone").value = data.phone;
        document.getElementById("edit-college").value = data.college;
        document.getElementById("edit-department").value = data.department;
        document.getElementById("edit-year").value = data.year;
        document.getElementById("edit-city").value = data.city;
        document.getElementById("edit-state").value = data.state;

        // Load other student data sections
        await loadAnnouncements();
        await loadUpcomingSessions();
    } else {
        // Toggle view containers for Onboarding flow
        document.getElementById("main-dashboard-content").style.display = "none";
        document.getElementById("onboarding-container").style.display = "block";

        // Pre-populate onboarding fields with Clerk account data
        const clerk = await clerkLoadedPromise;
        if (clerk && clerk.user) {
            document.getElementById("onboard-fullName").value = clerk.user.fullName || "";
        }
    }
}

// Load announcements from Firestore
async function loadAnnouncements() {
    const listEl = document.getElementById("announcements-list");
    if (!listEl) return;

    try {
        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            listEl.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted mb-0">No announcements posted yet.</p>
                </div>
            `;
            return;
        }

        let html = "";
        querySnapshot.forEach((doc) => {
            const announcement = doc.data();
            const date = announcement.createdAt ? new Date(announcement.createdAt.seconds * 1000).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) : "Recently";
            
            html += `
                <div class="mb-3 p-3 border-bottom">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="mb-0 fw-bold">${announcement.title}</h6>
                        <span class="text-muted small">${date}</span>
                    </div>
                    <p class="text-muted small mb-0">${announcement.description}</p>
                </div>
            `;
        });
        listEl.innerHTML = html;
    } catch (error) {
        console.error("Error loading announcements:", error);
        listEl.innerHTML = `<p class="text-danger small">Error loading announcements.</p>`;
    }
}

// Mock/Static upcoming sessions
async function loadUpcomingSessions() {
    const sessionsList = document.getElementById("upcoming-sessions-list");
    if (!sessionsList) return;

    const sessions = [
        { title: "Introduction to Kiddy.ai Platform", time: "Tomorrow at 4:00 PM IST", type: "Live Orientation" },
        { title: "Fundamentals of AI & Prompts", time: "June 15, 2026 at 5:00 PM IST", type: "Lecture 1" },
        { title: "Building Your First Chatbot", time: "June 20, 2026 at 3:00 PM IST", type: "Workshop 1" }
    ];

    let html = "";
    sessions.forEach(session => {
        html += `
            <div class="mb-3 p-3 border rounded-3 bg-light d-flex align-items-start gap-3">
                <div class="icon-box icon-primary m-0 flex-shrink-0" style="width: 45px; height: 45px; font-size: 1.1rem;">
                    <i class="bi bi-camera-video-fill"></i>
                </div>
                <div>
                    <h6 class="mb-1 fw-bold small">${session.title}</h6>
                    <p class="text-muted small mb-1"><i class="bi bi-clock me-1"></i> ${session.time}</p>
                    <span class="badge bg-secondary text-white small" style="font-size: 0.7rem;">${session.type}</span>
                </div>
            </div>
        `;
    });
    sessionsList.innerHTML = html;
}
