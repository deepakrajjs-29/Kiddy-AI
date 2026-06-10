// Authentication and Global Utilities (Clerk-Supabase Unified SDK)
import { db, isDemoConfig, supabaseConfig } from "./db-config.js";
import { doc, getDoc, setDoc } from "./db-config.js";
import { clerkPublishableKey, isClerkDemoConfig, loadClerkSDK } from "./clerk-config.js";

// --- Loader Utilities ---
export function showLoader() {
    const loader = document.getElementById("global-loader");
    if (loader) {
        loader.classList.remove("hidden");
    }
}

export function hideLoader() {
    const loader = document.getElementById("global-loader");
    if (loader) {
        loader.classList.add("hidden");
    }
}

// --- Toast Notification Utilities ---
export function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container-custom");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container-custom";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-custom ${type}`;
    
    let icon = "info-circle-fill";
    if (type === "success") icon = "check-circle-fill";
    if (type === "danger") icon = "exclamation-triangle-fill";
    if (type === "warning") icon = "exclamation-circle-fill";

    toast.innerHTML = `
        <i class="bi bi-${icon}" style="font-size: 1.25rem;"></i>
        <div style="flex-grow: 1;">${message}</div>
        <button type="button" class="btn-close" style="font-size: 0.75rem;" aria-label="Close"></button>
    `;

    toast.querySelector(".btn-close").addEventListener("click", () => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// --- Configuration Setup Modal ---
export function checkConfigStatus() {
    // Banner disabled by request
}

// Check status on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
        const icons = document.createElement("link");
        icons.rel = "stylesheet";
        icons.href = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
        document.head.appendChild(icons);
    }
    checkConfigStatus();
});

// --- Clerk Auth Initialization ---
export let clerk = null;
let resolveClerkLoaded;
export const clerkLoadedPromise = new Promise((resolve) => {
    resolveClerkLoaded = resolve;
});

async function initClerkAuth() {
    try {
        clerk = await loadClerkSDK();
        await clerk.load();
        resolveClerkLoaded(clerk);
    } catch (err) {
        console.error("Clerk Initialization error:", err);
    }
}

// Run initializer
initClerkAuth();

// --- Auth Operations ---

// User Login function (Backward compatibility / wrapper)
export async function loginUser(email, password, rememberMe = false) {
    showLoader();
    const clerk = await clerkLoadedPromise;
    if (isClerkDemoConfig) {
        // Direct trigger mock login
        const mockUser = {
            id: "user_" + Math.random().toString(36).substr(2, 9),
            fullName: "Rahul Sharma",
            firstName: "Rahul",
            lastName: "Sharma",
            primaryEmailAddress: { emailAddress: email },
            imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
        };
        if (email.toLowerCase() === "admin@kiddyai.in") {
            mockUser.fullName = "Admin User";
            mockUser.firstName = "Admin";
            mockUser.lastName = "User";
        }
        localStorage.setItem("KIDDYAI_MOCK_USER", JSON.stringify(mockUser));
        clerk.user = mockUser;
        clerk.listeners.forEach(cb => cb({ user: mockUser }));
        hideLoader();
        return { user: mockUser, data: { role: email.toLowerCase() === "admin@kiddyai.in" ? "admin" : "student", status: "approved" } };
    } else {
        clerk.openSignIn();
        hideLoader();
        throw new Error("Redirecting to Clerk Sign In");
    }
}

// User Logout function
export async function logoutUser() {
    showLoader();
    try {
        const clerk = await clerkLoadedPromise;
        await clerk.signOut();
        hideLoader();
        showToast("Logged out successfully.", "success");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);
    } catch (error) {
        hideLoader();
        showToast(error.message, "danger");
    }
}

// Password Reset function
export async function resetPassword(email) {
    const clerk = await clerkLoadedPromise;
    if (isClerkDemoConfig) {
        showToast("Password reset link sent (Demo Mode).", "success");
    } else {
        showToast("Password reset can be performed directly through the Clerk profile portal.", "info");
    }
}

// Route Guard / Observer
export function watchAuthState(callback) {
    clerkLoadedPromise.then((clerk) => {
        clerk.addListener((state) => {
            if (state.user) {
                callback({
                    uid: state.user.id,
                    email: state.user.primaryEmailAddress.emailAddress,
                    displayName: state.user.fullName
                });
            } else {
                callback(null);
            }
        });
    });
}

// Protect pages based on auth role
export async function protectRoute(requiredRole = "student") {
    showLoader();
    const clerk = await clerkLoadedPromise;
    
    if (!clerk.user) {
        hideLoader();
        window.location.href = "login.html";
        return;
    }

    try {
        const currentUid = clerk.user.id;
        const userDocRef = doc(db, "users", currentUid);
        const userDoc = await getDoc(userDocRef);
        
        const email = clerk.user.primaryEmailAddress.emailAddress;
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Admin role guard
            if (requiredRole === "admin" && userData.role !== "admin") {
                hideLoader();
                showToast("Access Denied: Admin privileges required.", "danger");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 2000);
                return;
            }
            
            // Student role guard (prevents going to student dashboard if admin)
            if (requiredRole === "student" && userData.role === "admin") {
                hideLoader();
                window.location.href = "admin.html";
                return;
            }
        } else {
            // If they are admin, auto-create the record in Supabase users table
            if (email.toLowerCase() === "admin@kiddyai.in") {
                await setDoc(doc(db, "users", currentUid), {
                    uid: currentUid,
                    fullName: clerk.user.fullName || "Admin User",
                    email: email,
                    role: "admin",
                    status: "approved",
                    createdAt: new Date()
                });
                hideLoader();
                if (requiredRole === "student") {
                    window.location.href = "admin.html";
                }
                return;
            }
            
            // Student with NO registration profile details -> Redirect to complete onboarding on dashboard.html
            const onDashboard = window.location.pathname.includes("dashboard");
            if (!onDashboard) {
                hideLoader();
                window.location.href = "dashboard.html";
                return;
            }
        }
        hideLoader();
    } catch (error) {
        console.error("Error verifying user role:", error);
        hideLoader();
    }
}
