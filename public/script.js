document.addEventListener("DOMContentLoaded", () => {
    const adminPasswordModal = document.getElementById('adminPasswordModal');
    const borrowReturnModal = document.getElementById('borrowReturnModal');
    const adminPasswordInput = document.getElementById('adminPassword');
    const borrowerNameInput = document.getElementById('borrowerName');
    const adminPasswordSubmit = document.getElementById('adminPasswordSubmit');
    const borrowReturnSubmit = document.getElementById('borrowReturnSubmit');

    let currentAction = null;
    let currentCaseId = null;

    fetchCases();

    function fetchCases() {
        fetch('/.netlify/functions/cases')
            .then(res => res.json())
            .then(data => renderCases(data))
            .catch(err => console.error('Fetch cases error:', err));
    }

    function renderCases(cases) {
        const tbody = document.querySelector("#caseTable tbody");
        tbody.innerHTML = '';
        cases.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id}</td>
                <td>${c.farmer_name}</td>
                <td>${c.farmer_account_no}</td>
                <td>${c.cabinet_no}</td>
                <td>${c.shelf_no}</td>
                <td>${c.sequence_no}</td>
                <td>${c.status}</td>
                <td>${c.borrowed_by_user_name || '-'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${c.id}">แก้ไข</button>
                    <button class="action-btn borrow-btn" data-id="${c.id}" ${c.status === 'Borrowed' ? 'disabled' : ''}>เบิก</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openAdminModal('edit', btn.dataset.id));
        });

        document.querySelectorAll('.borrow-btn').forEach(btn => {
            btn.addEventListener('click', () => openBorrowModal(btn.dataset.id));
        });
    }

    function openAdminModal(action, caseId) {
        currentAction = action;
        currentCaseId = caseId;
        adminPasswordInput.value = '';
        adminPasswordModal.classList.add('active');
    }

    function openBorrowModal(caseId) {
        currentCaseId = caseId;
        borrowerNameInput.value = '';
        borrowReturnModal.classList.add('active');
    }

    adminPasswordSubmit.addEventListener('click', () => {
        const password = adminPasswordInput.value.trim();
        if (!password) {
            alert('กรุณากรอกรหัสผ่าน');
            return;
        }

        fetch(`/.netlify/functions/cases/${currentCaseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': password
            },
            body: JSON.stringify({ last_updated_by_user_name: "Admin" })
        })
            .then(res => res.json())
            .then(() => {
                adminPasswordModal.classList.remove('active');
                fetchCases();
            })
            .catch(err => {
                console.error(err);
                alert('เกิดข้อผิดพลาด');
                adminPasswordModal.classList.remove('active');
            });
    });

    borrowReturnSubmit.addEventListener('click', () => {
        const borrowerName = borrowerNameInput.value.trim();
        if (!borrowerName) {
            alert('กรุณากรอกชื่อผู้เบิก');
            return;
        }

        fetch(`/.netlify/functions/cases/${currentCaseId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'borrow', borrower_name: borrowerName })
        })
            .then(res => res.json())
            .then(() => {
                borrowReturnModal.classList.remove('active');
                fetchCases();
            })
            .catch(err => {
                console.error(err);
                alert('เกิดข้อผิดพลาด');
                borrowReturnModal.classList.remove('active');
            });
    });

    // ✅ ปิด modal เมื่อกดปุ่มยกเลิก
    document.querySelectorAll('.modal .cancel-button').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // ✅ ปิด modal เมื่อกดปุ่มปิด (×)
    document.querySelectorAll('.modal .close-button').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
});
