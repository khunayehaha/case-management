import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔗 Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyD2Dr6eWDBn1NQkymaiBPWAtC7wHc0L2nQ",
    authDomain: "sugarlaw1.firebaseapp.com",
    projectId: "sugarlaw1",
    storageBucket: "sugarlaw1.appspot.com",
    messagingSenderId: "1044664723794",
    appId: "1:1044664723794:web:edfaa67d9452d2618bb28b",
    measurementId: "G-TBMSM6ZT8R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const addCaseBtn = document.getElementById("addCaseBtn");
    const caseModal = document.getElementById("caseModal");
    const borrowReturnModal = document.getElementById("borrowReturnModal");
    const adminPasswordModal = document.getElementById("adminPasswordModal");
    const caseForm = document.getElementById("caseForm");
    const borrowReturnForm = document.getElementById("borrowReturnForm");
    const adminPasswordForm = document.getElementById("adminPasswordForm");
    const caseList = document.getElementById("caseList");

    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const clearSearchBtn = document.getElementById("clearSearchBtn");

    let currentCaseId = null;
    let actionType = "";
    let pendingAction = "";

    const casesRef = collection(db, "cases");

    function renderCase(docSnap) {
        const c = docSnap.data();
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", docSnap.id);
        tr.innerHTML = `
            <td>${c.name}</td>
            <td>${c.account}</td>
            <td>${c.cabinet}</td>
            <td>${c.shelf}</td>
            <td>${c.sequence}</td>
            <td>
                <span class="status-badge ${c.status === "อยู่ในห้องสำนวน" ? "in-room" : "out-room"}">
                    ${c.status}
                </span>
            </td>
            <td>${c.user || "ไม่มีข้อมูล"}</td>
            <td>${c.date || ""}</td>
            <td class="action-buttons">
                <button class="btn-edit">แก้ไข</button>
                <button class="btn-delete">ลบ</button>
                <button class="btn-borrow">${c.status === "อยู่ในห้องสำนวน" ? "เบิก" : "คืน"}</button>
            </td>
        `;
        return tr;
    }

    onSnapshot(casesRef, snapshot => {
        caseList.innerHTML = "";
        snapshot.forEach(docSnap => {
            const tr = renderCase(docSnap);
            caseList.appendChild(tr);
        });
    });

    function openModal(modal) {
        modal.style.display = "block";
    }

    function closeModal(modal) {
        modal.style.display = "none";
    }

    document.querySelectorAll(".cancel-button, .close-button").forEach(btn => {
        btn.addEventListener("click", () => {
            closeModal(caseModal);
            closeModal(borrowReturnModal);
            closeModal(adminPasswordModal);
        });
    });

    addCaseBtn.addEventListener("click", () => {
        caseForm.reset();
        document.getElementById("caseId").value = "";
        openModal(caseModal);
    });

    caseForm.addEventListener("submit", async e => {
        e.preventDefault();
        const id = document.getElementById("caseId").value;
        const newCase = {
            name: document.getElementById("farmerName").value,
            account: document.getElementById("farmerAccountNo").value,
            cabinet: document.getElementById("cabinetNo").value,
            shelf: document.getElementById("shelfNo").value,
            sequence: document.getElementById("sequenceNo").value,
            status: "อยู่ในห้องสำนวน",
            user: "",
            date: ""
        };

        if (id) {
            await setDoc(doc(casesRef, id), newCase);
        } else {
            await addDoc(casesRef, newCase);
        }
        closeModal(caseModal);
    });

    caseList.addEventListener("click", async e => {
        const tr = e.target.closest("tr");
        const id = tr.getAttribute("data-id");
        const cSnap = await getDoc(doc(casesRef, id));
        const c = cSnap.data();

        if (e.target.classList.contains("btn-edit")) {
            currentCaseId = id;
            pendingAction = "edit";
            openModal(adminPasswordModal);
        }

        if (e.target.classList.contains("btn-delete")) {
            currentCaseId = id;
            pendingAction = "delete";
            openModal(adminPasswordModal);
        }

        if (e.target.classList.contains("btn-borrow")) {
            currentCaseId = id;
            actionType = c.status === "อยู่ในห้องสำนวน" ? "borrow" : "return";
            document.getElementById("borrowerName").value = "";

            document.getElementById("currentFarmerName").textContent = c.name;
            document.getElementById("currentFarmerAccountNo").textContent = c.account;
            document.getElementById("currentCaseStatus").textContent = c.status;
            document.getElementById("borrowReturnModalTitle").textContent =
                actionType === "borrow" ? "เบิกแฟ้มคดี" : "คืนแฟ้มคดี";

            openModal(borrowReturnModal);
        }
    });

    adminPasswordForm.addEventListener("submit", async e => {
        e.preventDefault();
        const password = document.getElementById("adminPasswordInput").value;
        if (password === "lawsugar6") {
            if (pendingAction === "edit") {
                const cSnap = await getDoc(doc(casesRef, currentCaseId));
                const c = cSnap.data();
                document.getElementById("caseId").value = currentCaseId;
                document.getElementById("farmerName").value = c.name;
                document.getElementById("farmerAccountNo").value = c.account;
                document.getElementById("cabinetNo").value = c.cabinet;
                document.getElementById("shelfNo").value = c.shelf;
                document.getElementById("sequenceNo").value = c.sequence;
                openModal(caseModal);
            } else if (pendingAction === "delete") {
                if (confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
                    await deleteDoc(doc(casesRef, currentCaseId));
                }
            }
            closeModal(adminPasswordModal);
        } else {
            alert("รหัสผ่านไม่ถูกต้อง");
        }
    });

    borrowReturnForm.addEventListener("submit", async e => {
        e.preventDefault();
        const user = document.getElementById("borrowerName").value.trim();
        const now = new Date();
        const dateTime = now.toLocaleDateString("th-TH", { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                         " " + now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });

        const cSnap = await getDoc(doc(casesRef, currentCaseId));
        const c = cSnap.data();

        if (!user) {
            alert("กรุณากรอกชื่อผู้เบิก/ผู้คืน");
            return;
        }

        if (actionType === "borrow") {
            c.status = "ถูกเบิกออกไป";
        } else {
            c.status = "อยู่ในห้องสำนวน";
        }
        c.user = user;
        c.date = dateTime;

        await setDoc(doc(casesRef, currentCaseId), c);
        closeModal(borrowReturnModal);
    });

    // 🔍 ฟังก์ชันค้นหา
    function filterCases(keyword) {
        const rows = caseList.querySelectorAll("tr");
        rows.forEach(row => {
            const nameCell = row.querySelector("td:first-child");
            if (nameCell) {
                const name = nameCell.textContent.trim();
                if (name.includes(keyword)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            }
        });
    }

    searchBtn.addEventListener("click", () => {
        const keyword = searchInput.value.trim();
        filterCases(keyword);
    });

    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        filterCases("");
    });

    // --- Import Farmers Modal Logic ---
    const importFarmersBtn = document.getElementById('importFarmersBtn');
    const importFarmersModal = document.getElementById('importFarmersModal');
    const importFarmersForm = document.getElementById('importFarmersForm');
    const importPasswordInput = document.getElementById('importPasswordInput');

    if (importFarmersBtn) {
        importFarmersBtn.addEventListener('click', () => {
            importPasswordInput.value = '';
            importFarmersModal.style.display = 'block';
        });
    }
    if (importFarmersModal) {
        importFarmersModal.querySelector('.close-button').addEventListener('click', () => {
            importFarmersModal.style.display = 'none';
        });
        importFarmersForm.querySelector('.cancel-button').addEventListener('click', () => {
            importFarmersModal.style.display = 'none';
        });
    }
    if (importFarmersForm) {
        importFarmersForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (importPasswordInput.value === 'lawsugar6') {
                await importFarmers();
                importFarmersModal.style.display = 'none';
            } else {
                alert('รหัสผ่านไม่ถูกต้อง');
            }
        });
    }

    // --- Import Farmers Function ---
    async function importFarmers() {
        const farmers = [
            // ... (array รายชื่อทั้งหมดที่ผู้ใช้ให้ไว้ใน import-farmers.js)
            { account: '218364', name: 'นายทรัพย์  บรรเทิงใจ', cabinet: '3', shelf: '1', sequence: '1' },
            { account: '233240', name: 'นางสุรีย์พร คันทะชัย', cabinet: '3', shelf: '1', sequence: '2' },
            // ... (ใส่รายชื่อทั้งหมดที่ผู้ใช้ให้ไว้ต่อจากนี้)
            // ... (รายชื่อที่เพิ่มใหม่ทั้งหมด)
        ];
        const casesRef = collection(db, "cases");
        let success = 0, fail = 0;
        for (const f of farmers) {
            try {
                await addDoc(casesRef, {
                    name: f.name,
                    account: f.account,
                    cabinet: f.cabinet,
                    shelf: f.shelf,
                    sequence: f.sequence,
                    status: "อยู่ในห้องสำนวน",
                    user: "",
                    date: ""
                });
                success++;
            } catch (e) {
                fail++;
                console.error("เพิ่มข้อมูลล้มเหลว:", f, e);
            }
        }
        alert(`เพิ่มข้อมูลสำเร็จ ${success} รายการ, ล้มเหลว ${fail} รายการ`);
    }
});
