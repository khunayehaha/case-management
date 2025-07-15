// --- DOM Elements ---
const addCaseBtn = document.getElementById('addCaseBtn');
const caseModal = document.getElementById('caseModal');
const caseForm = document.getElementById('caseForm');
const modalTitle = document.getElementById('modalTitle');
const farmerNameInput = document.getElementById('farmerName');
const farmerAccountNoInput = document.getElementById('farmerAccountNo');
const cabinetNoInput = document.getElementById('cabinetNo');
const shelfNoInput = document.getElementById('shelfNo');
const sequenceNoInput = document.getElementById('sequenceNo');
const caseIdInput = document.getElementById('caseId');
const caseList = document.getElementById('caseList');
const noResultsMessage = document.getElementById('noResults');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');

const borrowReturnModal = document.getElementById('borrowReturnModal');
const borrowReturnModalTitle = document.getElementById('borrowReturnModalTitle');
const currentFarmerNameSpan = document.getElementById('currentFarmerName');
const currentFarmerAccountNoSpan = document.getElementById('currentFarmerAccountNo');
const currentCaseStatusSpan = document.getElementById('currentCaseStatus');
const borrowerNameInput = document.getElementById('borrowerName');
const borrowReturnCaseIdInput = document.getElementById('borrowReturnCaseId');
const confirmBorrowReturnBtn = document.getElementById('borrowReturnBtn');
const borrowReturnForm = document.getElementById('borrowReturnForm');

const adminPasswordModal = document.getElementById('adminPasswordModal');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminPasswordForm = document.getElementById('adminPasswordForm');

// --- Global Variables ---
const API_BASE_URL = '/.netlify/functions';

let currentAdminAction = null;
let currentAdminCaseId = null;
let currentAdminCaseData = null;

// --- Utility Functions ---
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Error Date';
    }
}

// --- Main Render Function ---
function renderCases(casesToDisplay) {
    caseList.innerHTML = '';
    if (!casesToDisplay || casesToDisplay.length === 0) {
        noResultsMessage.style.display = 'block';
        return;
    } else {
        noResultsMessage.style.display = 'none';
    }

    casesToDisplay.forEach(c => {
        const row = caseList.insertRow();
        row.dataset.caseId = c.id;

        row.insertCell().textContent = c.farmer_name || 'ไม่ระบุชื่อ';
        row.insertCell().textContent = c.farmer_account_no || 'ไม่ระบุเลขบัญชี';
        row.insertCell().textContent = c.cabinet_no ?? 'ไม่ระบุ';
        row.insertCell().textContent = c.shelf_no ?? 'ไม่ระบุ';
        row.insertCell().textContent = c.sequence_no ?? 'ไม่ระบุ';

        const statusCell = row.insertCell();
        const statusBadge = document.createElement('span');
        statusBadge.classList.add('status-badge');
        if (c.status === "In Room") {
            statusBadge.classList.add('in-room');
            statusBadge.textContent = 'อยู่ในห้องสำนวน';
        } else if (c.status === "Borrowed") {
            statusBadge.classList.add('borrowed');
            statusBadge.textContent = 'ถูกเบิกไป';
        } else {
            statusBadge.classList.add('unknown-status');
            statusBadge.textContent = 'ไม่ทราบสถานะ';
        }
        statusCell.appendChild(statusBadge);

        const borrowerDateCell = row.insertCell();
        borrowerDateCell.innerHTML = c.status === "Borrowed"
            ? `เบิกโดย: ${c.borrowed_by_user_name || 'ไม่ระบุ'}<br>เมื่อ: ${formatDate(c.borrowed_date)}`
            : c.status === "In Room" && c.returned_date
            ? `คืนแล้วโดย: ${c.borrowed_by_user_name || 'ไม่ระบุ'}<br>เมื่อ: ${formatDate(c.returned_date)}`
            : 'ไม่มีข้อมูลการเบิก/คืน';

        const actionsCell = row.insertCell();
        const actionDiv = document.createElement('div');
        actionDiv.classList.add('action-buttons');

        const editBtn = document.createElement('button');
        editBtn.textContent = 'แก้ไข';
        editBtn.classList.add('edit-btn');
        editBtn.onclick = () => openEditCaseModal(c.id);
        actionDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'ลบ';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = () => deleteCase(c.id);
        actionDiv.appendChild(deleteBtn);

        if (c.status === "In Room") {
            const borrowBtn = document.createElement('button');
            borrowBtn.textContent = 'เบิก';
            borrowBtn.classList.add('borrow-btn');
            borrowBtn.onclick = () => openBorrowReturnModal(c.id, 'borrow');
            actionDiv.appendChild(borrowBtn);
        } else if (c.status === "Borrowed") {
            const returnBtn = document.createElement('button');
            returnBtn.textContent = 'คืน';
            returnBtn.classList.add('return-btn');
            returnBtn.onclick = () => openBorrowReturnModal(c.id, 'return');
            actionDiv.appendChild(returnBtn);
        }
        actionsCell.appendChild(actionDiv);
    });
}

// --- Fetch Cases ---
async function fetchCases() {
    try {
        const response = await fetch(`${API_BASE_URL}/cases`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        renderCases(data);
        return data;
    } catch (error) {
        alert(`ไม่สามารถดึงข้อมูลแฟ้มคดีได้: ${error.message}`);
        renderCases([]);
        return [];
    }
}

async function openEditCaseModal(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/cases/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const caseToEdit = await response.json();

        modalTitle.textContent = 'แก้ไขข้อมูลแฟ้มคดี';
        farmerNameInput.value = caseToEdit.farmer_name || '';
        farmerAccountNoInput.value = caseToEdit.farmer_account_no || '';
        cabinetNoInput.value = caseToEdit.cabinet_no ?? '';
        shelfNoInput.value = caseToEdit.shelf_no ?? '';
        sequenceNoInput.value = caseToEdit.sequence_no ?? '';
        caseIdInput.value = caseToEdit.id;

        caseModal.classList.add('active');
    } catch (error) {
        alert(`ไม่สามารถโหลดข้อมูลเพื่อแก้ไขได้: ${error.message}`);
    }
}

// --- Save Case ---
async function saveCase(event) {
    event.preventDefault();

    const caseData = {
        farmer_name: farmerNameInput.value.trim(),
        farmer_account_no: farmerAccountNoInput.value.trim(),
        cabinet_no: parseInt(cabinetNoInput.value),
        shelf_no: parseInt(shelfNoInput.value),
        sequence_no: parseInt(sequenceNoInput.value)
    };
    const caseId = caseIdInput.value;

    if (!caseData.farmer_name || !caseData.farmer_account_no || isNaN(caseData.cabinet_no) || isNaN(caseData.shelf_no) || isNaN(caseData.sequence_no)) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    if (caseId) {
        currentAdminAction = 'edit_save';
        currentAdminCaseId = caseId;
        currentAdminCaseData = caseData;
        closeModal(caseModal);
        openAdminPasswordModal();
    } else {
        try {
            const response = await fetch(`${API_BASE_URL}/cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(caseData)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            alert('เพิ่มแฟ้มคดีเรียบร้อยแล้ว');
            fetchCases();
            closeModal(caseModal);
        } catch (error) {
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    }
}

async function deleteCase(id) {
    currentAdminAction = 'delete';
    currentAdminCaseId = id;
    openAdminPasswordModal();
}

async function performUpdateCase(caseId, caseData, adminPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword
            },
            body: JSON.stringify(caseData)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        alert('แก้ไขเรียบร้อยแล้ว');
        fetchCases();
        closeModal(caseModal);
        closeModal(adminPasswordModal);
    } catch (error) {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
}

async function performDeleteCase(caseId, adminPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/cases/${caseId}`, {
            method: 'DELETE',
            headers: { 'X-Admin-Password': adminPassword }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        alert('ลบเรียบร้อยแล้ว');
        fetchCases();
        closeModal(adminPasswordModal);
    } catch (error) {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
}

// --- Modal & Event Handlers ---
function closeModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('active');
        if (modalElement === adminPasswordModal) adminPasswordInput.value = '';
    }
}

function openAdminPasswordModal() {
    adminPasswordInput.value = '';
    adminPasswordModal.classList.add('active');
}

async function submitAdminPassword(event) {
    event.preventDefault();
    const adminPassword = adminPasswordInput.value.trim();
    if (!adminPassword) {
        alert('กรุณากรอกรหัสผ่าน');
        return;
    }
    if (currentAdminAction === 'edit_save') {
        performUpdateCase(currentAdminCaseId, currentAdminCaseData, adminPassword);
    } else if (currentAdminAction === 'delete') {
        performDeleteCase(currentAdminCaseId, adminPassword);
    }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    fetchCases();

    if (addCaseBtn) addCaseBtn.addEventListener('click', () => {
        modalTitle.textContent = 'เพิ่มแฟ้มคดีใหม่';
        caseForm.reset();
        caseIdInput.value = '';
        caseModal.classList.add('active');
    });

    if (caseForm) caseForm.addEventListener('submit', saveCase);
    if (adminPasswordForm) adminPasswordForm.addEventListener('submit', submitAdminPassword);
});
