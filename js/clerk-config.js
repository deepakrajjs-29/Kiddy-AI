// Clerk Configuration & Mock SDK
export const defaultClerkKey = "pk_test_Y2xlcmstZHVtbXkta2V5LTIzLmNsZXJrLmFjY291bnRzLmRldiQ";
export const clerkPublishableKey = localStorage.getItem("KIDDYAI_CLERK_PUBLISHABLE_KEY") || defaultClerkKey;
export const isClerkDemoConfig = clerkPublishableKey === defaultClerkKey;

// Mock Clerk SDK implementation for demo mode
class MockClerk {
    constructor() {
        this.loaded = true;
        this.user = null;
        this.listeners = [];
        
        // Load mock user from localStorage if it exists
        const storedUser = localStorage.getItem("KIDDYAI_MOCK_USER");
        if (storedUser) {
            this.user = JSON.parse(storedUser);
        }
    }

    async load() {
        return Promise.resolve();
    }

    addListener(callback) {
        this.listeners.push(callback);
        // Call it immediately with current state
        callback({ user: this.user });
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    async signOut() {
        localStorage.removeItem("KIDDYAI_MOCK_USER");
        this.user = null;
        this.listeners.forEach(cb => cb({ user: null }));
        window.location.href = "login.html";
        return Promise.resolve();
    }

    openSignIn() {
        window.location.href = "login.html";
    }

    openSignUp() {
        window.location.href = "register.html";
    }

    mountSignIn(el, options) {
        if (!el) return;
        el.innerHTML = `
            <div class="card border-0 shadow-lg rounded-4 overflow-hidden p-4 bg-white w-100">
                <div class="text-center mb-4">
                    <span class="badge bg-warning-subtle text-warning mb-2 px-3 py-1.5 fw-semibold"><i class="bi bi-shield-fill me-1"></i> Clerk Demo Mode</span>
                    <h4 class="fw-bold mb-1">Sign In</h4>
                    <p class="text-muted small">Sign in to your Kiddy.ai account.</p>
                </div>
                <form id="mock-signin-form">
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Email Address</label>
                        <input type="email" id="mock-signin-email" class="form-control form-control-custom" placeholder="student@example.com" required>
                        <div class="form-text text-muted small" style="font-size: 0.75rem;">Tip: Use <strong class="text-dark">admin@kiddyai.in</strong> to sign in as admin.</div>
                    </div>
                    <div class="mb-4">
                        <label class="form-label small fw-semibold">Password</label>
                        <input type="password" id="mock-signin-password" class="form-control form-control-custom" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary-custom w-100 py-3 mb-3">Sign In</button>
                    <div class="text-center">
                        <p class="text-muted small mb-0">New to Kiddy.ai? <a href="register.html" class="text-primary fw-bold text-decoration-none">Create an Account</a></p>
                    </div>
                </form>
            </div>
        `;

        el.querySelector("#mock-signin-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const email = el.querySelector("#mock-signin-email").value.trim();
            const name = email.split("@")[0];
            const fullName = name.charAt(0).toUpperCase() + name.slice(1) + " Student";
            const mockUser = {
                id: "user_" + Math.random().toString(36).substr(2, 9),
                fullName: fullName,
                firstName: name.charAt(0).toUpperCase() + name.slice(1),
                lastName: "Student",
                primaryEmailAddress: {
                    emailAddress: email
                },
                imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
            };
            if (email.toLowerCase() === "admin@kiddyai.in") {
                mockUser.fullName = "Admin User";
                mockUser.firstName = "Admin";
                mockUser.lastName = "User";
            }
            localStorage.setItem("KIDDYAI_MOCK_USER", JSON.stringify(mockUser));
            this.user = mockUser;
            this.listeners.forEach(cb => cb({ user: mockUser }));
            
            const nextUrl = (email.toLowerCase() === "admin@kiddyai.in") ? "admin.html" : "dashboard.html";
            window.location.href = nextUrl;
        });
    }

    mountSignUp(el, options) {
        if (!el) return;
        el.innerHTML = `
            <div class="card border-0 shadow-lg rounded-4 overflow-hidden p-4 bg-white w-100">
                <div class="text-center mb-4">
                    <span class="badge bg-warning-subtle text-warning mb-2 px-3 py-1.5 fw-semibold"><i class="bi bi-shield-fill me-1"></i> Clerk Demo Mode</span>
                    <h4 class="fw-bold mb-1">Sign Up</h4>
                    <p class="text-muted small">Create your account to register.</p>
                </div>
                <form id="mock-signup-form">
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Full Name</label>
                        <input type="text" id="mock-signup-name" class="form-control form-control-custom" placeholder="Rahul Sharma" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Email Address</label>
                        <input type="email" id="mock-signup-email" class="form-control form-control-custom" placeholder="rahul@example.com" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label small fw-semibold">Password</label>
                        <input type="password" id="mock-signup-password" class="form-control form-control-custom" placeholder="Minimum 6 characters" required>
                    </div>
                    <button type="submit" class="btn btn-primary-custom w-100 py-3 mb-3">Sign Up</button>
                    <div class="text-center">
                        <p class="text-muted small mb-0">Already have an account? <a href="login.html" class="text-primary fw-bold text-decoration-none">Login</a></p>
                    </div>
                </form>
            </div>
        `;

        el.querySelector("#mock-signup-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const fullName = el.querySelector("#mock-signup-name").value.trim();
            const email = el.querySelector("#mock-signup-email").value.trim();
            const parts = fullName.split(" ");
            const firstName = parts[0] || "Student";
            const lastName = parts.slice(1).join(" ") || "User";
            const mockUser = {
                id: "user_" + Math.random().toString(36).substr(2, 9),
                fullName: fullName,
                firstName: firstName,
                lastName: lastName,
                primaryEmailAddress: {
                    emailAddress: email
                },
                imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
            };
            if (email.toLowerCase() === "admin@kiddyai.in") {
                mockUser.fullName = "Admin User";
                mockUser.firstName = "Admin";
                mockUser.lastName = "User";
            }
            localStorage.setItem("KIDDYAI_MOCK_USER", JSON.stringify(mockUser));
            this.user = mockUser;
            this.listeners.forEach(cb => cb({ user: mockUser }));
            
            const nextUrl = (email.toLowerCase() === "admin@kiddyai.in") ? "admin.html" : "dashboard.html";
            window.location.href = nextUrl;
        });
    }

    mountUserButton(el, options) {
        if (!el) return;
        el.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-link p-0 border-0 dropdown-toggle d-flex align-items-center" type="button" id="mockUserBtnDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="outline: none; box-shadow: none;">
                    <img src="${this.user ? this.user.imageUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}" alt="Avatar" class="rounded-circle" style="width: 38px; height: 38px; border: 2px solid var(--primary); object-fit: cover;">
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-3" aria-labelledby="mockUserBtnDropdown" style="border-radius: 12px; width: 240px; margin-top: 8px;">
                    <li class="text-center py-2">
                        <img src="${this.user ? this.user.imageUrl : ''}" alt="Avatar" class="rounded-circle mb-2" style="width: 50px; height: 50px; object-fit: cover; border: 2px solid #E5E7EB;">
                        <h6 class="fw-bold mb-0 text-dark">${this.user ? this.user.fullName : 'Guest'}</h6>
                        <span class="text-muted small d-block mb-2" style="font-size: 0.75rem; word-break: break-all;">${this.user ? this.user.primaryEmailAddress.emailAddress : ''}</span>
                        <span class="badge bg-warning-subtle text-warning px-2.5 py-1" style="font-size: 0.65rem; border: 1px solid rgba(217, 119, 6, 0.2);"><i class="bi bi-shield-fill me-1"></i> Demo Session</span>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <button class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" id="mock-btn-signout" style="border-radius: 8px;">
                            <i class="bi bi-box-arrow-right"></i> Sign Out
                        </button>
                    </li>
                </ul>
            </div>
        `;
        const signoutBtn = el.querySelector("#mock-btn-signout");
        if (signoutBtn) {
            signoutBtn.addEventListener("click", () => this.signOut());
        }
    }
}

// Function to load the Clerk JS SDK from CDN dynamically
export async function loadClerkSDK() {
    if (isClerkDemoConfig) {
        return new MockClerk();
    }

    if (window.Clerk) {
        return window.Clerk;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js";
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => {
            if (window.Clerk) {
                resolve(window.Clerk);
            } else {
                reject(new Error("Clerk was not attached to window object."));
            }
        };
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
}
