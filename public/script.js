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
    getDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔗 Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAvAjc_sB_9TjrTrZR4DPIcDQYzWm2QnW4",
    authDomain: "case-management-system99.firebaseapp.com",
    projectId: "case-management-system99",
    storageBucket: "case-management-system99.appspot.com",
    messagingSenderId: "799325568077",
    appId: "1:799325568077:web:3e6b3a8fb876df4817f004",
    measurementId: "G-MX12ND9DWT"
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
        // ใช้ setDoc โดยใช้ account เป็น document id เพื่อป้องกันข้อมูลซ้ำ (ถ้ามีอยู่แล้วจะ update ทับ)
        const farmers = [
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '1' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '2' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '3' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '4' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '5' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '6' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '7' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '8' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '9' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '10' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '11' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '12' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '13' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '14' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '15' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '16' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '17' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '18' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '19' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '20' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '21' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '22' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '23' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '24' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '25' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '26' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '27' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '28' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '29' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '30' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '31' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '32' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '33' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '34' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '35' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '36' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '37' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '38' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '39' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '40' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '41' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '42' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '43' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '44' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '45' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '46' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '47' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '48' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '49' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '50' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '51' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '52' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '53' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '54' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '55' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '56' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '57' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '58' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '59' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '60' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '61' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '62' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '63' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '64' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '65' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '66' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '67' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '68' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '69' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '70' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '71' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '72' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '73' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '74' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '75' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '76' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '77' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '78' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '79' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '80' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '81' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '82' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '83' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '84' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '85' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '86' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '87' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '88' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '89' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '90' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '91' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '92' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '93' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '94' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '95' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '96' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '97' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '98' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '99' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '100' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '101' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '102' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '103' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '104' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '105' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '106' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '107' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '108' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '109' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '110' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '111' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '112' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '113' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '114' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '115' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '116' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '117' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '118' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '119' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '120' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '121' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '122' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '123' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '124' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '125' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '126' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '127' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '128' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '129' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '130' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '131' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '132' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '133' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '134' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '135' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '136' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '137' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '138' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '139' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '140' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '141' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '142' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '143' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '144' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '145' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '146' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '147' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '148' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '149' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '150' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '151' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '152' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '153' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '154' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '155' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '156' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '157' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '158' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '159' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '160' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '161' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '162' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '163' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '164' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '165' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '166' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '167' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '168' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '169' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '170' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '171' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '172' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '173' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '174' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '175' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '176' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '177' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '178' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '179' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '180' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '181' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '182' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '183' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '184' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '185' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '186' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '187' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '188' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '189' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '190' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '191' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '192' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '193' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '194' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '195' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '196' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '197' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '198' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '199' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '200' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '201' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '202' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '203' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '204' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '205' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '206' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '207' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '208' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '209' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '210' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '211' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '212' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '213' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '214' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '215' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '216' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '217' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '218' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '219' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '220' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '221' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '222' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '223' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '224' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '225' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '226' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '227' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '228' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '229' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '230' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '231' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '232' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '233' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '234' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '235' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '236' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '237' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '238' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '239' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '240' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '241' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '242' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '243' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '244' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '245' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '246' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '247' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '248' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '249' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '250' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '251' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '252' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '253' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '254' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '255' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '256' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '257' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '258' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '259' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '260' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '261' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '262' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '263' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '264' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '265' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '266' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '267' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '268' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '269' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '270' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '271' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '272' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '273' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '274' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '275' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '276' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '277' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '278' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '279' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '280' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '281' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '282' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '283' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '284' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '285' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '286' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '287' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '288' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '289' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '290' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '291' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '292' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '293' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '294' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '295' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '296' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '297' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '298' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '299' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '300' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '301' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '302' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '303' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '304' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '305' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '306' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '307' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '308' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '309' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '310' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '311' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '312' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '313' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '314' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '315' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '316' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '317' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '318' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '319' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '320' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '321' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '322' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '323' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '324' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '325' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '326' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '327' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '328' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '329' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '330' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '331' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '332' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '333' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '334' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '335' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '336' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '337' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '338' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '339' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '340' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '341' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '342' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '343' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '344' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '345' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '346' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '347' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '348' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '349' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '350' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '351' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '352' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '353' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '354' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '355' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '356' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '357' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '358' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '359' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '360' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '361' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '362' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '363' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '364' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '365' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '366' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '367' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '368' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '369' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '370' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '371' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '372' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '373' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '374' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '375' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '376' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '377' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '378' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '379' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '380' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '381' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '382' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '383' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '384' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '385' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '386' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '387' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '388' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '389' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '390' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '391' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '392' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '393' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '394' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '395' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '396' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '397' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '398' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '399' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '400' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '401' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '402' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '403' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '404' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '405' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '406' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '407' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '408' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '409' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '410' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '411' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '412' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '413' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '414' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '415' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '416' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '417' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '418' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '419' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '420' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '421' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '422' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '423' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '424' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '425' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '426' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '427' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '428' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '429' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '430' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '431' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '432' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '433' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '434' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '435' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '436' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '437' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '438' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '439' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '440' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '441' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '442' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '443' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '444' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '445' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '446' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '447' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '448' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '449' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '450' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '451' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '452' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '453' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '454' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '455' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '456' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '457' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '458' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '459' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '460' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '461' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '462' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '463' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '464' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '465' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '466' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '467' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '468' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '469' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '470' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '471' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '472' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '473' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '474' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '475' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '476' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '477' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '478' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '479' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '480' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '481' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '482' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '483' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '484' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '485' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '486' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '487' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '488' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '489' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '490' },
            { account: '184657', name: 'นายสวรรค์  สุตะนา', cabinet: '1', shelf: '1', sequence: '491' },
            { account: '200164', name: 'นายสมหวัง  จ่าเมือง', cabinet: '1', shelf: '1', sequence: '492' },
            { account: '215702', name: 'นางสาวอรวรรณ์  เถิงใจ', cabinet: '1', shelf: '1', sequence: '493' },
            { account: '219864', name: 'นายบุญเลิศ  บุญมาก', cabinet: '1', shelf: '1', sequence: '494' },
            { account: '224595', name: 'นายปฐมพร  เกษไธสง', cabinet: '1', shelf: '1', sequence: '495' },
            { account: '225257', name: 'นายเศรษฐศักดิ์  พันธุ์พงศ์', cabinet: '1', shelf: '1', sequence: '496' },
            { account: '240771', name: 'นายสุวิทย์  หนองหาร', cabinet: '1', shelf: '1', sequence: '497' },
            { account: '246133', name: 'นางพนัชกร  เจริญศิริ', cabinet: '1', shelf: '1', sequence: '498' },
            { account: '252619', name: 'นายธีรพล  เนตรดำกูล', cabinet: '1', shelf: '1', sequence: '499' },
            { account: '268902', name: 'นางสาวแสงดาว  บุญปลอด', cabinet: '1', shelf: '1', sequence: '500' },
            { account: '270326', name: 'นายชาญ  สวัสดิ์พูน', cabinet: '1', shelf: '1', sequence: '501' },
            { account: '276202', name: 'นางรจนา  จะโรจน์รัมย์', cabinet: '1', shelf: '1', sequence: '502' },
            { account: '279840', name: 'นางสาวสกาวรัตน์  อุดมพล', cabinet: '1', shelf: '1', sequence: '503' },
            { account: '280795', name: 'นายสุทธิพงษ์  มุ่งดี', cabinet: '1', shelf: '1', sequence: '504' },
            { account: '288864', name: 'นางขนิษฐา  ตรีเมฆ', cabinet: '1', shelf: '1', sequence: '505' },
            { account: '41147', name: 'นายอำพร  เสงี่ยมทรัพย์', cabinet: '1', shelf: '1', sequence: '506' },
            { account: '41154', name: 'นายพรเจริญ  ธรรมสาร', cabinet: '1', shelf: '1', sequence: '507' },
            { account: '113126', name: 'นายสมชาย  อัมไพ', cabinet: '1', shelf: '1', sequence: '508' },
            { account: '114995', name: 'นายสำรวย  สุทินรัมย์', cabinet: '1', shelf: '1', sequence: '509' },
            { account: '117540', name: 'นายอินทราชัย ปักกุลนันท์', cabinet: '1', shelf: '1', sequence: '510' },
            { account: '118188', name: 'นายบุญเลี้ยง  สุดหล้า', cabinet: '1', shelf: '1', sequence: '511' },
            { account: '132740', name: 'นายคำศรี  พิธุรัก', cabinet: '1', shelf: '1', sequence: '512' },
            { account: '132857', name: 'นางศิริอรุณ  สีทาสี', cabinet: '1', shelf: '1', sequence: '513' },
            { account: '140526', name: 'นายนันชัย  แปโค', cabinet: '1', shelf: '1', sequence: '514' },
            { account: '146571', name: 'นางสัมฤทธิ์ ฉิมงาม', cabinet: '1', shelf: '1', sequence: '515' },
            { account: '161995', name: 'นายธนวัฒน์  ชุมรัมย์', cabinet: '1', shelf: '1', sequence: '516' },
            { account: '163719', name: 'นายสุภาพ  พร้อมจิตร', cabinet: '1', shelf: '1', sequence: '517' },
            { account: '164088', name: 'นายอนันต์  สายสอน', cabinet: '1', shelf: '1', sequence: '518' },
            { account: '177719', name: 'นายคำลอง  มั่นยืน', cabinet: '1', shelf: '1', sequence: '519' },
            { account: '179871', name: 'นายสมศักดิ์  เทียนวรรณ', cabinet: '1', shelf: '1', sequence: '520' },
            
        ]; // ปิด array farmers
        const casesRef = collection(db, "cases");
        let success = 0, fail = 0;
        for (const f of farmers) {
            try {
                await setDoc(doc(casesRef, f.account), {
                    name: f.name,
                    account: f.account,
                    cabinet: f.cabinet,
                    shelf: f.shelf,
                    sequence: f.sequence,
                    status: "อยู่ในห้องสำนวน",
                    user: "",
                    date: ""
                }, { merge: false });
                success++;
            } catch (e) {
                fail++;
                console.error("เพิ่ม/อัปเดตข้อมูลล้มเหลว:", f, e);
            }
        }
        alert(`เพิ่มหรืออัปเดตข้อมูลสำเร็จ ${success} รายการ, ล้มเหลว ${fail} รายการ`);
    } // ปิดฟังก์ชัน importFarmers
}); // ปิด event DOMContentLoaded
