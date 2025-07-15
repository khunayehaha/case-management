document.addEventListener("DOMContentLoaded", () => {
    const addCaseBtn = document.getElementById("addCaseBtn");
    const caseModal = document.getElementById("caseModal");
    const borrowReturnModal = document.getElementById("borrowReturnModal");
    const adminPasswordModal = document.getElementById("adminPasswordModal");
    const caseForm = document.getElementById("caseForm");
    const borrowReturnForm = document.getElementById("borrowReturnForm");
    const adminPasswordForm = document.getElementById("adminPasswordForm");
    const caseList = document.getElementById("caseList");

    let cases = JSON.parse(localStorage.getItem("cases")) || [];
    let currentCaseId = null;
    let actionType = ""; 
    let pendingAction = ""; 

    function saveCases() {
        localStorage.setItem("cases", JSON.stringify(cases));
        renderCases();
    }

    function renderCases() {
        caseList.innerHTML = "";
        cases.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.name}</td>
                <td>${c.account}</td>
                <td>${c.cabinet}</td>
                <td>${c.shelf}</td>
                <td>${c.sequence}</td>
                <td>
                    <span class="status-label ${c.status === "อยู่ในห้องสำนวน" ? "status-in" : "status-out"}">
                        ${c.status}
                    </span>
                </td>
                <td>${c.user || "ไม่มีข้อมูล"}</td>
                <td>${c.date || ""}</td>
                <td class="action-buttons">
                    <button class="btn-edit" data-id="${c.id}">แก้ไข</button>
                    <button class="btn-delete" data-id="${c.id}">ลบ</button>
                    <button class="btn-borrow" data-id="${c.id}">${c.status === "อยู่ในห้องสำนวน" ? "เบิก" : "คืน"}</button>
                </td>
            `;
            caseList.appendChild(tr);
        });
    }

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

    caseForm.addEventListener("submit", e => {
        e.preventDefault();
        const id = document.getElementById("caseId").value;
        const newCase = {
            id: id || Date.now(),
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
            cases = cases.map(c => c.id == id ? newCase : c);
        } else {
            cases.push(newCase);
        }
        saveCases();
        closeModal(caseModal);
    });

    caseList.addEventListener("click", e => {
        const id = e.target.dataset.id;
        const c = cases.find(c => c.id == id);

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

            // 🆕 ตั้งค่า modal เบิก/คืน
            document.getElementById("currentFarmerName").textContent = c.name;
            document.getElementById("currentFarmerAccountNo").textContent = c.account;
            document.getElementById("currentCaseStatus").textContent = c.status;
            document.getElementById("borrowReturnModalTitle").textContent =
                actionType === "borrow" ? "เบิกแฟ้มคดี" : "คืนแฟ้มคดี";

            openModal(borrowReturnModal);
        }
    });

    adminPasswordForm.addEventListener("submit", e => {
        e.preventDefault();
        const password = document.getElementById("adminPasswordInput").value;
        if (password === "lawsugar6") {
            if (pendingAction === "edit") {
                const c = cases.find(c => c.id == currentCaseId);
                document.getElementById("caseId").value = c.id;
                document.getElementById("farmerName").value = c.name;
                document.getElementById("farmerAccountNo").value = c.account;
                document.getElementById("cabinetNo").value = c.cabinet;
                document.getElementById("shelfNo").value = c.shelf;
                document.getElementById("sequenceNo").value = c.sequence;
                openModal(caseModal);
            } else if (pendingAction === "delete") {
                if (confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
                    cases = cases.filter(c => c.id != currentCaseId);
                    saveCases();
                }
            }
            closeModal(adminPasswordModal);
        } else {
            alert("รหัสผ่านไม่ถูกต้อง");
        }
    });

    borrowReturnForm.addEventListener("submit", e => {
        e.preventDefault();
        const user = document.getElementById("borrowerName").value.trim();
        const c = cases.find(c => c.id == currentCaseId);

        if (!user) {
            alert("กรุณากรอกชื่อผู้เบิก/ผู้คืน");
            return;
        }

        const now = new Date();
        const dateTime = now.toLocaleDateString("th-TH", { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                         " " + now.toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' });

        if (actionType === "borrow") {
            c.status = "ถูกเบิกออกไป";
            c.user = user;
            c.date = dateTime;
        } else {
            c.status = "อยู่ในห้องสำนวน";
            c.user = user;  // บันทึกชื่อผู้คืน
            c.date = dateTime;
        }

        saveCases();
        closeModal(borrowReturnModal);
    });

    renderCases();
});
