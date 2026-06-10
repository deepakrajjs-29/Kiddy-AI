// Contact Form Submission Handler
import { db, collection, addDoc } from "./firebase-config.js";
import { showToast, showLoader, hideLoader } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("contact-name").value.trim();
        const email = document.getElementById("contact-email").value.trim();
        const phone = document.getElementById("contact-phone").value.trim();
        const message = document.getElementById("contact-message").value.trim();

        // Validations
        if (!name || !email || !message) {
            showToast("Please fill in all required fields (Name, Email, and Message).", "danger");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast("Please enter a valid email address.", "danger");
            return;
        }

        if (phone) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phone)) {
                showToast("Please enter a valid 10-digit mobile number.", "danger");
                return;
            }
        }

        showLoader();

        try {
            // Add inquiry message document to Firestore "contacts" collection
            await addDoc(collection(db, "contacts"), {
                name,
                email,
                phone: phone || "Not Provided",
                message,
                createdAt: new Date()
            });

            hideLoader();
            showToast("Your inquiry message was sent successfully! We will contact you soon.", "success");
            contactForm.reset();
        } catch (error) {
            hideLoader();
            console.error("Contact Form Error:", error);
            showToast("Failed to send message. Please verify your connection.", "danger");
        }
    });
});
