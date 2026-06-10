// Registration Page Handler - Mounts Clerk Sign Up
import { clerkLoadedPromise } from "./auth.js";

const clerk = await clerkLoadedPromise;
const mountPoint = document.getElementById("clerk-signup-mount");
if (mountPoint) {
    clerk.mountSignUp(mountPoint, {
        afterSignUpUrl: "dashboard.html",
        signInUrl: "login.html"
    });
}
