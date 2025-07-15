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
    let actionType = ""; // "borrow" หรือ "return"

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
                <td>${c.status}</td>
                <td>${c.user || ""}</td>
                <td>${c.date || ""}</td>
                <td>
                    <button class="edit-btn" data-id="${c.id}">แก้ไข</button>
                    <button class="delete-btn" data-id="${c.id}">ลบ</button>
                    <button class="borrow-btn" data-id="${c.id}">${c.status === "อยู่ในห้องสำนวน" ? "เบิก" : "คืน"}</button>
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

        if (e.target.classList.contains("edit-btn")) {
            document.getElementById("caseId").value = c.id;
            document.getElementById("farmerName").value = c.name;
            document.getElementById("farmerAccountNo").value = c.account;
            document.getElementById("cabinetNo").value = c.cabinet;
            document.getElementById("shelfNo").value = c.shelf;
            document.getElementById("sequenceNo").value = c.sequence;
            openModal(caseModal);
        }

        if (e.target.classList.contains("delete-btn")) {
            if (confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) {
                cases = cases.filter(c => c.id != id);
                saveCases();
            }
        }

        if (e.target.classList.contains("borrow-btn")) {
            currentCaseId = id;
            actionType = c.status === "อยู่ในห้องสำนวน" ? "borrow" : "return";
            document.getElementById("borrowerName").value = "";
            openModal(borrowReturnModal);
        }
    });

    borrowReturnForm.addEventListener("submit", e => {
        e.preventDefault();
        const user = document.getElementById("borrowerName").value;
        const c = cases.find(c => c.id == currentCaseId);

        if (actionType === "borrow") {
            c.status = "ถูกเบิกออกไป";
            c.user = user;
            c.date = new Date().toLocaleDateString("th-TH");
        } else {
            c.status = "อยู่ในห้องสำนวน";
            c.user = "";
            c.date = "";
        }

        saveCases();
        closeModal(borrowReturnModal);
    });

    adminPasswordForm.addEventListener("submit", e => {
        e.preventDefault();
        const password = document.getElementById("adminPasswordInput").value;
        if (password === "lawsugar6") {
            closeModal(adminPasswordModal);
        } else {
            alert("รหัสผ่านไม่ถูกต้อง");
        }
    });

    renderCases();
});
