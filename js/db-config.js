// Database Router Configuration (Supabase + Local Mock fallback)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const defaultSupabaseConfig = {
    supabaseUrl: "https://dummy-project.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummyKey"
};

// Check if user has stored custom Supabase configuration in localStorage
const storedConfig = localStorage.getItem("KIDDYAI_SUPABASE_CONFIG");
const supabaseConfig = storedConfig ? JSON.parse(storedConfig) : defaultSupabaseConfig;

let supabase;
let isDemoConfig = true;

try {
    if (supabaseConfig.supabaseUrl && supabaseConfig.supabaseUrl !== defaultSupabaseConfig.supabaseUrl) {
        supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabaseKey);
        isDemoConfig = false;
    }
} catch (error) {
    console.error("Supabase initialization failed:", error);
}

// --- LocalStorage Mock Tables for Demo/Mock Mode ---
const getMockTable = (name) => {
    const data = localStorage.getItem(`KIDDYAI_MOCK_DB_${name}`);
    return data ? JSON.parse(data) : {};
};
const saveMockTable = (name, table) => {
    localStorage.setItem(`KIDDYAI_MOCK_DB_${name}`, JSON.stringify(table));
};

// Initialize default mock data if empty
if (isDemoConfig) {
    if (!localStorage.getItem("KIDDYAI_MOCK_DB_announcements")) {
        const defaultAnnouncements = {
            "ann1": { id: "ann1", title: "🎉 Bootcamp Orientation Schedule", description: "The orientation will start on June 15th at 4:00 PM IST. Get ready to build your first AI model!", createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 } },
            "ann2": { id: "ann2", title: "💬 Join the Discord Channel", description: "Make sure you join the Kiddy.ai discord server using the link sent in your email to connect with mentors and peers.", createdAt: { seconds: Math.floor(Date.now() / 1000) - 172800 } }
        };
        saveMockTable("announcements", defaultAnnouncements);
    }

    if (!localStorage.getItem("KIDDYAI_MOCK_DB_users")) {
        const defaultUsers = {
            "user_admin": { uid: "user_admin", fullName: "Admin User", email: "admin@kiddyai.in", phone: "9876543210", dob: "1990-01-01", gender: "Male", college: "Kiddy AI Institution", department: "Administration", year: "Other", city: "Bangalore", state: "Karnataka", reason: "Founder", role: "admin", status: "approved", createdAt: { seconds: Math.floor(Date.now() / 1000) - 1000000 } }
        };
        saveMockTable("users", defaultUsers);
    }
}

// Helper: SnakeCase and CamelCase translation
function toSnakeCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const newObj = {};
    for (const key in obj) {
        let newKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        if (newKey === 'uid') newKey = 'id';
        let val = obj[key];
        if (val instanceof Date) {
            val = val.toISOString();
        } else if (val && typeof val === 'object' && val.seconds !== undefined) {
            val = new Date(val.seconds * 1000).toISOString();
        }
        newObj[newKey] = val;
    }
    return newObj;
}

function toCamelCase(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const newObj = {};
    for (const key in obj) {
        let newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (newKey === 'id') {
            newObj['uid'] = obj[key];
        }
        let val = obj[key];
        if (key === 'created_at' && val) {
            const date = new Date(val);
            newObj['createdAt'] = { seconds: Math.floor(date.getTime() / 1000) };
        } else {
            newObj[newKey] = val;
        }
    }
    return newObj;
}

// --- Supabase DB Driver (Firestore-compatible API interface) ---

export const db = {}; // Dummy db object reference to match legacy signatures

export function doc(databaseRef, collectionName, id) {
    return { table: collectionName, id };
}

export function collection(databaseRef, collectionName) {
    return { table: collectionName, constraints: [] };
}

export function query(collectionRef, ...constraints) {
    const table = collectionRef.table;
    const activeConstraints = [...(collectionRef.constraints || []), ...constraints];
    return { table, constraints: activeConstraints };
}

export function orderBy(field, direction = "asc") {
    return { type: "orderBy", field, direction };
}

export function where(field, operator, value) {
    return { type: "where", field, operator, value };
}

export async function getDoc(docRef) {
    if (isDemoConfig) {
        const table = getMockTable(docRef.table);
        const data = table[docRef.id];
        return {
            exists: () => !!data,
            data: () => data,
            id: docRef.id
        };
    }

    try {
        const { data, error } = await supabase
            .from(docRef.table)
            .select("*")
            .eq("id", docRef.id)
            .maybeSingle();

        if (error) throw error;

        return {
            exists: () => !!data,
            data: () => toCamelCase(data),
            id: docRef.id
        };
    } catch (err) {
        console.error("Supabase getDoc error:", err);
        throw err;
    }
}

export async function setDoc(docRef, data) {
    if (isDemoConfig) {
        const table = getMockTable(docRef.table);
        const cleanedData = { ...data };
        if (cleanedData.createdAt instanceof Date) {
            cleanedData.createdAt = { seconds: Math.floor(cleanedData.createdAt.getTime() / 1000) };
        }
        table[docRef.id] = { id: docRef.id, ...cleanedData };
        saveMockTable(docRef.table, table);
        return Promise.resolve();
    }

    try {
        const supabaseData = toSnakeCase(data);
        const { error } = await supabase
            .from(docRef.table)
            .upsert({ id: docRef.id, ...supabaseData });

        if (error) throw error;
        return Promise.resolve();
    } catch (err) {
        console.error("Supabase setDoc error:", err);
        throw err;
    }
}

export async function updateDoc(docRef, data) {
    if (isDemoConfig) {
        const table = getMockTable(docRef.table);
        if (table[docRef.id]) {
            table[docRef.id] = { ...table[docRef.id], ...data };
            saveMockTable(docRef.table, table);
        }
        return Promise.resolve();
    }

    try {
        const supabaseData = toSnakeCase(data);
        const { error } = await supabase
            .from(docRef.table)
            .update(supabaseData)
            .eq("id", docRef.id);

        if (error) throw error;
        return Promise.resolve();
    } catch (err) {
        console.error("Supabase updateDoc error:", err);
        throw err;
    }
}

export async function addDoc(collectionRef, data) {
    if (isDemoConfig) {
        const id = "doc_" + Math.random().toString(36).substr(2, 9);
        const table = getMockTable(collectionRef.table);
        const cleanedData = { ...data };
        if (cleanedData.createdAt instanceof Date) {
            cleanedData.createdAt = { seconds: Math.floor(cleanedData.createdAt.getTime() / 1000) };
        }
        table[id] = { id, ...cleanedData };
        saveMockTable(collectionRef.table, table);
        return { id };
    }

    try {
        const supabaseData = toSnakeCase(data);
        const { data: insertedData, error } = await supabase
            .from(collectionRef.table)
            .insert(supabaseData)
            .select("id")
            .single();

        if (error) throw error;
        return { id: insertedData.id };
    } catch (err) {
        console.error("Supabase addDoc error:", err);
        throw err;
    }
}

export async function deleteDoc(docRef) {
    if (isDemoConfig) {
        const table = getMockTable(docRef.table);
        delete table[docRef.id];
        saveMockTable(docRef.table, table);
        return Promise.resolve();
    }

    try {
        const { error } = await supabase
            .from(docRef.table)
            .delete()
            .eq("id", docRef.id);

        if (error) throw error;
        return Promise.resolve();
    } catch (err) {
        console.error("Supabase deleteDoc error:", err);
        throw err;
    }
}

export async function getDocs(queryRef) {
    if (isDemoConfig) {
        const table = getMockTable(queryRef.table);
        let items = Object.values(table);

        // Apply where constraints on mock data
        if (queryRef.constraints && queryRef.constraints.length > 0) {
            queryRef.constraints.forEach(c => {
                if (c.type === "where") {
                    items = items.filter(item => {
                        const val = item[c.field];
                        if (c.operator === "==") return val === c.value;
                        return true;
                    });
                }
            });
        }
        
        // Simple sort for announcements if mock contains createdAt
        if (queryRef.table === "announcements") {
            items.sort((a, b) => {
                const secA = a.createdAt?.seconds || 0;
                const secB = b.createdAt?.seconds || 0;
                return secB - secA; // desc
            });
        }

        const docs = items.map(item => ({
            id: item.id,
            data: () => item
        }));

        return {
            empty: docs.length === 0,
            forEach: (callback) => {
                docs.forEach(doc => callback(doc));
            },
            docs: docs,
            size: docs.length
        };
    }

    try {
        let builder = supabase.from(queryRef.table).select("*");

        // Apply constraints dynamically
        if (queryRef.constraints && queryRef.constraints.length > 0) {
            queryRef.constraints.forEach(c => {
                if (c.type === "where") {
                    const dbField = c.field === "uid" ? "id" : c.field.replace(/([A-Z])/g, "_$1").toLowerCase();
                    if (c.operator === "==") {
                        builder = builder.eq(dbField, c.value);
                    }
                } else if (c.type === "orderBy") {
                    const dbField = c.field.replace(/([A-Z])/g, "_$1").toLowerCase();
                    builder = builder.order(dbField, { ascending: c.direction === "asc" });
                }
            });
        }

        const { data, error } = await builder;

        if (error) throw error;

        const docs = (data || []).map(item => {
            const mapped = toCamelCase(item);
            return {
                id: item.id,
                data: () => mapped
            };
        });

        return {
            empty: docs.length === 0,
            forEach: (callback) => {
                docs.forEach(doc => callback(doc));
            },
            docs: docs,
            size: docs.length
        };
    } catch (err) {
        console.error("Supabase getDocs error:", err);
        throw err;
    }
}

export { supabase, isDemoConfig, supabaseConfig };
